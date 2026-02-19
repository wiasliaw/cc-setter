import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastState {
  toasts: Toast[]
  show: (type: ToastType, message: string) => void
  dismiss: (id: number) => void
}

let nextId = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (type, message) => {
    const id = nextId++
    set({ toasts: [...get().toasts, { id, type, message }] })
    setTimeout(() => get().dismiss(id), 3000)
  },

  dismiss: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  }
}))
