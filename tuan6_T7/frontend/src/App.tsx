import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { getUser, removeToken } from './auth';

import Home from './pages/Home';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import CartPage from './pages/CartPage';
import './App.css';

function App() {
  const user = getUser();
  const [cart, setCart] = useState<any[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (movie: any) => {
    setCart(prev => {
      const exist = prev.find(item => item.id === movie.id);
      if (exist) {
        return prev.map(item => item.id === movie.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...movie, quantity: 1 }];
    });
  };

  const removeFromCart = (movieId: number) => {
    setCart(prev => prev.filter(item => item.id !== movieId));
  };

  const updateQuantity = (movieId: number, quantity: number) => {
    setCart(prev => prev.map(item => item.id === movieId ? { ...item, quantity: Math.max(1, quantity) } : item));
  };

  const clearCart = () => setCart([]);

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  return (
    <Router>
      <div className="container">
        <header className="navbar">
          <div className="nav-brand">
             <Link to="/">🎬 Movie Ticket System</Link>
          </div>
          <div className="nav-links">
            <Link to="/">Home</Link>
            {user ? (
              <>
                <Link to="/my-bookings">My Bookings</Link>
                <div className="cart-nav">
                   <Link to="/cart" className="cart-link">🛒 {cart.reduce((a, b) => a + b.quantity, 0)}</Link>
                </div>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="admin-link">Dashboard</Link>
                )}
                <span className="user-info">Hi, {user.name} ({user.role})</span>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </>
            ) : (
                <Link to="/login">Login / Register</Link>
            )}
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home addToCart={addToCart} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} updateQuantity={updateQuantity} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
