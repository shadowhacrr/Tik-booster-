import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import OwnerLogin from './pages/OwnerLogin'
import OwnerDashboard from './pages/OwnerDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/owner" element={<OwnerLogin />} />
      <Route path="/owner/dashboard" element={<OwnerDashboard />} />
    </Routes>
  )
}
