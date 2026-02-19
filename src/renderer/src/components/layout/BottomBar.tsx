import { useEditorStore } from '@/stores/editor-store'
import { useValidationStore } from '@/stores/validation-store'
import { useSave } from '@/hooks/useSave'
import { cn } from '@/lib/utils'

export function BottomBar(): React.JSX.Element {
  const isDirty = useEditorStore((s) => s.isDirty)
  const isValid = useValidationStore((s) => s.isValid)
  const errorCount = useValidationStore((s) => s.errors.length)
  const warningCount = useValidationStore((s) => s.warnings.length)
  const handleSave = useSave()

  const canSave = isDirty && isValid

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
    </footer>
  )
}
