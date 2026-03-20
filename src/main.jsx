import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.js'       // Initialize i18n BEFORE App renders
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
