require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

const PORT = process.env.PORT || 8080;
const SERVICE_IP = process.env.SERVICE_IP || '0.0.0.0';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:8081';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:8084';
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:8083';
const FOOD_SERVICE_URL = process.env.FOOD_SERVICE_URL || 'http://food-service:8082';


app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin }));
app.use(express.json());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

function pickHeaders(req) {
  const headers = {};

  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  return headers;
}

function errorResponse(res, error, fallbackMessage) {
  if (error.response) {
    return res.status(error.response.status).json(error.response.data);
  }

  return res.status(502).json({ message: fallbackMessage });
}

app.get('/health', (_, res) => {
  res.json({ service: 'api-gateway', status: 'ok' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/register`, req.body, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'User service is unavailable');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/login`, req.body, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'User service is unavailable');
  }
});

app.get('/api/users/me', async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/me`, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'User service is unavailable');
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users`, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'User service is unavailable');
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${req.params.id}`, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'User service is unavailable');
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const response = await axios.post(`${PAYMENT_SERVICE_URL}/payments`, req.body, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Payment service is unavailable');
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const response = await axios.post(`${ORDER_SERVICE_URL}/orders`, req.body, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Order service is unavailable');
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/orders`, {
      headers: pickHeaders(req),
      params: req.query
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Order service is unavailable');
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/orders/${req.params.id}`, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Order service is unavailable');
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const response = await axios.patch(
      `${ORDER_SERVICE_URL}/orders/${req.params.id}/status`,
      req.body,
      { headers: pickHeaders(req) }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Order service is unavailable');
  }
});

app.get('/api/foods', async (req, res) => {
  try {
    const response = await axios.get(`${FOOD_SERVICE_URL}/foods`, {
      headers: pickHeaders(req),
      params: req.query
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Food service is unavailable');
  }
});
app.get('/api/foods/:id', async (req, res) => {
  try {
    const response = await axios.get(`${FOOD_SERVICE_URL}/foods/${req.params.id}`, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Food service is unavailable');
  }
});
app.post('/api/foods', async (req, res) => {
  try {
    const response = await axios.post(`${FOOD_SERVICE_URL}/foods`, req.body, {
      headers: pickHeaders(req)
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Food service is unavailable');
  }
});
app.put('/api/foods/:id', async (req, res) => {
  try {
    const response = await axios.put(
      `${FOOD_SERVICE_URL}/foods/${req.params.id}`,
      req.body,
      { headers: pickHeaders(req) }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    return errorResponse(res, error, 'Food service is unavailable');
  }
});
app.delete('/api/foods/:id', async (req, res) => {
  try {
    const response = await axios.delete(
      `${FOOD_SERVICE_URL}/foods/${req.params.id}`,
      { headers: pickHeaders(req) }
    );

    return res.status(response.status).send();
  } catch (error) {
    return errorResponse(res, error, 'Food service is unavailable');
  }
});


app.listen(PORT, SERVICE_IP, () => {
  console.log(`API Gateway running at http://${SERVICE_IP}:${PORT}`);
});
