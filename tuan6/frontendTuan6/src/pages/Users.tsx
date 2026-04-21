import { useEffect, useState } from 'react'
import { userService } from '../services'
import type { User } from '../services'

export default function UsersPage() {
  const [me, setMe] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadMe = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await userService.getMe()
      setMe(result)
    } catch (err) {
      setError('Không thể tải thông tin cá nhân')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await userService.getUsers()
      setUsers(result)
    } catch (err) {
      setError('Không thể tải danh sách người dùng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMe()
    loadUsers()
  }, [])

  return (
    <main className="container">
      <header className="page-header row-between">
        <div>
          <h1>Người dùng</h1>
          <p className="muted">Quản lý tài khoản hệ thống</p>
        </div>
        <div className="row">
          <button type="button" className="btn" onClick={loadMe} disabled={loading}>
            Làm mới cá nhân
          </button>
          <button type="button" className="btn btn-primary" onClick={loadUsers} disabled={loading}>
            Tải danh sách
          </button>
        </div>
      </header>

      {error && <p className="feedback err" style={{ marginBottom: '1.5rem' }}>{error}</p>}

      <div className="page-grid-layout" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section className="card">
          <h2>Thông tin cá nhân</h2>
          {!me ? (
            <p className="muted">Chưa có dữ liệu</p>
          ) : (
            <div className="detail-list" style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <p className="muted small">Mã người dùng (UUID)</p>
                <strong style={{ fontSize: '0.8rem' }}>{me.id}</strong>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p className="muted small">Tên đăng nhập</p>
                <strong>{me.username}</strong>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <p className="muted small">Vai trò</p>
                <span className="badge badge-ok">{me.role}</span>
              </div>
              <div>
                <p className="muted small">Ngày tham gia</p>
                <strong>{new Date(me.createdAt).toLocaleString('vi-VN')}</strong>
              </div>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Tài khoản hệ thống</h2>
          {users.length === 0 ? (
            <p className="muted">Chưa có dữ liệu danh sách</p>
          ) : (
            <div className="table-wrap" style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th>Tên</th>
                    <th>Vai trò</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '0.75rem 0' }}>
                        <strong>{user.username}</strong>
                        <div className="muted extra-small" style={{ fontSize: '0.65rem' }}>#{user.id.substring(0, 8)}...</div>
                      </td>
                      <td><span className="badge">{user.role}</span></td>
                      <td className="muted small">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
