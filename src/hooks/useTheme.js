// src/hooks/useTheme.js
// Manages dark/light theme via a 'light' class on <html>.
// Persists to localStorage. Defaults to dark (matching the existing design).

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'rlco-theme'

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem(STORAGE_KEY) || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setTheme = useCallback((t) => {
    setThemeState(t === 'light' ? 'light' : 'dark')
  }, [])

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark', isLight: theme === 'light' }
}

export default useTheme
