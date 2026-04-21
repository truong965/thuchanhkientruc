import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('alice@example.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('Alice');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Processing...');
    
    const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
    const body = isLogin 
        ? { username, password } 
        : { username, password, name, role: 'USER' };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isLogin) {
          setToken(data.token);
          navigate('/');
          window.location.reload(); // Force navbar to re-read token
        } else {
          setMessage('Registration success! You can now login.');
          setIsLogin(true);
        }
      } else {
        setMessage(data.error || 'Request failed');
      }
    } catch (err: any) {
      setMessage(`Connection Error: ${err.message}`);
    }
  };

  return (
    <div className="page-container centered">
      <div className="card form-card">
         <h2>{isLogin ? 'Login to Your Account' : 'Create an Account'}</h2>
         {message && <div className="alert-message">{message}</div>}
         
         <form onSubmit={handleSubmit}>
            <div className="form-group">
               <label>Username (Email)</label>
               <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            
            {!isLogin && (
               <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required />
               </div>
            )}
            
            <div className="form-group">
               <label>Password</label>
               <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            
            <button type="submit" className="full-btn">
               {isLogin ? 'Login' : 'Register'}
            </button>
         </form>

         <p className="toggle-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)} className="link">
               {isLogin ? 'Register here' : 'Login here'}
            </span>
         </p>
         
         <div className="dev-hint">
             <p>Hint: Try admin@example.com / admin123</p>
         </div>
      </div>
    </div>
  );
}
