// src/hooks/useFocusTrap.js
// Traps keyboard focus inside a container element (for modals, dialogs).
// Handles Tab, Shift+Tab, and Escape key.
//
// Usage:
//   const modalRef = useRef(null)
//   useFocusTrap(modalRef, { isOpen: true, onClose: () => setShow(false) })
//   return <div ref={modalRef} role="dialog" aria-modal="true">...</div>

import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

export function useFocusTrap(ref, { isOpen = true, onClose, initialFocusSelector } = {}) {
  useEffect(() => {
    if (!isOpen || !ref.current) return

    const container = ref.current
    const previouslyFocused = document.activeElement

    // Find all focusable elements
    function getFocusable() {
      return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      )
    }

    // Focus the first element or the specified one
    function focusInitial() {
      if (initialFocusSelector) {
        const el = container.querySelector(initialFocusSelector)
        if (el) {
          el.focus()
          return
        }
      }
      const focusable = getFocusable()
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        // No focusable elements — focus the container itself
        container.setAttribute('tabindex', '-1')
        container.focus()
      }
    }

    focusInitial()

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (onClose) onClose()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = getFocusable()
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        // Shift+Tab — if on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab — if on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Prevent body scroll while modal is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
      // Restore focus to the element that had it before the modal opened
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus()
      }
    }
  }, [isOpen, ref, onClose, initialFocusSelector])
}

export default useFocusTrap
