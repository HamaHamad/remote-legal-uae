import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

/**
 * ProtectedRoute — wraps any route that requires auth.
 * Note: loading state is handled by App.jsx before this ever renders.
 */
export function ProtectedRoute({ children, roles = [], redirect = '/login' }) {
  const { user, profile } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to={redirect} state={{ from: location }} replace />
  }

  if (roles.length > 0 && profile) {
    if (!roles.includes(profile.role)) {
      const dashboardMap = { client: '/dashboard', admin: '/admin', partner: '/partner' }
      return <Navigate to={dashboardMap[profile.role] || '/dashboard'} replace />
    }
  }

  return children
}

/**
 * PublicRoute — redirects authenticated users away from login/signup.
 */
export function PublicRoute({ children }) {
  const { user, profile } = useAuth()

  if (user && profile) {
    const dashboardMap = { client: '/dashboard', admin: '/admin', partner: '/partner' }
    return <Navigate to={dashboardMap[profile.role] || '/dashboard'} replace />
  }

  // User is logged in but profile hasn't loaded yet — show the public page
  // (profile will load in the background and redirect once ready)
  return children
}

export default ProtectedRoute

