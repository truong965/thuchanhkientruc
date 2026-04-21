import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 8081;
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

app.use(cors());
app.use(express.json());

// API: Lấy danh sách sản phẩm (Từ Redis)
app.get('/products', async (req, res) => {
  try {
    console.log('[Product Service] GET /products');
    const productIds = await redis.lrange('products', 0, -1);

    const pipeline = redis.pipeline();
    productIds.forEach((id) => {
      pipeline.hgetall(`product:${id}`);
    });

    const results = await pipeline.exec();
    const products = results?.map(([err, data]) => data) || [];

    console.log(`[Product Service] Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('[Product Service] Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Lấy chi tiết sản phẩm (Từ Redis)
app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Product Service] GET /products/${id}`);

    const product = await redis.hgetall(`product:${id}`);
    if (!product || Object.keys(product).length === 0) {
      console.warn(`[Product Service] Product ${id} not found`);
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('[Product Service] Error fetching product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Product Service (PU1) running at http://localhost:${port}`);
});
