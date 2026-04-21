// ================================================================
// API Layer — Kết nối tới các microservices qua LAN hoặc Docker
//
// Các URL được cấu hình qua biến môi trường VITE_* (build-time).
// Để thay đổi địa chỉ IP:
//   1. Sửa file .env ở thư mục gốc (tuan7_bai7/.env)
//   2. Rebuild Docker image: docker compose build frontend
// ================================================================

const PRODUCT_SERVICE   = import.meta.env.VITE_PRODUCT_SERVICE_URL   || 'http://192.168.1.100:8081';
const CART_SERVICE      = import.meta.env.VITE_CART_SERVICE_URL      || 'http://192.168.1.100:8082';
const ORDER_SERVICE     = import.meta.env.VITE_ORDER_SERVICE_URL     || 'http://192.168.1.100:8083';
const INVENTORY_SERVICE = import.meta.env.VITE_INVENTORY_SERVICE_URL || 'http://192.168.1.100:8084';


export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export const api = {
  INVENTORY_STREAM: `${INVENTORY_SERVICE}/stock/stream`,
  // ── PU1: Product Service ───────────────────────────────────
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(`${PRODUCT_SERVICE}/products`);
    return res.json();
  },

  // ── PU4: Inventory Service (Real-time stock) ───────────────
  getStock: async (productId: string): Promise<number> => {
    const res = await fetch(`${INVENTORY_SERVICE}/stock/${productId}`);
    const data = await res.json();
    return data.stock ?? 0;
  },

  // ── PU2: Cart Service ──────────────────────────────────────
  addToCart: async (userId: string, productId: string, quantity: number) => {
    const res = await fetch(`${CART_SERVICE}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId, quantity }),
    });
    return res.json();
  },

  getCart: async (userId: string): Promise<CartItem[]> => {
    const res = await fetch(`${CART_SERVICE}/cart/${userId}`);
    return res.json();
  },

  // ── PU3: Order Service ─────────────────────────────────────
  checkout: async (userId: string, idempotencyKey: string) => {
    const res = await fetch(`${ORDER_SERVICE}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  removeFromCart: async (userId: string, productId: string) => {
    const res = await fetch(`${CART_SERVICE}/cart/${userId}/${productId}`, {
      method: 'DELETE',
    });
    return res.json();
  },
};
