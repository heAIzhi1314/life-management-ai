import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { RecordsProvider } from "@/contexts/RecordsContext"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Records from "@/pages/Records"
import Reminders from "@/pages/Reminders"
import Plans from "@/pages/Plans"
import TimeAnalysis from "@/pages/TimeAnalysis"
import Growth from "@/pages/Growth"
import Health from "@/pages/Health"
import Reports from "@/pages/Reports"
import Settings from "@/pages/Settings"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"

// 受保护的路由组件
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

// 认证路由组件（已登录用户重定向到主页）
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* 认证路由 */}
      <Route path="/auth/login" element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      } />
      <Route path="/auth/register" element={
        <AuthRoute>
          <Register />
        </AuthRoute>
      } />
      
      {/* 主应用路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="records" element={<Records />} />
        <Route path="reminders" element={<Reminders />} />
        <Route path="plans" element={<Plans />} />
        <Route path="time-analysis" element={<TimeAnalysis />} />
        <Route path="growth" element={<Growth />} />
        <Route path="health" element={<Health />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <RecordsProvider>
        <Router>
          <AppRoutes />
        </Router>
      </RecordsProvider>
    </AuthProvider>
  )
}
