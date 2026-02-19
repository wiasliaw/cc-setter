import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { useValidationStore } from '@/stores/validation-store'
import { useToastStore } from '@/stores/toast-store'
import { validateContent } from '@/services/validation-engine'

export function useSave(): () => Promise<void> {
  const save = useEditorStore((s) => s.save)
  const raw = useEditorStore((s) => s.raw)
  const isDirty = useEditorStore((s) => s.isDirty)
  const activeFile = useEditorStore((s) => s.activeFile)
  const isValid = useValidationStore((s) => s.isValid)
  const setErrors = useValidationStore((s) => s.setErrors)
  const showToast = useToastStore((s) => s.show)

  return useCallback(async () => {
    if (!isDirty) return

    const errors = validateContent(raw, activeFile)
    setErrors(errors)

    const hasErrors = errors.some((e) => e.severity === 'error')
    if (hasErrors) {
      showToast('error', `Cannot save: ${errors.length} validation error(s)`)
      return
    }

    const result = await save()
    if (result.success) {
      showToast('success', result.backupPath ? 'Saved (backup created)' : 'Saved')
    } else {
      showToast('error', `Save failed: ${result.error}`)
    }
  }, [isDirty, raw, activeFile, save, setErrors, showToast, isValid])
}
