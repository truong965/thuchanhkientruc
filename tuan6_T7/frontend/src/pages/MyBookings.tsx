import { useState, useEffect, useRef } from 'react';
import { getToken } from '../auth';

export default function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = getToken();
  const pollingRef = useRef<any>(null);

  const fetchBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setBookings(data);
        setLoading(false);
        
        const hasPending = data.some((b: any) => b.status === 'PENDING');
        if (!hasPending && pollingRef.current) {
           clearInterval(pollingRef.current);
           pollingRef.current = null;
        } else if (hasPending && !pollingRef.current) {
           startPolling();
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(fetchBookings, 3000);
  };

  useEffect(() => {
    fetchBookings();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [token]);

  if (!token) return <div className="page-container"><p className="alert-message">Please login to view your bookings.</p></div>;
  if (loading) return <div className="page-container"><p>Loading your tickets...</p></div>;

  return (
    <div className="page-container">
      <div className="header-flex">
         <h2>🎟 Your Tickets</h2>
         {pollingRef.current && <span className="polling-indicator">Syncing status...</span>}
      </div>
      
      <div className="booking-list">
        {bookings.map(b => (
          <div key={b.id} className={`card enhanced-booking-card status-${b.status}`}>
            <div className="booking-header">
               <span className="booking-id">ORDER #{b.id}</span>
               <span className={`badge badge-${b.status}`}>{b.status}</span>
            </div>
            <div className="booking-body">
               <div className="booking-main-info">
                  <p>Movie ID: <strong>{b.movieId}</strong></p>
                  <p>Quantity: <strong>{b.quantity}</strong> seats</p>
                  <p>Total Paid: <strong className="price-text">${b.totalPrice}</strong></p>
               </div>
            </div>
            <div className="booking-footer">
               <span>Booked on: {new Date(b.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {bookings.length === 0 && (
          <div className="empty-state">
             <p>No bookings yet. Ready for a movie night?</p>
          </div>
        )}
      </div>
    </div>
  );
}
