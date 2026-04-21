import { useEffect, useState } from 'react';
import { orderService } from '../services';
import type { Order } from '../services';

const STATUS_LIST = ['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED'];

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'badge-warn',
  CONFIRMED: 'badge-info',
  PAID: 'badge-ok',
  CANCELLED: 'badge-err',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await orderService.getOrders(filterUserId || undefined);
      setOrders(result);
    } catch (err) {
      setError('Không thể tải danh sách đơn hàng toàn hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusUpdate = async () => {
    if (!statusTarget) return;
    setSubmitting(true);
    try {
      await orderService.updateStatus(statusTarget.id, newStatus);
      setStatusTarget(null);
      await fetchOrders();
    } catch (err) {
      alert('Cập nhật trạng thái thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container">
      <header className="page-header row-between">
        <div>
          <h1>Quản lý Đơn hàng</h1>
          <p className="muted">Theo dõi và cập nhật trạng thái đơn hàng toàn hệ thống</p>
        </div>
        <div className="row" style={{ gap: '0.5rem' }}>
          <input 
            placeholder="Lọc ID người dùng..." 
            value={filterUserId} 
            onChange={e => setFilterUserId(e.target.value)}
            style={{ width: '200px' }}
          />
          <button className="btn btn-primary" onClick={fetchOrders}>Tìm</button>
        </div>
      </header>

      {error && <div className="feedback err">{error}</div>}

      <div className="card">
        {loading ? <p className="p-centered">Đang tải...</p> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>#{order.id}</strong></td>
                    <td>
                      <div>{order.userName}</div>
                      <div className="small muted">{order.userId}</div>
                    </td>
                    <td className="price">{order.totalAmount.toLocaleString()}₫</td>
                    <td>
                      <span className={`badge ${STATUS_STYLE[order.status] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="small muted">{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => { setStatusTarget(order); setNewStatus(order.status); }}>Cập nhật</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {statusTarget && (
        <div className="modal-backdrop" onClick={() => setStatusTarget(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal card" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <h3>Thay đổi trạng thái đơn #{statusTarget.id}</h3>
            <div style={{ marginTop: '1.5rem' }}>
              <select 
                value={newStatus} 
                onChange={e => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1.5rem' }}
              >
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="row" style={{ gap: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleStatusUpdate} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button className="btn" style={{ flex: 1 }} onClick={() => setStatusTarget(null)}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
