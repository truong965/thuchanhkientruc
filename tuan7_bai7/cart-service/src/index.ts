import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 8082;
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

app.use(cors());
app.use(express.json());

// API: Thêm vào giỏ hàng (Lưu vào Redis)
app.post('/cart/add', async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;
    console.log(`[Cart Service] POST /cart/add - User: ${userId}, Product: ${productId}, Qty: ${quantity}`);

    if (!userId || !productId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Kiểm tra sản phẩm tồn tại trong Redis
    const productExists = await redis.exists(`product:${productId}`);
    if (!productExists) {
      console.warn(`[Cart Service] Add to cart failed: Product ${productId} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }

    await redis.hincrby(`cart:${userId}`, productId, quantity);
    console.log(`[Cart Service] Product ${productId} added to cart for User ${userId}`);

    res.json({ message: 'Added to cart success' });
  } catch (error) {
    console.error('[Cart Service] Error adding to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Lấy giỏ hàng
app.get('/cart/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[Cart Service] GET /cart/${userId}`);

    const items = await redis.hgetall(`cart:${userId}`);
    const cartItems = Object.entries(items).map(([productId, quantity]) => ({
      productId,
      quantity: parseInt(quantity, 10),
    }));

    console.log(`[Cart Service] Found ${cartItems.length} items for User ${userId}`);
    res.json(cartItems);
  } catch (error) {
    console.error('[Cart Service] Error fetching cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Xóa sản phẩm khỏi giỏ hàng
app.delete('/cart/:userId/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    console.log(`[Cart Service] DELETE /cart/${userId}/${productId}`);

    await redis.hdel(`cart:${userId}`, productId);
    console.log(`[Cart Service] Product ${productId} removed from cart for User ${userId}`);

    res.json({ message: 'Removed from cart success' });
  } catch (error) {
    console.error('[Cart Service] Error removing from cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Cart Service (PU2) running at http://localhost:${port}`);
});
