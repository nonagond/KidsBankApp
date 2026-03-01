import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/ui/Spinner'
import AppShell from '../components/layout/AppShell'
import AuthPage from '../pages/AuthPage'
import DashboardPage from '../pages/DashboardPage'
import KidDetailPage from '../pages/KidDetailPage'
import AllowancePage from '../pages/AllowancePage'
import SettingsPage from '../pages/SettingsPage'

function ProtectedRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!session) return <Navigate to="/auth" replace />
  return children
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="kids/:kidId" element={<KidDetailPage />} />
          <Route path="kids/:kidId/allowance" element={<AllowancePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
