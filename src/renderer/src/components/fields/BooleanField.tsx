import { cn } from '@/lib/utils'
import type { FieldProps } from './types'

export function BooleanField({ label, description, value, onChange }: FieldProps): React.JSX.Element {
  const checked = value === true

  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}
