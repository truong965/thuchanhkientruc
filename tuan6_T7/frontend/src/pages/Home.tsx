import { useState, useEffect } from 'react';
import { getUser } from '../auth';

interface HomeProps {
  addToCart: (movie: any) => void;
}

export default function Home({ addToCart }: HomeProps) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const user = getUser();

  const fetchMovies = () => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        setMovies(data);
        setLoading(false);
      })
      .catch(err => {
        setMessage(`Error fetching movies: ${err.message}`);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleAddToCart = (movie: any) => {
    if (movie.availableSeats <= 0) {
      setMessage(`Sorry, ${movie.title} is sold out!`);
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    addToCart(movie);
    setMessage(`Added ${movie.title} to cart!`);
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) return <p className="page-container">Loading movies...</p>;

  return (
    <div className="page-container">
      <div className="home-hero">
          <h2>🎬 Cinematic Experiences</h2>
          <p>Discover the latest movies and book your tickets in seconds.</p>
      </div>

      {message && <div className="alert-message floating">{message}</div>}
      
      <div className="movie-grid">
        {movies.map(m => (
          <div key={m.id} className="card movie-card-enhanced">
            <div className="movie-poster-placeholder">
               <span>{m.title[0]}</span>
            </div>
            <div className="movie-info">
               <h3>{m.title}</h3>
               <p className="description">Experience {m.title} today!</p>
               <div className="movie-footer">
                  <div className="movie-meta">
                    <p className="price">${m.price}</p>
                    <p className={`seats-count ${m.availableSeats === 0 ? 'sold-out' : ''}`}>
                      {m.availableSeats > 0 ? `${m.availableSeats} seats left` : 'Sold Out'}
                    </p>
                  </div>
                  {user ? (
                    <button 
                      className="btn-add-cart" 
                      onClick={() => handleAddToCart(m)}
                      disabled={m.availableSeats <= 0}
                    >
                      {m.availableSeats > 0 ? '🛒 Add to Cart' : 'Sold Out'}
                    </button>
                  ) : (
                    <p className="hint">Login to buy</p>
                  )}
               </div>
            </div>
          </div>
        ))}
        {movies.length === 0 && <p>No movies available right now.</p>}
      </div>
    </div>
  );
}
