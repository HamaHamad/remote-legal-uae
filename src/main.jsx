import { createRoot } from 'react-dom/client'
import './i18n/index.js'
import './index.css'
import App from './App.jsx'
import { initMonitoring } from './lib/monitoring.js'

// ─── Initialize error tracking + analytics ───────────────────────
// Both are optional — they only activate if the corresponding env var
// is set. In development (VITE_APP_ENV !== 'production'), Sentry is
// not initialized and Plausible is not loaded.
initMonitoring()

createRoot(document.getElementById('root')).render(<App />)
