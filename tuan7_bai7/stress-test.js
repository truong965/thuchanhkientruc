/**
 * Stress Test Script for Flash Sale
 * Simulates concurrent checkout requests for a limited stock product.
 *
 * Usage:
 *   1. node stress-test.js             — test với stock đầu tiên tìm được
 *   2. node stress-test.js <productId> — test với productId cụ thể
 */
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:8083';

const TOTAL_REQUESTS = 50; // Tổng số request đồng thời

async function runTest() {
  // ── 0. In danh sách sản phẩm hiện có trong Redis ──────────────────────────
  console.log('\n======================================');
  console.log('  Flash Sale — Stress Test');
  console.log('======================================\n');

  const productIds = await redis.lrange('products', 0, -1);
  if (productIds.length === 0) {
    console.error('❌ No products found in Redis.');
    console.error('   Please run: cd data-pump && npx ts-node src/prepare-test.ts');
    process.exit(1);
  }

  console.log('[Available Products]');
  for (const id of productIds) {
    const name  = await redis.hget(`product:${id}`, 'name');
    const stock = await redis.get(`stock:${id}`);
    console.log(`  - ${id} | ${name} | Stock: ${stock}`);
  }
  console.log('');

  // ── 1. Chọn sản phẩm để test ──────────────────────────────────────────────
  // Ưu tiên productId truyền từ CLI, nếu không thì lấy sản phẩm có stock ít nhất để dễ test oversell
  let targetProductId = process.argv[2];

  if (targetProductId) {
    const exists = await redis.exists(`stock:${targetProductId}`);
    if (!exists) {
      console.error(`❌ ProductId "${targetProductId}" not found in Redis.`);
      process.exit(1);
    }
  } else {
    // Tự động chọn sản phẩm có stock nhỏ nhất để test anti-oversell
    let minStock = Infinity;
    for (const id of productIds) {
      const stock = parseInt(await redis.get(`stock:${id}`), 10);
      if (stock < minStock) {
        minStock = stock;
        targetProductId = id;
      }
    }
  }

  const productName    = await redis.hget(`product:${targetProductId}`, 'name');
  const initialStock   = parseInt(await redis.get(`stock:${targetProductId}`), 10);

  console.log(`[Target Product]`);
  console.log(`  ID:            ${targetProductId}`);
  console.log(`  Name:          ${productName}`);
  console.log(`  Initial Stock: ${initialStock}`);
  console.log(`  Requests:      ${TOTAL_REQUESTS}`);
  console.log('');

  if (initialStock <= 0) {
    console.error('❌ Stock is already 0. Run prepare-test.ts to reset data.');
    process.exit(1);
  }

  // ── 2. Chuẩn bị giỏ hàng cho tất cả user (đồng bộ, trước khi test) ───────
  console.log('[Step 1] Preparing carts in Redis...');
  const pipeline = redis.pipeline();
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    pipeline.hset(`cart:user_${i}`, targetProductId, 1);
  }
  await pipeline.exec();
  console.log(`         ✅ ${TOTAL_REQUESTS} carts prepared.\n`);

  // ── 3. Gửi request đồng thời ──────────────────────────────────────────────
  console.log(`[Step 2] Sending ${TOTAL_REQUESTS} concurrent checkout requests...\n`);
  const startTime = Date.now();

  const requests = [];
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const userId         = `user_${i}`;
    const idempotencyKey = i % 2 === 0 ? `idem_key_${i}_${Date.now()}` : null;

    const req = fetch(`${ORDER_SERVICE_URL}/checkout`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify({ userId }),
    })
      .then(async res => {
        const data = await res.json();
        if (res.ok) return { status: 'success', userId, orderId: data.orderId };
        return { status: 'error', userId, reason: data.error || 'unknown' };
      })
      .catch(err => ({ status: 'error', userId, reason: err.message }));

    requests.push(req);
  }

  const results  = await Promise.all(requests);
  const elapsed  = ((Date.now() - startTime) / 1000).toFixed(2);

  // ── 4. Phân tích kết quả ───────────────────────────────────────────────────
  const successes        = results.filter(r => r.status === 'success');
  const errors           = results.filter(r => r.status === 'error');
  const outOfStock       = errors.filter(r => r.reason && r.reason.toLowerCase().includes('stock'));
  const otherErrors      = errors.filter(r => !r.reason || !r.reason.toLowerCase().includes('stock'));

  const finalStock = parseInt(await redis.get(`stock:${targetProductId}`), 10);

  // Nhóm lỗi để dễ đọc
  const errorGroups = {};
  for (const e of errors) {
    const key = e.reason || 'unknown';
    errorGroups[key] = (errorGroups[key] || 0) + 1;
  }

  console.log('======================================');
  console.log('  Stress Test Results');
  console.log('======================================');
  console.log(`  Elapsed Time:    ${elapsed}s`);
  console.log(`  Total Sent:      ${TOTAL_REQUESTS}`);
  console.log(`  ✅ Success:      ${successes.length}`);
  console.log(`  ❌ Failed:       ${errors.length}`);
  console.log(`     ↳ Out of stock:   ${outOfStock.length}`);
  console.log(`     ↳ Other errors:   ${otherErrors.length}`);
  if (otherErrors.length > 0) {
    for (const [reason, count] of Object.entries(errorGroups)) {
      if (!reason.toLowerCase().includes('stock')) {
        console.log(`       • "${reason}" × ${count}`);
      }
    }
  }
  console.log('');
  console.log(`  Initial Stock:   ${initialStock}`);
  console.log(`  Final Stock:     ${finalStock}`);
  console.log('');

  // ── 5. Kiểm tra Anti-Oversell ─────────────────────────────────────────────
  console.log('======================================');
  console.log('  Anti-Oversell Verification');
  console.log('======================================');

  let passed = true;

  if (finalStock < 0) {
    console.error('  ❌ FAIL: Stock is NEGATIVE — Oversell detected!');
    passed = false;
  }

  if (successes.length > initialStock) {
    console.error(`  ❌ FAIL: Success count (${successes.length}) > Initial stock (${initialStock}) — Oversell detected!`);
    passed = false;
  }

  if (successes.length + finalStock !== initialStock) {
    console.warn(`  ⚠️  WARN: success(${successes.length}) + finalStock(${finalStock}) ≠ initialStock(${initialStock})`);
    console.warn('       This may be expected if some items failed before Redis decrement,');
    console.warn('       but could indicate a race condition. Check order-service logs.');
  }

  if (passed) {
    console.log(`  ✅ PASS: Anti-oversell verified!`);
    console.log(`       ${successes.length} orders succeeded, ${finalStock} units remaining.`);
  }

  console.log('');
  await redis.quit();
  // Để Event Loop tự kết thúc hoặc đợi 100ms để đóng sạch sẽ các handles trên Windows
  setTimeout(() => process.exit(passed ? 0 : 1), 100);
}

runTest().catch(async err => {
  console.error('Stress test crashed:', err);
  await redis.quit().catch(() => {});
  process.exit(1);
});
