const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:8001';
const MOVIE_SERVICE_URL = process.env.MOVIE_SERVICE_URL || 'http://movie-service:8002';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://booking-service:8003';

// Middleware Verify Token và truyền thông tin user sang Request Header
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log(`[API Gateway] Auth Success: User "${decoded.name}" (ID: ${decoded.userId})`);
        // Inject user data vào req để proxy đẩy tiếp sang backend
        req.headers['x-user-id'] = decoded.userId;
        req.headers['x-user-name'] = decoded.name;
        req.headers['x-user-username'] = decoded.username;
        req.headers['x-user-role'] = decoded.role;
        next();
    } catch (error) {
        console.warn(`[API Gateway] Auth Failed: ${error.message}`);
        return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    }
};

// Middleware kiểm tra quyền ADMIN
const adminMiddleware = (req, res, next) => {
    if (req.headers['x-user-role'] !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};

// ============= ROUTING VÀ PROXY =============

// 1. User Service (Không cần Auth cho login/register)
app.use('/api/users', createProxyMiddleware({
    target: USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/users': '' },
}));

// 2. Movie Service
// GET: Public, POST/PUT/DELETE: Admin Only
app.use('/api/movies', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return authMiddleware(req, res, () => adminMiddleware(req, res, next));
    }
    next();
}, createProxyMiddleware({
    target: MOVIE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/movies': '' },
}));

// 3. Booking Service (Bắt buộc PHẢI ĐĂNG NHẬP để lấy JWT)
app.use('/api/bookings', authMiddleware, createProxyMiddleware({
    target: BOOKING_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/bookings': '' },
    // Cho phép forward custom headers (x-user-id...)
    onProxyReq: (proxyReq, req) => {
        console.log(`[API Gateway] Proxying Booking Request to: ${BOOKING_SERVICE_URL}${proxyReq.path}`);
        if (req.headers['x-user-id']) proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        if (req.headers['x-user-name']) proxyReq.setHeader('x-user-name', req.headers['x-user-name']);
    }
}));

app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
    console.log(`- User Service Target: ${USER_SERVICE_URL}`);
    console.log(`- Movie Service Target: ${MOVIE_SERVICE_URL}`);
    console.log(`- Booking Service Target: ${BOOKING_SERVICE_URL}`);
});
