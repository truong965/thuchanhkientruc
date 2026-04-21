import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="navbar-v2">
      <div className="container row-between">
        <div className="row">
          <strong className="brand">FoodieExpress</strong>
          <nav className="main-nav">
            {isAdmin ? (
              <>
                <NavLink to="/admin/foods" className="nav-link">Quản lý Món</NavLink>
                <NavLink to="/admin/orders" className="nav-link">Đơn hàng</NavLink>
                <NavLink to="/admin/users" className="nav-link">Người dùng</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/foods" className="nav-link">Đặt hàng</NavLink>
                <NavLink to="/orders" className="nav-link">Đơn của tôi</NavLink>
              </>
            )}
          </nav>
        </div>
        
        <div className="row auth-section">
          {user && (
            <div className="user-profile">
              <span className="user-name">{user.username}</span>
              <span className="user-badge">{isAdmin ? 'Admin' : 'Khách hàng'}</span>
            </div>
          )}
          <button type="button" className="btn btn-logout" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  )
}