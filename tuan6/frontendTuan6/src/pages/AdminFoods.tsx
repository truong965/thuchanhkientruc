import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { foodService } from '../services';
import type { Food, FoodRequest } from '../services';

const EMPTY_FORM: FoodRequest = {
  name: '',
  description: '',
  price: 0,
  category: '',
  available: true,
  imageUrl: '',
};

export default function AdminFoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterAvailable, setFilterAvailable] = useState<'all' | 'true' | 'false'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Food | null>(null);
  const [form, setForm] = useState<FoodRequest>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Food | null>(null);

  const fetchFoods = async () => {
    setLoading(true);
    setError('');
    try {
      const available = filterAvailable === 'all' ? undefined : filterAvailable === 'true';
      const result = await foodService.getFoods(available);
      setFoods(result);
    } catch (err) {
      setError('Cannot load foods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, [filterAvailable]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (food: Food) => {
    setEditTarget(food);
    setForm({
      name: food.name,
      description: food.description,
      price: food.price,
      category: food.category,
      available: food.available,
      imageUrl: food.imageUrl || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editTarget) {
        await foodService.updateFood(editTarget.id, form);
        setSuccess(`✅ Updated "${form.name}"`);
      } else {
        await foodService.createFood(form);
        setSuccess(`✅ Created "${form.name}"`);
      }
      closeModal();
      await fetchFoods();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      await foodService.deleteFood(deleteTarget.id);
      setSuccess(`✅ Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      await fetchFoods();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container">
      <header className="page-header row-between">
        <div>
          <h1>Quản lý Món ăn</h1>
          <p className="muted">Dashboard dành cho Admin</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm món mới</button>
      </header>

      {success && <div className="feedback ok" style={{ marginBottom: '1rem' }}>{success}</div>}
      {error && <div className="feedback err" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        <div className="filter-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="small muted">Lọc:</span>
          {(['all', 'true', 'false'] as const).map((v) => (
            <button
              key={v}
              className={`btn btn-sm ${filterAvailable === v ? 'btn-active' : ''}`}
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setFilterAvailable(v)}
            >
              {v === 'all' ? 'Tất cả' : v === 'true' ? 'Đang bán' : 'Ngưng bán'}
            </button>
          ))}
        </div>

        {loading ? <p>Đang tải...</p> : (
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '1rem' }}>Món ăn</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {foods.map(food => (
                  <tr key={food.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem' }}>
                      <strong>{food.name}</strong>
                      <div className="small muted">{food.description}</div>
                    </td>
                    <td><span className="badge">{food.category}</span></td>
                    <td className="price">{food.price.toLocaleString()}₫</td>
                    <td>
                      <span className={`badge ${food.available ? 'badge-ok' : 'badge-err'}`}>
                        {food.available ? 'Đang bán' : 'Hết'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm" onClick={() => openEdit(food)}>Sửa</button>
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteTarget(food)} style={{ marginLeft: '0.5rem' }}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={closeModal} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal card" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '95%' }}>
            <h2>{editTarget ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
              <input placeholder="Tên món" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input placeholder="Mô tả" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="number" placeholder="Giá" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} required style={{ flex: 1 }} />
                <input placeholder="Danh mục" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required style={{ flex: 1 }} />
              </div>
              <input placeholder="URL hình ảnh" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} />
                Đang kinh doanh
              </label>
              <div className="row" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu</button>
                <button type="button" className="btn" onClick={closeModal} style={{ flex: 1 }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal card" style={{ padding: '2rem' }}>
            <h3>Xác nhận xóa</h3>
            <p>Xóa món <strong>{deleteTarget.name}</strong>?</p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <button className="btn btn-danger" onClick={handleDelete}>Xóa ngay</button>
              <button className="btn" onClick={() => setDeleteTarget(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
