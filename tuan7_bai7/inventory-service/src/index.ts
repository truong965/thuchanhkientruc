import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 8084;
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
const subRedis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

app.use(cors());
app.use(express.json());

// Quản lý các kết nối SSE đang mở
let clients: any[] = [];

// Subscribe để nhận thông báo thay đổi kho
subRedis.subscribe('stock_updates', (err) => {
  if (err) console.error('[Inventory Service] Sub error:', err);
});

subRedis.on('message', (channel, message) => {
  if (channel === 'stock_updates') {
    const data = JSON.parse(message);
    // Gửi data tới tất cả các client đang kết nối qua SSE
    clients.forEach(client => {
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    });
  }
});

// Lua Script: Kiểm tra và trừ tồn kho Atomic
// Trả về số lượng còn lại sau khi trừ, hoặc -1 nếu không đủ hàng
const decrementStockScript = `
  local currentStock = redis.call("GET", KEYS[1])
  if not currentStock or tonumber(currentStock) < tonumber(ARGV[1]) then
    return -1
  end
  return redis.call("DECRBY", KEYS[1], ARGV[1])
`;

// API Stream: Server-Sent Events (SSE) để đẩy stock realtime
app.get('/stock/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  console.log(`[Inventory Service] New SSE connection: ${clientId}`);

  req.on('close', () => {
    console.log(`[Inventory Service] SSE connection closed: ${clientId}`);
    clients = clients.filter(c => c.id !== clientId);
  });
});

// API: Lấy tồn kho (Real-time từ Redis)
app.get('/stock/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(`[Inventory Service] GET /stock/${productId}`);

    const stock = await redis.get(`stock:${productId}`);
    if (stock === null) {
      console.warn(`[Inventory Service] Stock look-up failed: Product ${productId} not found`);
      return res.status(404).json({ error: 'Product stock not found' });
    }

    res.json({ productId, stock: parseInt(stock, 10) });
  } catch (error) {
    console.error('[Inventory Service] Error fetching stock:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// API: Trừ tồn kho (Sử dụng Lua Script để chống oversell)
app.post('/stock/decrement', async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    console.log(`[Inventory Service] POST /stock/decrement - Product: ${productId}, Qty: ${quantity}`);

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Missing productId or quantity' });
    }

    const result = await redis.eval(
      decrementStockScript,
      1,
      `stock:${productId}`,
      quantity
    );

    if (result === -1) {
      console.warn(`[Inventory Service] Decrement failed: Insufficient stock for Product ${productId}`);
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock or product not in grid'
      });
    }

    console.log(`[Inventory Service] Success! Product ${productId} remaining stock: ${result}`);
    
    // Phát tán thay đổi tới channel Pub/Sub
    redis.publish('stock_updates', JSON.stringify({ productId, stock: result }));

    res.json({
      success: true,
      remainingStock: result,
      message: 'Stock decremented successfully'
    });
  } catch (error) {
    console.error('[Inventory Service] Error decrementing stock:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Inventory Service (PU4) running at http://localhost:${port}`);
});
