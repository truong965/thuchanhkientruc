import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

// Log ngay lập tức để xác nhận script đã chạy
console.log('>>> [Prepare Test] Script starting...');

// Tìm file .env dù chạy từ thư mục nào
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function main() {
  console.log('\n======================================');
  console.log('  Flash Sale — Prepare Test Data');
  console.log('======================================\n');

  // ── 1. Xóa dữ liệu cũ trong PostgreSQL ────────────────────────────────────
  console.log('[1/4] Clearing old data in PostgreSQL...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  console.log('      ✅ PostgreSQL cleared.');

  // ── 2. Xóa toàn bộ Redis ──────────────────────────────────────────────────
  console.log('[2/4] Flushing Redis...');
  await redis.flushall();
  console.log('      ✅ Redis flushed.');

  // ── 3. Seed Products vào PostgreSQL + Redis ────────────────────────────────
  const products = [
    { name: 'iPhone 15 Pro Max',         price: 1500, stock: 10 },
    { name: 'Samsung Galaxy S24 Ultra',  price: 1200, stock: 20 },
    { name: 'MacBook Pro M3',            price: 2500, stock: 5  },
    { name: 'Sony WH-1000XM5',           price: 350,  stock: 50 },
  ];

  console.log(`[3/4] Seeding ${products.length} products into PostgreSQL & Redis...`);

  for (const p of products) {
    // Tạo trong PostgreSQL
    const product = await prisma.product.create({
      data: {
        name:  p.name,
        price: p.price,
        stock: p.stock,
      },
    });

    await prisma.inventory.create({
      data: {
        productId: product.id,
        available: p.stock,
      },
    });

    // Seed vào Redis Data Grid
    // - Hash product:{id}  → dùng bởi Product Service & Order Service (lấy giá)
    await redis.hset(`product:${product.id}`, {
      id:    product.id,
      name:  product.name,
      price: product.price.toString(),
      stock: p.stock.toString(),
    });

    // - Key stock:{id}     → dùng bởi Inventory Service (Lua atomic decrement)
    await redis.set(`stock:${product.id}`, p.stock);

    // - List "products"    → dùng bởi Product Service (GET /products)
    await redis.rpush('products', product.id);

    console.log(`      + [${product.id}] ${product.name} | Price: $${p.price} | Stock: ${p.stock}`);
  }

  console.log('      ✅ Seeding complete.\n');

  // ── 4. Kiểm tra lại Redis ─────────────────────────────────────────────────
  console.log('[4/4] Verifying Redis data...');
  const productIds = await redis.lrange('products', 0, -1);
  console.log(`      products list → [${productIds.join(', ')}]`);

  for (const id of productIds) {
    const stock = await redis.get(`stock:${id}`);
    const name  = await redis.hget(`product:${id}`, 'name');
    console.log(`      stock:${id} → ${stock}  (${name})`);
  }

  console.log('\n✅ All test data ready! You can now run: node stress-test.js\n');
}

main()
  .catch(err => {
    console.error('[Prepare Test] ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    // Quan trọng: disconnect để script không bị treo
    await prisma.$disconnect();
    await redis.quit();
  });
