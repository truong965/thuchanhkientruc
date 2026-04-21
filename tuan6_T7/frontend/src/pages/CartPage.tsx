import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../auth';

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  availableSeats: number;
}

interface CartPageProps {
  cart: CartItem[];
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantity: number) => void;
}

export default function CartPage({ cart, removeFromCart, clearCart, updateQuantity }: CartPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const token = getToken();

  const totalPrice = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    setLoading(true);
    setStatus('Processing bulk bookings...');
    try {
      for (const item of cart) {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            movieId: item.id,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity
          })
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || `Booking failed for ${item.title}`);
        }
      }
      
      setStatus('Success! All tickets booked.');
      clearCart();
      setTimeout(() => {
        navigate('/my-bookings');
      }, 1500);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Your Shopping Cart</h2>
      
      {status && <div className="alert-message">{status}</div>}

      <div className="cart-content">
        {cart.length === 0 ? (
          <p>Your cart is empty. Go find some movies!</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="card cart-card">
                   <div className="item-info">
                      <h3>{item.title}</h3>
                      <p>Price: ${item.price}</p>
                      
                      <div className="qty-controls">
                         <button 
                           className="qty-btn" 
                           onClick={() => updateQuantity(item.id, item.quantity - 1)}
                           disabled={item.quantity <= 1}
                         >-</button>
                         <span className="qty-val">{item.quantity}</span>
                         <button 
                           className="qty-btn" 
                           onClick={() => updateQuantity(item.id, item.quantity + 1)}
                           disabled={item.quantity >= item.availableSeats}
                         >+</button>
                         <span className="hint">(Max: {item.availableSeats})</span>
                      </div>
                   </div>
                   <div className="item-actions">
                      <p className="item-subtotal">${item.price * item.quantity}</p>
                      <button className="btn-remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                   </div>
                </div>
              ))}
            </div>
            
            <div className="cart-summary card">
               <h3>Summary</h3>
               <p>Total Items: {cart.reduce((a, b) => a + b.quantity, 0)}</p>
               <p className="total-price">Total: ${totalPrice}</p>
               <button className="full-btn" onClick={() => setShowModal(true)}>Checkout Now</button>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h3>⚠️ Confirm Payment</h3>
            <p>Are you sure you want to proceed with the booking of <strong>{cart.length}</strong> items?</p>
            <p>Total amount to pay: <strong>${totalPrice}</strong></p>
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
              <button className="btn-confirm" onClick={handleCheckout} disabled={loading}>
                {loading ? 'Processing...' : 'Yes, Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
