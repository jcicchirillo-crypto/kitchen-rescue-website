import React, { useState, useEffect } from 'react'
import './App.css'

const STATUS_MAP = {
  pending: { label: 'Pending', color: '#F59E0B' },
  confirmed: { label: 'Confirmed', color: '#10B981' },
  paid: { label: 'Paid', color: '#059669' },
  completed: { label: 'Completed', color: '#6B7280' },
  cancelled: { label: 'Cancelled', color: '#EF4444' }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewBooking, setShowNewBooking] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      setIsLoggedIn(true)
      fetchBookings()
    }
  }, [])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const response = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('adminToken', data.token)
        setIsLoggedIn(true)
        fetchBookings()
      } else {
        setError('Invalid credentials')
      }
    } catch (error) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    setIsLoggedIn(false)
    setBookings([])
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Kitchen Rescue Admin</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>Kitchen Rescue - Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <main className="admin-main">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-value">{bookings.length}</p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-value pending">{bookings.filter(b => b.status === 'pending').length}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmed</h3>
            <p className="stat-value confirmed">{bookings.filter(b => b.status === 'confirmed').length}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value revenue">{formatCurrency(bookings.reduce((sum, b) => sum + (b.totalCost || 0), 0))}</p>
          </div>
        </div>

        <div className="bookings-section">
          <div className="bookings-header">
            <h2>Bookings</h2>
            <button onClick={fetchBookings} className="refresh-btn">Refresh</button>
          </div>

          {bookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet</p>
            </div>
          ) : (
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Dates</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>{formatDate(booking.timestamp)}</td>
                      <td>{booking.name}</td>
                      <td>{booking.email}</td>
                      <td>{booking.phone || '-'}</td>
                      <td>{formatDate(booking.startDate)} - {formatDate(booking.endDate)}</td>
                      <td>{formatCurrency(booking.totalCost || 0)}</td>
                      <td>
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: STATUS_MAP[booking.status]?.color || '#6B7280' }}
                        >
                          {STATUS_MAP[booking.status]?.label || booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App

