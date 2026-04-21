import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 8083;
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://admin:adminpassword@rabbitmq:5672';
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:8084';

interface InventoryDecrementResponse {
  success: boolean;
  message?: string;
  remainingStock?: number;
}

app.use(cors());
app.use(express.json());

let channel: amqp.Channel;

// Kết nối RabbitMQ
// Kết nối RabbitMQ với cơ chế tự động kết nối lại
async function connectRabbitMQ() {
  try {
    console.log('[Order Service] Attempting to connect to RabbitMQ...');
    const connection = await amqp.connect(RABBITMQ_URL);
    
    connection.on('error', (err) => {
      console.error('[Order Service] RabbitMQ Connection Error:', err.message);
    });

    connection.on('close', () => {
      console.error('[Order Service] RabbitMQ Connection Closed. Reconnecting in 5s...');
      setTimeout(connectRabbitMQ, 5000);
    });

    channel = await connection.createChannel();
    await channel.assertQueue('order_created', { durable: true });
    
    console.log('Order Service connected to RabbitMQ (Ready to publish)');
  } catch (error) {
    console.error('[Order Service] RabbitMQ Connection Failed. Retrying in 5s...');
    setTimeout(connectRabbitMQ, 5000);
  }
}

// API: Checkout (Xử lý đặt hàng)
app.post('/checkout', async (req, res) => {
  const { userId } = req.body;
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  console.log(`[Order Service] POST /checkout - User: ${userId}${idempotencyKey ? `, Key: ${idempotencyKey}` : ''}`);

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId' });
  }

  try {
    // 0. Kiểm tra Idempotency Key (Chống trùng lặp yêu cầu từ Client)
    if (idempotencyKey) {
      const cachedResult = await redis.get(`idempotency:${idempotencyKey}`);
      if (cachedResult) {
        console.log(`[Order Service] Idempotency hit: returning cached result for key ${idempotencyKey}`);
        return res.json(JSON.parse(cachedResult));
      }
    }

    // 1. Lấy giỏ hàng từ Redis
    const cart = await redis.hgetall(`cart:${userId}`);
    if (!cart || Object.keys(cart).length === 0) {
      console.warn(`[Order Service] Checkout failed: Cart empty for user ${userId}`);
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cartItems = Object.entries(cart).map(([productId, quantity]) => ({
      productId,
      quantity: parseInt(quantity, 10),
    }));

    // 2. Trừ tồn kho tại PU4 (Sử dụng API của Inventory Service)
    const processedItems = [];
    let totalPrice = 0;

    for (const item of cartItems) {
      console.log(`[Order Service] Deducting stock for ${item.productId} (qty: ${item.quantity})...`);

      const productInfo = await redis.hgetall(`product:${item.productId}`);
      const price = parseFloat(productInfo.price || '0');

      const invResponse = await fetch(`${INVENTORY_SERVICE_URL}/stock/decrement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
        }),
      });

      const invResult = await invResponse.json() as InventoryDecrementResponse;

      if (!invResponse.ok || !invResult.success) {
        console.error(`[Order Service] Stock deduction failed for ${item.productId}: ${invResult.message}`);
        return res.status(400).json({
          error: `Item ${item.productId} out of stock or error: ${invResult.message}`
        });
      }

      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: price,
      });
      totalPrice += price * item.quantity;
    }

    // 3. Tạo Order ID
    const orderId = uuidv4();
    const orderData = {
      orderId,
      userId,
      items: processedItems,
      totalAmount: totalPrice,
      timestamp: new Date().toISOString(),
    };

    // 4. Publish Event "order_created" vào RabbitMQ để Data Pump ghi vào DB
    channel.sendToQueue('order_created', Buffer.from(JSON.stringify(orderData)), {
      persistent: true,
    });
    console.log(`[Order Service] Order ${orderId} published to RabbitMQ queue 'order_created'`);

    // 5. Xóa giỏ hàng sau khi đặt thành công
    await redis.del(`cart:${userId}`);

    const responseData = {
      message: 'Order created successfully',
      orderId,
      totalAmount: totalPrice
    };

    // 6. Cache kết quả Idempotency (TTL 24 giờ)
    if (idempotencyKey) {
      await redis.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(responseData));
    }

    console.log(`[Order Service] Checkout successful: Order ${orderId} created for User ${userId}`);
    res.json(responseData);

  } catch (error) {
    console.error('[Order Service] Checkout error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.listen(port, async () => {
  await connectRabbitMQ();
  console.log(`Order Service (PU3) running at http://localhost:${port}`);
});
