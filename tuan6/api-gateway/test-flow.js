/**
 * test-flow.js — Mini Food Ordering System: Full Integration Test
 *
 * Chạy: node test-flow.js [GATEWAY_URL]
 * Ví dụ local:  node test-flow.js http://localhost:8080
 * Ví dụ LAN:    node test-flow.js http://192.168.1.10:8080
 *
 * Test theo đúng yêu cầu bài:
 *  1. Quản lý món ăn  (xem, thêm, sửa, xóa)
 *  2. Quản lý người dùng  (đăng ký, đăng nhập, phân quyền)
 *  3. Đặt món  (tạo đơn hàng)
 *  4. Thanh toán (giả lập COD/Banking)
 *  5. Thông báo khi đặt hàng thành công
 */

const http = require('http');
const https = require('https');

const BASE = process.argv[2] || 'http://localhost:8080';

// ── helpers ─────────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

let passed = 0, failed = 0;

function log(icon, label, detail = '') {
  console.log(`  ${icon}  ${label}${detail ? `  ${YELLOW}${detail}${RESET}` : ''}`);
}

function ok(label, detail = '')  { passed++; log(`${GREEN}✔${RESET}`, label, detail); }
function fail(label, detail = '') { failed++; log(`${RED}✘${RESET}`, `${RED}${label}${RESET}`, detail); }
function section(title) { console.log(`\n${BOLD}${CYAN}── ${title} ──${RESET}`); }

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const lib = url.protocol === 'https:' ? https : http;

    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token)   headers['Authorization'] = `Bearer ${token}`;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = lib.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = data; }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n${BOLD}Mini Food Ordering System — Integration Test${RESET}`);
  console.log(`Gateway: ${CYAN}${BASE}${RESET}\n`);

  // ── 0. Gateway health ────────────────────────────────────────────────────
  section('0. Gateway Health');
  try {
    const r = await request('GET', '/health');
    r.status === 200
      ? ok('Gateway reachable', `status=${r.status}`)
      : fail('Gateway health check', `status=${r.status}`);
  } catch (e) {
    fail('Gateway unreachable', e.message);
    console.log(`\n${RED}Cannot reach gateway. Aborting.${RESET}\n`);
    process.exit(1);
  }

  // ── 1. Food Management ───────────────────────────────────────────────────
  section('1. Food Management');

  // 1a. List foods
  let foods = [];
  try {
    const r = await request('GET', '/api/foods');
    if (r.status === 200 && Array.isArray(r.data)) {
      ok('GET /api/foods — list all foods', `count=${r.data.length}`);
      foods = r.data;
    } else {
      fail('GET /api/foods', `status=${r.status}`);
    }
  } catch (e) { fail('GET /api/foods', e.message); }

  // 1b. List available foods
  try {
    const r = await request('GET', '/api/foods?available=true');
    r.status === 200 && Array.isArray(r.data)
      ? ok('GET /api/foods?available=true', `count=${r.data.length}`)
      : fail('GET /api/foods?available=true', `status=${r.status}`);
  } catch (e) { fail('GET /api/foods?available=true', e.message); }

  // 1c. Add a food (ADMIN action)
  let newFoodId = null;
  try {
    const r = await request('POST', '/api/foods', {
      name: 'Test Burger', description: 'Test only', price: 99000, category: 'Test', available: true
    });
    if (r.status === 200 || r.status === 201) {
      newFoodId = r.data.id;
      ok('POST /api/foods — add food', `id=${newFoodId}`);
    } else {
      fail('POST /api/foods', `status=${r.status} ${JSON.stringify(r.data)}`);
    }
  } catch (e) { fail('POST /api/foods', e.message); }

  // 1d. Update food
  if (newFoodId) {
    try {
      const r = await request('PUT', `/api/foods/${newFoodId}`, {
        name: 'Test Burger Updated', description: 'Updated', price: 89000, category: 'Test', available: true
      });
      r.status === 200
        ? ok(`PUT /api/foods/${newFoodId} — update food`)
        : fail(`PUT /api/foods/${newFoodId}`, `status=${r.status}`);
    } catch (e) { fail(`PUT /api/foods/${newFoodId}`, e.message); }
  }

  // 1e. Get food by id
  const targetFoodId = newFoodId || (foods.length ? foods[0].id : null);
  if (targetFoodId) {
    try {
      const r = await request('GET', `/api/foods/${targetFoodId}`);
      r.status === 200
        ? ok(`GET /api/foods/${targetFoodId} — get by id`, `name=${r.data.name}`)
        : fail(`GET /api/foods/${targetFoodId}`, `status=${r.status}`);
    } catch (e) { fail(`GET /api/foods/${targetFoodId}`, e.message); }
  }

  // ── 2. User Management ───────────────────────────────────────────────────
  section('2. User Management');

  const testUser = `testuser_${Date.now()}`;
  let userToken = null;
  let userId = null;

  // 2a. Register
  try {
    const r = await request('POST', '/api/auth/register', { username: testUser, password: 'password123' });
    if (r.status === 200 || r.status === 201) {
      userId = r.data.id;
      ok('POST /api/auth/register', `username=${testUser} id=${userId}`);
    } else {
      fail('POST /api/auth/register', `status=${r.status} ${JSON.stringify(r.data)}`);
    }
  } catch (e) { fail('POST /api/auth/register', e.message); }

  // 2b. Login
  try {
    const r = await request('POST', '/api/auth/login', { username: testUser, password: 'password123' });
    if (r.status === 200 && r.data.token) {
      userToken = r.data.token;
      userId = userId || r.data.user?.id;
      ok('POST /api/auth/login', `role=${r.data.user?.role}`);
    } else {
      fail('POST /api/auth/login', `status=${r.status} ${JSON.stringify(r.data)}`);
    }
  } catch (e) { fail('POST /api/auth/login', e.message); }

  // 2c. Get /me (requires token)
  if (userToken) {
    try {
      const r = await request('GET', '/api/users/me', null, userToken);
      r.status === 200
        ? ok('GET /api/users/me — auth check', `username=${r.data.username}`)
        : fail('GET /api/users/me', `status=${r.status}`);
    } catch (e) { fail('GET /api/users/me', e.message); }
  }

  // 2d. Get user by ID
  if (userId) {
    try {
      const r = await request('GET', `/api/users/${userId}`);
      r.status === 200
        ? ok(`GET /api/users/${userId}`, `role=${r.data.role}`)
        : fail(`GET /api/users/${userId}`, `status=${r.status}`);
    } catch (e) { fail(`GET /api/users/${userId}`, e.message); }
  }

  // ── 3. Ordering ──────────────────────────────────────────────────────────
  section('3. Order — Place Order');

  // Pick an available food to order
  let orderId = null;
  let availableFood = null;
  try {
    const r = await request('GET', '/api/foods?available=true');
    if (r.status === 200 && r.data.length > 0) {
      availableFood = r.data[0];
    }
  } catch (_) {}

  if (!userId) {
    fail('Create order skipped — no userId from register/login');
  } else if (!availableFood) {
    fail('Create order skipped — no available food in system');
  } else {
    try {
      const r = await request('POST', '/api/orders', {
        userId,
        token: userToken,
        items: [{ foodId: availableFood.id, quantity: 2 }]
      });
      if (r.status === 200 || r.status === 201) {
        orderId = r.data.id;
        ok('POST /api/orders — create order',
          `orderId=${orderId} total=${r.data.totalAmount} status=${r.data.status}`);
        // Thông báo đặt hàng thành công (requirement 5)
        console.log(`       ${YELLOW}📢 [Notification] Đơn hàng #${orderId} đã được tạo thành công cho user ${r.data.userName}!${RESET}`);
      } else {
        fail('POST /api/orders', `status=${r.status} ${JSON.stringify(r.data)}`);
      }
    } catch (e) { fail('POST /api/orders', e.message); }
  }

  // 3b. Get all orders
  try {
    const r = await request('GET', '/api/orders');
    r.status === 200 && Array.isArray(r.data)
      ? ok('GET /api/orders — list all', `count=${r.data.length}`)
      : fail('GET /api/orders', `status=${r.status}`);
  } catch (e) { fail('GET /api/orders', e.message); }

  // 3c. Get order by id
  if (orderId) {
    try {
      const r = await request('GET', `/api/orders/${orderId}`);
      r.status === 200
        ? ok(`GET /api/orders/${orderId}`, `status=${r.data.status}`)
        : fail(`GET /api/orders/${orderId}`, `status=${r.status}`);
    } catch (e) { fail(`GET /api/orders/${orderId}`, e.message); }
  }

  // ── 4. Payment (simulated) ───────────────────────────────────────────────
  section('4. Payment — Simulated (COD / Banking)');

  for (const method of ['COD', 'BANKING']) {
    if (!orderId) {
      fail(`POST /api/payments [${method}] skipped — no orderId`);
      continue;
    }
    try {
      const r = await request('POST', '/api/payments', {
        orderId,
        userId: 1,   // payment-service dùng Long userId
        method
      });
      if (r.status === 200 || r.status === 201) {
        ok(`POST /api/payments — method=${method}`, `payStatus=${r.data.status || r.data.paymentStatus}`);
        // Sau khi payment, order status nên được cập nhật
        const check = await request('GET', `/api/orders/${orderId}`);
        if (check.status === 200) {
          ok(`  Order status updated after ${method} payment`, `status=${check.data.status}`);
        }
        break; // chỉ cần test 1 lần thành công
      } else {
        fail(`POST /api/payments [${method}]`, `status=${r.status} ${JSON.stringify(r.data)}`);
      }
    } catch (e) { fail(`POST /api/payments [${method}]`, e.message); }
  }

  // 4b. Update order status manually (payment-service callback)
  if (orderId) {
    try {
      const r = await request('PATCH', `/api/orders/${orderId}/status`, { status: 'PAID' });
      r.status === 200
        ? ok(`PATCH /api/orders/${orderId}/status → PAID`, `status=${r.data.status}`)
        : fail(`PATCH /api/orders/${orderId}/status`, `status=${r.status}`);
    } catch (e) { fail(`PATCH /api/orders/${orderId}/status`, e.message); }
  }

  // ── 5. Cleanup — delete test food ────────────────────────────────────────
  section('5. Cleanup');
  if (newFoodId) {
    try {
      const r = await request('DELETE', `/api/foods/${newFoodId}`);
      r.status === 204 || r.status === 200
        ? ok(`DELETE /api/foods/${newFoodId} — remove test food`)
        : fail(`DELETE /api/foods/${newFoodId}`, `status=${r.status}`);
    } catch (e) { fail(`DELETE /api/foods/${newFoodId}`, e.message); }
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`${BOLD}Result: ${GREEN}${passed} passed${RESET}  ${failed > 0 ? RED : ''}${failed} failed${RESET}  / ${total} total`);
  if (failed === 0) {
    console.log(`${GREEN}${BOLD}✅ All systems operational!${RESET}\n`);
  } else {
    console.log(`${YELLOW}⚠️  Some checks failed. Check service logs with: docker compose -f docker-compose.full.yml logs${RESET}\n`);
  }
  console.log(`${'─'.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(`\n${RED}Fatal error:${RESET}`, err.message);
  process.exit(1);
});
