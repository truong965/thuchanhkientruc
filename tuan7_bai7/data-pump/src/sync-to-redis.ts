import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function sync() {
  console.log('Starting sync from DB to Redis...');

  const products = await prisma.product.findMany({
    include: {
      Inventory: true,
    },
  });

  if (products.length === 0) {
    console.log('No products found in DB. Please run seed first.');
    process.exit(0);
  }

  // Clear existing keys in Redis to avoid stale data during dev
  // In production, you would handle this more carefully
  const existingKeys = await redis.keys('product:*');
  const existingStockKeys = await redis.keys('stock:*');
  if (existingKeys.length > 0) await redis.del(...existingKeys);
  if (existingStockKeys.length > 0) await redis.del(...existingStockKeys);
  await redis.del('products');

  for (const p of products) {
    const productId = p.id;
    
    // 1. Store Product Info
    await redis.hset(`product:${productId}`, {
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price.toString(),
    });

    // 2. Add to Product ID list
    await redis.rpush('products', productId);

    // 3. Store Inventory (Hot data)
    const stock = p.Inventory?.available || 0;
    await redis.set(`stock:${productId}`, stock);

    console.log(`Synced Product: ${p.name} | Stock: ${stock}`);
  }

  console.log('Sync completed successfully!');
  process.exit(0);
}

sync().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
