import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppRouter } from '@/AppRouter'
import { LoadingScreen } from '@/components/LoadingScreen'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function AppInner() {
  const { loading, configError } = useAuth()
  if (configError) return <LoadingScreen configError />
  if (loading)     return <LoadingScreen />
  return <AppRouter />
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App

