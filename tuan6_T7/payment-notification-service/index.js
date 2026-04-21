const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const amqp = require('amqplib');
const { PaymentCompletedEvent, BookingFailedEvent } = require('./src/events/EventContract');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const PORT = process.env.PORT || 8004;
const AMQP_URL = process.env.AMQP_URL || 'amqp://user:password@rabbitmq:5672';

let channel = null;

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'Payment & Notification Service', rabbitmq: !!channel });
});

async function startRabbitMQ() {
    try {
        const connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();
        await channel.assertExchange('ticket_events', 'topic', { durable: true });

        // Queue cho Payment Module (Xử lý thanh toán)
        const paymentQueue = await channel.assertQueue('payment_queue', { exclusive: false });
        channel.bindQueue(paymentQueue.queue, 'ticket_events', 'BOOKING_CREATED');

        // Queue cho Notification Module (Gửi thông báo)
        const notificationQueue = await channel.assertQueue('notification_queue', { exclusive: false });
        channel.bindQueue(notificationQueue.queue, 'ticket_events', 'order.payment.completed');
        channel.bindQueue(notificationQueue.queue, 'ticket_events', 'BOOKING_FAILED');

        console.log('[RabbitMQ] Payment & Notification Consumers are running...');
        
        // --- 1. PAYMENT MODULE ---
        channel.consume(paymentQueue.queue, (msg) => {
            if (msg !== null) {
                const data = JSON.parse(msg.content.toString());
                console.log(`\n--- [Payment Module] New Booking Received ---`);
                console.log(`Action: Processing payment for Booking ID: ${data.bookingId}`);
                console.log(`Details: User "${data.userName}", Movie ID: ${data.movieId}, Amount: $${data.amount}`);
                
                setTimeout(() => {
                    const isSuccess = Math.random() > 0.2; // 80% Success
                    
                    if (isSuccess) {
                        console.log(`Result: SUCCESS for Booking #${data.bookingId}`);
                        const event = new PaymentCompletedEvent({
                            bookingId: data.bookingId,
                            userName: data.userName,
                            amount: data.amount,
                            movieId: data.movieId,
                            quantity: data.quantity
                        });
                        publishEvent('order.payment.completed', event);
                        console.log(`Action: Event order.payment.completed emitted.`);
                    } else {
                        console.log(`Result: FAILED for Booking #${data.bookingId}`);
                        const event = new BookingFailedEvent({
                            bookingId: data.bookingId,
                            userName: data.userName,
                            reason: 'Insufficient funds or simulated failure'
                        });
                        publishEvent('BOOKING_FAILED', event);
                        console.log(`Action: Event BOOKING_FAILED emitted.`);
                    }
                    
                    channel.ack(msg);
                }, 2000);
            }
        }, { noAck: false });

        // --- 2. NOTIFICATION MODULE ---
        channel.consume(notificationQueue.queue, (msg) => {
            if (msg !== null) {
                const eventName = msg.fields.routingKey;
                const data = JSON.parse(msg.content.toString());
                
                console.log(`\n--- [Notification Module] Event Received: ${eventName} ---`);
                if (eventName === 'order.payment.completed') {
                    console.log(`>>> MESSAGE: "Hệ thống: Chúc mừng ${data.userName}! Đơn hàng #${data.bookingId} của bạn đã được thanh toán thành công."`);
                    console.log(`>>> LOG: User ${data.userName} đã đặt đơn #${data.bookingId} thành công!`);
                } else if (eventName === 'BOOKING_FAILED') {
                    console.log(`>>> MESSAGE: "Hệ thống: Rất tiếc ${data.userName}, giao dịch đơn #${data.bookingId} đã bị từ chối."`);
                    console.log(`>>> LOG: Giao dịch đơn #${data.bookingId} của User ${data.userName} thất bại!`);
                }
                
                channel.ack(msg);
            }
        }, { noAck: false });

    } catch (error) {
        console.error('Failed to connect RabbitMQ in Payment-Notification Service', error);
        setTimeout(startRabbitMQ, 5000);
    }
}

function publishEvent(routingKey, message) {
    if (channel) {
        channel.publish('ticket_events', routingKey, Buffer.from(JSON.stringify(message)));
        console.log(`[x] System Event Emitted: ${routingKey}`);
    }
}

app.listen(PORT, () => {
    console.log(`Payment & Notification Service (Microservice Standard) is running on port ${PORT}`);
    startRabbitMQ();
});
