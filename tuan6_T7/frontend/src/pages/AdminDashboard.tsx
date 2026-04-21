import { useState, useEffect } from 'react';
import { getUser, getToken } from '../auth';

export default function AdminDashboard() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', description: '', price: '0', availableSeats: '100' });
  const [message, setMessage] = useState('');

  const user = getUser();
  const token = getToken();

  const fetchMovies = () => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        setMovies(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchMovies();
      // Bật polling để cập nhật số lượng ghế thực tế khi có người đặt
      const interval = setInterval(fetchMovies, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = editingMovie ? `/api/movies/${editingMovie.id}` : '/api/movies';
    const method = editingMovie ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          availableSeats: parseInt(formData.availableSeats)
        })
      });

      if (res.ok) {
        setMessage(editingMovie ? 'Movie updated successfully!' : 'Movie created successfully!');
        setFormData({ title: '', description: '', price: '0', availableSeats: '100' });
        setEditingMovie(null);
        fetchMovies();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error}`);
      }
    } catch (err: any) {
      setMessage(`Network Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;
    try {
      const res = await fetch(`/api/movies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage('Movie deleted');
        fetchMovies();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err: any) {
      setMessage(`Delete error: ${err.message}`);
    }
  };

  const startEdit = (movie: any) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description || '',
      price: movie.price.toString(),
      availableSeats: movie.availableSeats.toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user || user.role !== 'ADMIN') {
    return <div className="page-container centered"><h2 style={{ color: '#cf6679' }}>Access Denied</h2></div>;
  }

  return (
    <div className="page-container">
      <div className="header-flex">
         <h2>🛠 Admin Management</h2>
         {message && <span className="status-toast">{message}</span>}
      </div>

      <div className="admin-layout">
        <section className="form-section card">
          <div className="card-header">
             <h3>{editingMovie ? '📝 Edit Movie' : '➕ Add New Movie'}</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
               <div className="form-group">
                  <label>Movie Title</label>
                  <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Inception" required />
               </div>
               <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                 <div className="form-group" style={{ flex: 1 }}>
                    <label>Price ($)</label>
                    <input name="price" type="number" step="0.1" value={formData.price} onChange={handleInputChange} required />
                 </div>
                 <div className="form-group" style={{ flex: 1 }}>
                    <label>Available Seats</label>
                    <input name="availableSeats" type="number" value={formData.availableSeats} onChange={handleInputChange} required />
                 </div>
               </div>
               <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows={4} value={formData.description} onChange={handleInputChange} placeholder="Brief summary of the movie..." />
               </div>
               <div className="form-actions">
                  <button type="submit" className="btn-confirm">{editingMovie ? 'Update Movie' : 'Create Movie'}</button>
                  {editingMovie && <button type="button" onClick={() => { setEditingMovie(null); setFormData({ title: '', description: '', price: '0', availableSeats: '100' }); }} className="btn-cancel">Cancel</button>}
               </div>
            </form>
          </div>
        </section>

        <section className="list-section">
          <h3>Current Movies Inventory</h3>
          <div className="table-container card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>Seats</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.title}</strong></td>
                    <td><span className="price-text">${m.price}</span></td>
                    <td>{m.availableSeats}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-small btn-edit" onClick={() => startEdit(m)}>Edit</button>
                      <button className="btn-small btn-delete" onClick={() => handleDelete(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <p>Loading registry...</p>}
        </section>
      </div>
    </div>
  );
}
