import { useEffect, useState } from 'react';
import { orderService } from '../services';
import type { Order } from '../services';
import { useAuth } from '../hooks/useAuth';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'badge-warn',
  CONFIRMED: 'badge-info',
  PAID: 'badge-ok',
  CANCELLED: 'badge-err',
};

export default function UserOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const result = await orderService.getOrders(user.id);
      setOrders(result);
    } catch (err) {
      setError('Không thể tải lịch sử đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  if (loading) return <div className="container p-centered">Đang tải đơn hàng...</div>;

  return (
    <main className="container">
      <header className="page-header">
        <h1>Đơn hàng của tôi</h1>
        <p className="muted">Theo dõi trạng thái các món ăn bạn đã đặt</p>
      </header>

      {error && <div className="feedback err">{error}</div>}

      <div className="card">
        {orders.length === 0 ? (
          <div className="p-centered muted">
            <p>Bạn chưa có đơn hàng nào.</p>
            <p className="small">Hãy thử đặt món ngay nhé!</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Ngày đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td className="small muted">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="price">{order.totalAmount.toLocaleString()}₫</td>
                    <td>
                      <span className={`badge ${STATUS_STYLE[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => setSelectedOrder(order)}>Chi tiết</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal card" onClick={e => e.stopPropagation()} style={{ width: '600px' }}>
            <div className="modal-header row-between">
              <h2>Chi tiết đơn hàng #{selectedOrder.id}</h2>
              <button className="btn-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            
            <div className="order-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <span className="small muted">Ngày đặt:</span>
                <p>{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <div>
                <span className="small muted">Trạng thái:</span><br/>
                <span className={`badge ${STATUS_STYLE[selectedOrder.status] || ''}`}>{selectedOrder.status}</span>
              </div>
            </div>

            <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Danh sách món</h3>
            <div className="items-list card" style={{ padding: 0, overflow: 'hidden' }}>
              {selectedOrder.items.map(item => (
                <div key={item.foodId} className="row-between" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee' }}>
                  <span>{item.foodName} <span className="muted small">×{item.quantity}</span></span>
                  <strong>{item.subtotal.toLocaleString()}₫</strong>
                </div>
              ))}
              <div className="row-between" style={{ padding: '1rem', background: '#f8f9fa' }}>
                <strong style={{ fontSize: '1.1rem' }}>Tổng cộng:</strong>
                <strong className="price" style={{ fontSize: '1.2rem' }}>{selectedOrder.totalAmount.toLocaleString()}₫</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
