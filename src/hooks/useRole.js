import { useAuth } from '@/context/AuthContext'

/**
 * Provides role-checking utilities derived from AuthContext.
 * Use this hook in components that need to conditionally render based on role.
 */
export function useRole() {
  const { role, isAdmin, isPartner, isClient, profile } = useAuth()

  const can = {
    viewAllCases: isAdmin,
    manageUsers: isAdmin,
    viewAnalytics: isAdmin,
    viewAssigned: isPartner || isAdmin,
    createCase: isClient,
    viewOwnCases: isClient || isAdmin,
    accessAdmin: isAdmin,
    accessPartner: isPartner || isAdmin,
    accessDashboard: isClient || isAdmin,
  }

  const dashboardPath = () => {
    if (isAdmin) return '/admin'
    if (isPartner) return '/partner'
    return '/dashboard'
  }

  return {
    role,
    isAdmin,
    isPartner,
    isClient,
    can,
    dashboardPath,
    profile,
  }
}

export default useRole
