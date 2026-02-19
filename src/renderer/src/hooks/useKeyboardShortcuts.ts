import { useEffect } from 'react'

export function useKeyboardShortcuts(handlers: Record<string, () => void>): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handlers['save']?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
