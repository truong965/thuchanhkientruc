const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const amqp = require('amqplib');
const morgan = require('morgan');
const { BookingCreatedEvent } = require('./src/events/EventContract');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const prisma = new PrismaClient();

const PORT = process.env.PORT || 8003;
const AMQP_URL = process.env.AMQP_URL || 'amqp://user:password@rabbitmq:5672';

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();
        await channel.assertExchange('ticket_events', 'topic', { durable: true });
        
        // Setup queue để nhận response từ Payment
        const q = await channel.assertQueue('', { exclusive: true });
        channel.bindQueue(q.queue, 'ticket_events', 'order.payment.completed');
        channel.bindQueue(q.queue, 'ticket_events', 'BOOKING_FAILED');

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                const eventName = msg.fields.routingKey;
                const data = JSON.parse(msg.content.toString());
                
                if (eventName === 'order.payment.completed') {
                    console.log(`[RabbitMQ] Received order.payment.completed for Booking ID: ${data.bookingId}`);
                    const updated = await prisma.booking.update({
                        where: { id: data.bookingId },
                        data: { status: 'SUCCESS' }
                    });
                    console.log(`[DB Update] Booking ${data.bookingId} status changed: PENDING -> SUCCESS`);
                } else if (eventName === 'BOOKING_FAILED') {
                    console.log(`[RabbitMQ] Received BOOKING_FAILED for Booking ID: ${data.bookingId}`);
                    const updated = await prisma.booking.update({
                        where: { id: data.bookingId },
                        data: { status: 'FAILED' }
                    });
                    console.log(`[DB Update] Booking ${data.bookingId} status changed: PENDING -> FAILED`);
                }
                channel.ack(msg);
            }
        });

        console.log('Booking Service connected to RabbitMQ and listening to payment events.');
    } catch (error) {
        console.error('Failed to connect RabbitMQ in Booking Service', error);
        setTimeout(connectRabbitMQ, 5000);
    }
}
connectRabbitMQ();

function publishEvent(routingKey, message) {
    if (channel) {
        channel.publish('ticket_events', routingKey, Buffer.from(JSON.stringify(message)));
        console.log(`[x] Sent event ${routingKey}`);
    }
}

// Lấy danh sách booking của user (Cần Auth - tin tưởng Header từ Gateway)
app.get('/', async (req, res) => {
    try {
        // userId được decode từ JWT bằng API Gateway và pass qua Header
        const userId = req.headers['x-user-id'];
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const bookings = await prisma.booking.findMany({
            where: { userId: userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Tạo mới booking (Cần Auth - tin tưởng Header từ Gateway)
app.post('/', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const userName = req.headers['x-user-name'];

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized. Need User header from API Gateway' });
        }

        const { movieId, quantity, totalPrice } = req.body;
        console.log(`[Request] Checking seats: MovieID=${movieId}, SeatsRequested=${quantity}`);

        // --- CHECK SEATS (Internal Call to Movie Service) ---
        try {
            const movieServiceTarget = process.env.MOVIE_SERVICE_URL || 'http://movie-service:8002';
            const movieRes = await fetch(`${movieServiceTarget}/${movieId}`);
            if (!movieRes.ok) throw new Error('Movie not found');
            const movie = await movieRes.json();
            
            if (movie.availableSeats < quantity) {
                console.warn(`[Failed] Not enough seats for Movie ${movieId}. Available: ${movie.availableSeats}, Requested: ${quantity}`);
                return res.status(400).json({ error: `Not enough seats. Available: ${movie.availableSeats}` });
            }
        } catch (err) {
            console.error('[Error] Failed to verify seats with Movie Service:', err.message);
            return res.status(500).json({ error: 'Could not verify seat availability' });
        }

        console.log(`[Request] Creating booking: User=${userName} (ID=${userId}), MovieID=${movieId}, Seats=${quantity}`);

        const booking = await prisma.booking.create({
            data: {
                userId,
                userName,
                movieId,
                quantity,
                totalPrice,
                status: 'PENDING'
            }
        });
        console.log(`[DB Success] Booking created in DB with ID: ${booking.id}, initial status: PENDING`);

        // Publish Event (Không gọi API qua Payment Service)
        const eventData = new BookingCreatedEvent({
            bookingId: booking.id,
            userId: booking.userId,
            userName: booking.userName,
            movieId: booking.movieId,
            quantity: booking.quantity,
            amount: booking.totalPrice
        });
        publishEvent('BOOKING_CREATED', eventData);
        console.log(`[RabbitMQ] Event BOOKING_CREATED published for Booking ID: ${booking.id}`);

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Booking service running on port ${PORT}`);
});
