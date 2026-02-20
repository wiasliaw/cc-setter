import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
}

function applyTheme(theme: Theme): void {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',

      toggle: () => {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ theme: next })
      },

      setTheme: (t) => {
        applyTheme(t)
        set({ theme: t })
      }
    }),
    {
      name: 'cc-setter-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme)
      }
    }
  )
)
