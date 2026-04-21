import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type Props = {
  requiredRole?: 'ADMIN' | 'USER'
}

export default function ProtectedRoute({ requiredRole }: Props) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="spinner"></div>
        <p className="muted">Đang xác thực...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Nếu role không khớp, chuyển về trang chủ mặc định của role đó
    const home = user?.role === 'ADMIN' ? '/admin/foods' : '/foods'
    return <Navigate to={home} replace />
  }

  return <Outlet />
}
