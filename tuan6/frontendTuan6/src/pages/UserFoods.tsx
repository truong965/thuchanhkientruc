import { useEffect, useState } from 'react';
import { foodService, orderService, paymentService } from '../services';
import type { Food } from '../services';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import FoodCard from '../components/foods/FoodCard';

export default function UserFoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderStatus, setOrderStatus] = useState<'idle' | 'creating' | 'paying' | 'success'>('idle');
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANKING'>('COD');

  const { addItem, items, totalPrice, totalItems, clearCart, updateQuantity } = useCart();
  const { user, token } = useAuth();

  const fetchFoods = async () => {
    try {
      const result = await foodService.getFoods(true); // Only available
      setFoods(result);
    } catch (err) {
      setError('Không thể tải thực đơn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setOrderStatus('creating');
    try {
      // 1. Tạo đơn hàng
      const order = await orderService.createOrder({
        userId: user!.id,
        token: token,
        items: items.map(i => ({ foodId: i.id, quantity: i.quantity }))
      });
      
      setLastOrder(order);

      setOrderStatus('paying');

      // 2. Xử lý thanh toán (Giả lập gọi Payment Service)
      await paymentService.pay({
        orderId: order.id,
        userId: user!.id,
        method: paymentMethod
      });

      setOrderStatus('success');
      clearCart();
    } catch (err) {
      setError('Có lỗi xảy ra trong quá trình đặt hàng.');
      setOrderStatus('idle');
    }
  };

  if (loading) return <div className="container p-centered">Đang tải thực đơn...</div>;

  if (orderStatus === 'success') {
    return (
      <main className="container p-centered">
        <div className="card status-card ok">
          <div className="status-icon">✅</div>
          <h2>Đặt hàng thành công!</h2>
          <p>Mã đơn hàng của bạn là: <strong>#{lastOrder?.id}</strong></p>
          <p className="muted">Chúng tôi đang chuẩn bị món ăn cho bạn.</p>
          <button className="btn btn-primary" onClick={() => setOrderStatus('idle')}>Tiếp tục mua sắm</button>
        </div>
      </main>
    );
  }

  return (
    <main className="container page-grid-layout">
      {/* Menu Section */}
      <section className="menu-section">
        <header className="page-header">
          <h1>Thực đơn hôm nay</h1>
          <p className="muted">Khám phá các món ăn hấp dẫn nhất</p>
        </header>

        {error && <div className="feedback err">{error}</div>}

        <div className="food-grid">
          {foods.map(food => (
            <FoodCard 
              key={food.id} 
              food={food} 
              onAction={addItem} 
              actionLabel="Thêm vào giỏ"
            />
          ))}
        </div>
      </section>

      {/* Cart Section */}
      <aside className="cart-section card sticky-cart">
        <h2>Giỏ hàng của bạn</h2>
        {items.length === 0 ? (
          <div className="empty-cart muted">
            <p>Trống rỗng...</p>
            <p className="small">Hãy chọn món bạn thích nhé!</p>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <strong>{item.name}</strong>
                    <span className="muted small">{item.price.toLocaleString()}₫</span>
                  </div>
                  <div className="cart-item-controls">
                    <button className="btn-icon" onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button className="btn-icon" onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="row-between">
                <span>Tổng cộng ({totalItems} món):</span>
                <span className="price-total">{totalPrice.toLocaleString()}₫</span>
              </div>
              
              <div className="payment-selection">
                <p className="small-title">Phương thức thanh toán:</p>
                <div className="radio-group">
                  <label className={`radio-item ${paymentMethod === 'COD' ? 'active' : ''}`}>
                    <input type="radio" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                    Tiền mặt (COD)
                  </label>
                  <label className={`radio-item ${paymentMethod === 'BANKING' ? 'active' : ''}`}>
                    <input type="radio" value="BANKING" checked={paymentMethod === 'BANKING'} onChange={() => setPaymentMethod('BANKING')} />
                    Chuyển khoản
                  </label>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-full checkout-btn" 
                onClick={handleCheckout}
                disabled={orderStatus !== 'idle'}
              >
                {orderStatus === 'creating' ? 'Đang tạo đơn...' : orderStatus === 'paying' ? 'Đang thanh toán...' : 'Đặt hàng ngay'}
              </button>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
