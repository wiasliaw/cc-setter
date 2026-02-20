import { useEditorStore, type ViewMode } from '@/stores/editor-store'
import { cn } from '@/lib/utils'

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: 'form', label: 'Form' },
  { value: 'json', label: 'JSON' }
]

export function ViewToggle(): React.JSX.Element {
  const activeView = useEditorStore((s) => s.activeView)
  const setActiveView = useEditorStore((s) => s.setActiveView)

  return (
    <div
      className="flex border-b border-zinc-800 bg-zinc-950 px-4"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {VIEW_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setActiveView(opt.value)}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className={cn(
            'relative px-3 py-2 text-xs font-medium transition-colors',
            activeView === opt.value ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
          )}
        >
          {opt.label}
          {activeView === opt.value && (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-500" />
          )}
        </button>
      ))}
    </div>
  )
}
