require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin }));
app.use(express.json());

app.get('/health', (_, res) => {
  res.json({ service: 'user-service', status: 'ok' });
});

app.use(authRoutes);
app.use(userRoutes);

module.exports = app;
