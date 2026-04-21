import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { CartProvider } from './context/CartContext'

// Pages
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import UserFoodsPage from './pages/UserFoods'
import AdminFoodsPage from './pages/AdminFoods'
import UserOrdersPage from './pages/UserOrders'
import AdminOrdersPage from './pages/AdminOrders'
import UsersPage from './pages/Users'

function App() {
  const { isAuthenticated, user } = useAuth()

  return (
    <CartProvider>
      {isAuthenticated && <Navbar />}
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User routes */}
        <Route element={<ProtectedRoute requiredRole="USER" />}>
          <Route path="/foods" element={<UserFoodsPage />} />
          <Route path="/orders" element={<UserOrdersPage />} />
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route path="/admin/foods" element={<AdminFoodsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
        </Route>

        {/* Default route / Dashboard redirect */}
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" replace />
            ) : user?.role === 'ADMIN' ? (
              <Navigate to="/admin/foods" replace />
            ) : (
              <Navigate to="/foods" replace />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  )
}

export default App

