const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const amqp = require('amqplib');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const prisma = new PrismaClient();

const PORT = process.env.PORT || 8002;
const AMQP_URL = process.env.AMQP_URL || 'amqp://user:password@rabbitmq:5672';

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();
        await channel.assertExchange('ticket_events', 'topic', { durable: true });
        
        // --- CONSUME PAYMENT EVENTS ---
        // Sử dụng Named Queue để tránh mất mát tin nhắn khi service restart
        const q = await channel.assertQueue('movie_inventory_queue', { durable: true });
        
        // Bind với routing key mới
        channel.bindQueue(q.queue, 'ticket_events', 'order.payment.completed');
        
        console.log(`[RabbitMQ] Movie Service listening on queue: ${q.queue}`);

        channel.consume(q.queue, async (msg) => {
            if (msg !== null) {
                try {
                    const routingKey = msg.fields.routingKey;
                    const data = JSON.parse(msg.content.toString());
                    console.log(`\n[Movie Service] Event Received: ${routingKey}`);
                    console.log(`[Data] Booking: ${data.bookingId}, Movie: ${data.movieId}, Qty: ${data.quantity}`);
                    
                    if (routingKey === 'order.payment.completed') {
                        const qty = parseInt(data.quantity);
                        const movieId = parseInt(data.movieId);

                        if (isNaN(qty) || isNaN(movieId)) {
                           throw new Error(`Invalid data types: qty=${data.quantity}, movieId=${data.movieId}`);
                        }

                        console.log(`[Action] Attempting to decrement ${qty} seats for Movie ID ${movieId}...`);

                        // ATOMIC UPDATE: Chỉ trừ ghế nếu availableSeats >= quantity
                        const result = await prisma.$executeRaw`UPDATE "Movie" SET "availableSeats" = "availableSeats" - ${qty} WHERE id = ${movieId} AND "availableSeats" >= ${qty}`;

                        if (result === 0) {
                            console.error(`[CRITICAL] Seat exhaust! Movie ${movieId} has no room for ${qty} more seats.`);
                            channel.publish('ticket_events', 'BOOKING_FAILED', Buffer.from(JSON.stringify({
                                bookingId: data.bookingId,
                                reason: 'Sold out during payment'
                            })));
                        } else {
                            console.log(`[Success] Seats decremented for Movie ${movieId}. Rows affected: ${result}`);
                        }
                    }
                } catch (err) {
                    console.error('[Error] Processing RabbitMQ message:', err.message);
                }
                channel.ack(msg);
            }
        });

        console.log('Movie Service RabbitMQ Setup Complete.');
    } catch (error) {
        console.error('Failed to connect RabbitMQ in Movie Service', error);
        setTimeout(connectRabbitMQ, 5000);
    }
}
connectRabbitMQ();

// Lấy danh sách phim
app.get('/', async (req, res) => {
    try {
        const movies = await prisma.movie.findMany();
        res.json(movies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Lấy 1 phim cụ thể
app.get('/:id', async (req, res) => {
    try {
        const movie = await prisma.movie.findUnique({ where: { id: parseInt(req.params.id) }});
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.json(movie);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Thêm phim
app.post('/', async (req, res) => {
    try {
        const { title, description, price, availableSeats } = req.body;
        const movie = await prisma.movie.create({
            data: { title, description, price, availableSeats }
        });
        res.status(201).json(movie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Cập nhật phim
app.put('/:id', async (req, res) => {
    try {
        const { title, description, price, availableSeats } = req.body;
        const movie = await prisma.movie.update({
            where: { id: parseInt(req.params.id) },
            data: { title, description, price, availableSeats }
        });
        res.json(movie);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Xóa phim
app.delete('/:id', async (req, res) => {
    try {
        await prisma.movie.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ message: 'Movie deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Movie service running on port ${PORT}`);
});
