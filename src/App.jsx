import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppRouter } from '@/AppRouter'
import { LoadingScreen } from '@/components/LoadingScreen'

// ─── Inner wrapper — reads auth loading + config state ────────────
function AppInner() {
  const { loading, configError } = useAuth()

  if (configError) {
    return <LoadingScreen configError />
  }

  if (loading) {
    return <LoadingScreen />
  }

  return <AppRouter />
}

// ─── Root app ─────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App

