export function LoadingScreen({ configError = false }) {
  if (configError) {
    return (
      <div className="min-h-screen auth-bg flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center border border-red-500/20">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] mb-3">
            Configuration Error
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-4 leading-relaxed">
            Supabase environment variables are missing. The app cannot connect to the database.
          </p>
          <div className="glass-panel rounded-xl p-4 text-start space-y-2 mb-5">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">
              Required in Vercel Settings → Environment Variables
            </p>
            {['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].map((v) => (
              <div key={v} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <code className="text-xs text-red-400 font-mono">{v}</code>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            After adding them in Vercel, redeploy the project.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center animate-pulse-gold">
            <ScalesIcon />
          </div>
        </div>

        {/* Spinner */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-bounce" />
        </div>

        <p className="text-sm text-[var(--text-muted)] font-medium tracking-wide">
          Loading secure portal…
        </p>
      </div>
    </div>
  )
}

function ScalesIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 3V25" stroke="#D99D18" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 3H20" stroke="#D99D18" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 3L5 11" stroke="#D99D18" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 3L23 11" stroke="#D99D18" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M3 14C3 14 4 18 8 18C12 18 13 14 13 14"
        stroke="#D99D18"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 14C15 14 16 18 20 18C24 18 25 14 25 14"
        stroke="#D99D18"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M10 25H18" stroke="#D99D18" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default LoadingScreen
