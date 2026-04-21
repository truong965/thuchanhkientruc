import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react';
import { api } from './api';
import type { Product, CartItem } from './api';
import { ProductCard } from './components/ProductCard';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';

// Lấy hoặc tạo User ID ngẫu nhiên để hỗ trợ test đa người dùng
const getUserId = () => {
  const STORAGE_KEY = 'flashsale_user_id';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = `user_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
};

const USER_ID = getUserId();

type View = 'products' | 'cart';

function App() {
  const [view, setView] = useState<View>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState<string | null>(null);
  const [isUpdatingCart, setIsUpdatingCart] = useState<string | null>(null);

  // 1. Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        const prodData = await api.getProducts();
        setProducts(prodData);
        
        const stockData: Record<string, number> = {};
        for (const p of prodData) {
          stockData[p.id] = await api.getStock(p.id);
        }
        setStocks(stockData);

        const cartData = await api.getCart(USER_ID);
        setCart(cartData);
      } catch (err) {
        addToast('error', 'Failed to initial load data');
      }
    };
    init();
  }, []);

  // 2. Real-time Stock Updates via SSE (NEW)
  useEffect(() => {
    if (products.length === 0) return;

    console.log('[SSE] Connecting to stock stream...');
    const eventSource = new EventSource(`${api.INVENTORY_STREAM || 'http://localhost:8084/stock/stream'}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[SSE] Stock Update Received:', data);
        
        setStocks((prev) => ({
          ...prev,
          [data.productId]: data.stock
        }));
      } catch (err) {
        console.error('[SSE] Failed to parse message', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error', err);
      eventSource.close();
    };

    return () => {
      console.log('[SSE] Closing connection...');
      eventSource.close();
    };
  }, [products]);

  // 3. Handlers
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddToCart = async (product: Product) => {
    setIsAddingProduct(product.id);
    try {
      await api.addToCart(USER_ID, product.id, 1);
      const updatedCart = await api.getCart(USER_ID);
      setCart(updatedCart);
      addToast('success', `Added ${product.name} to cart`);
    } catch (err) {
      addToast('error', 'Failed to add to cart');
    } finally {
      setIsAddingProduct(null);
    }
  };

  const handleUpdateQuantity = async (productId: string, delta: number) => {
    const currentItem = cart.find(item => item.productId === productId);
    if (!currentItem) return;

    const newQty = currentItem.quantity + delta;
    const availableStock = stocks[productId] ?? 0;

    // Ngăn chặn tăng quá số lượng tồn kho
    if (delta > 0 && newQty > availableStock) {
      addToast('error', `Only ${availableStock} items available in stock`);
      return;
    }

    setIsUpdatingCart(productId);

    try {
      if (newQty <= 0) {
        await api.removeFromCart(USER_ID, productId);
        addToast('success', 'Removed item from cart');
      } else {
        await api.addToCart(USER_ID, productId, delta);
      }
      const updatedCart = await api.getCart(USER_ID);
      setCart(updatedCart);
    } catch (err) {
      addToast('error', 'Failed to update cart');
    } finally {
      setIsUpdatingCart(null);
    }
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const idemKey = `idem_${Date.now()}`;
      const result = await api.checkout(USER_ID, idemKey);
      
      if (result.orderId) {
        addToast('success', `Order placed! ID: ${result.orderId}`);
        setCart([]);
        setIsConfirmOpen(false);
        setView('products'); // Go back to products after success
      } else {
        addToast('error', result.error || 'Checkout failed');
      }
    } catch (err) {
      addToast('error', 'Network error during checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const cartWithInfo = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    return {
      ...item,
      name: product?.name || 'Unknown Product',
      price: product?.price || 0,
    };
  });

  const cartTotalPrice = cartWithInfo.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="container">
      <header>
        <div className="logo-container" onClick={() => setView('products')} style={{ cursor: 'pointer' }}>
          <Zap size={32} color="var(--primary)" fill="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>FlashSale Haven</h1>
            <span className="badge">Next-Gen Speed</span>
          </div>
        </div>

        <div 
          className={`cart-summary ${view === 'cart' ? 'active' : ''}`} 
          onClick={() => setView('cart')}
        >
          <ShoppingCart size={24} color={view === 'cart' ? 'var(--primary)' : 'var(--text-main)'} />
          {cartTotalItems > 0 && <span className="cart-count">{cartTotalItems}</span>}
        </div>
      </header>

      <main>
        {view === 'products' ? (
          <section className="products-view">
            <h2 style={{ textAlign: 'left', marginBottom: '1.5rem' }}>🔥 Live Deals</h2>
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  stock={stocks[p.id] ?? 0}
                  onAddToCart={handleAddToCart}
                  isAdding={isAddingProduct === p.id}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="cart-page">
            <div className="cart-header">
              <button className="back-btn" onClick={() => setView('products')}>
                <ArrowLeft size={20} />
                Back to Shopping
              </button>
              <h2>Your Shopping Cart</h2>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={64} color="var(--border)" />
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setView('products')}>
                  Go Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="cart-list">
                  {cartWithInfo.map((item) => (
                    <div key={item.productId} className={`cart-item ${isUpdatingCart === item.productId ? 'loading' : ''}`}>
                      <div className="cart-item-img">
                         <img src={`https://placehold.co/100x100/1e293b/f8fafc?text=${item.name.charAt(0)}`} alt={item.name} />
                      </div>
                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        <p>${item.price.toLocaleString()}</p>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          className="qty-btn" 
                          onClick={() => handleUpdateQuantity(item.productId, -1)}
                          disabled={isUpdatingCart !== null}
                        >
                          {item.quantity === 1 ? <Trash2 size={16} color="var(--error)" /> : <Minus size={16} />}
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button 
                          className="qty-btn" 
                          onClick={() => handleUpdateQuantity(item.productId, 1)}
                          disabled={isUpdatingCart !== null || item.quantity >= (stocks[item.productId] ?? 0)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <div className="cart-item-price">
                        ${(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total-info">
                    <p>Total Items: {cartTotalItems}</p>
                    <h2>Total: ${cartTotalPrice.toLocaleString()}</h2>
                  </div>
                  <div className="cart-actions">
                    <button className="btn btn-outline" onClick={() => setView('products')} style={{ width: 'auto' }}>
                      Continue Shopping
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setIsConfirmOpen(true)}
                      style={{ width: 'auto', minWidth: '200px' }}
                    >
                      Checkout Now
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      <ConfirmationDialog 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleCheckout}
        title="Confirm Order"
        message={`Confirm purchase of ${cartTotalItems} items for $${cartTotalPrice.toLocaleString()}?`}
        isLoading={isCheckingOut}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
