import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { useValidationStore } from '@/stores/validation-store'
import { useSave } from '@/hooks/useSave'
import { cn } from '@/lib/utils'

export function BottomBar(): React.JSX.Element {
  const isDirty = useEditorStore((s) => s.isDirty)
  const discard = useEditorStore((s) => s.discard)
  const isValid = useValidationStore((s) => s.isValid)
  const errorCount = useValidationStore((s) => s.errors.length)
  const warningCount = useValidationStore((s) => s.warnings.length)
  const handleSave = useSave()

  const canSave = isDirty && isValid

  const handleDiscard = useCallback(() => {
    discard()
  }, [discard])

  return (
    <footer className="flex h-12 items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4">
      <div className="flex items-center gap-3">
        {errorCount > 0 ? (
          <span className="text-xs text-red-400">✗ {errorCount} error{errorCount > 1 ? 's' : ''}</span>
        ) : (
          <span className="text-xs text-emerald-500">✓ Valid</span>
        )}
        {warningCount > 0 && (
          <span className="text-xs text-amber-500">{warningCount} warning{warningCount > 1 ? 's' : ''}</span>
        )}
        {isDirty && <span className="text-xs text-zinc-500">● Unsaved changes</span>}
      </div>

      <div className="flex items-center gap-2">
        {isDirty && (
          <button
            onClick={handleDiscard}
            className="rounded px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            Discard
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'rounded px-4 py-1.5 text-xs font-medium transition-colors',
            canSave
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          )}
        >
          Save
        </button>
      </div>
    </footer>
  )
}
