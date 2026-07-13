import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'

export function NotFoundPage() {
  const { t } = useTranslation()
  const { profile } = useAuth()

  const dashboardPath =
    profile?.role === 'admin' ? '/admin' : profile?.role === 'partner' ? '/partner' : '/dashboard'

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4">
      <div className="text-center animate-slide-up">
        <div className="font-display text-[120px] sm:text-[160px] font-bold leading-none text-gold-gradient opacity-20 select-none">
          404
        </div>

        <div className="-mt-8 mb-6">
          <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)] mb-3">
            Page Not Found
          </h1>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={profile ? dashboardPath : '/login'}>
            <Button icon={Home} size="md">
              {profile ? 'Back to Dashboard' : 'Go to Login'}
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={14} />
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
