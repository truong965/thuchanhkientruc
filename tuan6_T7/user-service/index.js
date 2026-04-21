const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');
const morgan = require('morgan');
const { UserRegisteredEvent } = require('./src/events/EventContract');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const prisma = new PrismaClient();

const PORT = process.env.PORT || 8001;
const AMQP_URL = process.env.AMQP_URL || 'amqp://user:password@rabbitmq:5672';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

let channel = null;

async function connectRabbitMQ() {
    try {
        const connection = await amqp.connect(AMQP_URL);
        channel = await connection.createChannel();
        await channel.assertExchange('ticket_events', 'topic', { durable: true });
        console.log('User Service connected to RabbitMQ');
    } catch (error) {
        console.error('Failed to connect RabbitMQ in User Service', error);
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

app.post('/register', async (req, res) => {
    try {
        const { username, password, name } = req.body;
        const exist = await prisma.user.findUnique({ where: { username } });
        if (exist) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { username, passwordHash, name, role: 'USER' }
        });

        // Event-Driven: Publish event sau khi đăng ký
        const event = new UserRegisteredEvent({
            userId: user.id,
            username: user.username,
            name: user.name,
            role: user.role
        });
        publishEvent('USER_REGISTERED', event);

        res.status(201).json({ message: 'User registered successfully', user: { id: user.id, username: user.username, name: user.name } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({ where: { username } });
        
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ 
            userId: user.id, 
            name: user.name, 
            username: user.username, 
            role: user.role 
        }, JWT_SECRET, { expiresIn: '1d' });
        
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`User service running on port ${PORT}`);
});
