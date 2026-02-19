import { create } from 'zustand'

export interface ValidationError {
  path: string
  message: string
  severity: 'error' | 'warning'
}

interface ValidationState {
  errors: ValidationError[]
  warnings: ValidationError[]
  isValid: boolean

  setErrors: (errors: ValidationError[]) => void
  clear: () => void
}

export const useValidationStore = create<ValidationState>((set) => ({
  errors: [],
  warnings: [],
  isValid: true,

  setErrors: (allErrors: ValidationError[]) => {
    const errors = allErrors.filter((e) => e.severity === 'error')
    const warnings = allErrors.filter((e) => e.severity === 'warning')
    set({ errors, warnings, isValid: errors.length === 0 })
  },

  clear: () => {
    set({ errors: [], warnings: [], isValid: true })
  }
}))
