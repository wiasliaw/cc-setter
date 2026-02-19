import { useEditorStore, type FileTarget } from '@/stores/editor-store'
import { useVersionStore } from '@/stores/version-store'
import { useValidationStore } from '@/stores/validation-store'
import { cn } from '@/lib/utils'

const FILE_ITEMS: { target: FileTarget; label: string; description: string }[] = [
  { target: 'settings', label: 'Settings', description: '~/.claude/settings.json' },
  { target: 'mcp', label: 'MCP Servers', description: '~/.mcp.json' }
]

export function Sidebar(): React.JSX.Element {
  const activeFile = useEditorStore((s) => s.activeFile)
  const setActiveFile = useEditorStore((s) => s.setActiveFile)
  const isDirty = useEditorStore((s) => s.isDirty)
  const version = useVersionStore((s) => s.version)
  const isVersionLoading = useVersionStore((s) => s.isLoading)
  const errorCount = useValidationStore((s) => s.errors.length)

  return (
    <aside className="flex w-60 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="p-4 pt-10">
        <h1 className="mb-1 text-sm font-semibold tracking-wide text-zinc-300">CC Settings</h1>
        <p className="text-xs text-zinc-600">
          {isVersionLoading ? 'Detecting...' : version ? `Claude Code v${version}` : 'Not detected'}
        </p>
      </div>

      <nav className="flex-1 px-2">
        {FILE_ITEMS.map((item) => (
          <button
            key={item.target}
            onClick={() => setActiveFile(item.target)}
            className={cn(
              'mb-1 flex w-full flex-col rounded px-3 py-2 text-left transition-colors',
              activeFile === item.target
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            )}
          >
            <span className="text-sm font-medium">
              {item.label}
              {activeFile === item.target && isDirty && (
                <span className="ml-1.5 text-amber-500">●</span>
              )}
              {activeFile === item.target && errorCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-900 px-1 text-[10px] text-red-300">
                  {errorCount}
                </span>
              )}
            </span>
            <span className="mt-0.5 text-[11px] text-zinc-600">{item.description}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
