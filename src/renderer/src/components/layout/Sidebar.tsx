import { useEditorStore, type FileTarget } from '@/stores/editor-store'
import { useVersionStore } from '@/stores/version-store'
import { useValidationStore } from '@/stores/validation-store'
import { useThemeStore } from '@/stores/theme-store'
import { SECTIONS, getErrorCountsBySection } from '@/constants/sections'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

const FILE_ITEMS: { target: FileTarget; label: string }[] = [
  { target: 'settings', label: '.claude/settings.json' },
  { target: 'mcp', label: 'mcp.json' }
]

export function Sidebar(): React.JSX.Element {
  const activeFile = useEditorStore((s) => s.activeFile)
  const setActiveFile = useEditorStore((s) => s.setActiveFile)
  const activeSection = useEditorStore((s) => s.activeSection)
  const setActiveSection = useEditorStore((s) => s.setActiveSection)
  const isDirty = useEditorStore((s) => s.isDirty)
  const version = useVersionStore((s) => s.version)
  const isVersionLoading = useVersionStore((s) => s.isLoading)
  const errors = useValidationStore((s) => s.errors)
  const errorCount = errors.length
  const errorsBySection = getErrorCountsBySection(errors)
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggle)

  return (
    <aside className="flex w-60 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="p-4 pt-10" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h1 className="mb-1 text-sm font-semibold tracking-wide text-zinc-300">CC Settings</h1>
        <p className="text-xs text-zinc-600">
          {isVersionLoading ? 'Detecting...' : version ? `Claude Code v${version}` : 'Not detected'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {FILE_ITEMS.map((item) => (
          <div key={item.target}>
            <button
              onClick={() => setActiveFile(item.target)}
              className={cn(
                'mb-0.5 flex w-full items-center rounded px-3 py-2 text-left transition-colors',
                activeFile === item.target
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              )}
            >
              <span className="flex-1 font-mono text-xs font-medium">{item.label}</span>
              {activeFile === item.target && isDirty && (
                <span className="ml-1.5 text-amber-500">●</span>
              )}
              {activeFile === item.target && errorCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-900 px-1 text-[10px] text-red-300">
                  {errorCount}
                </span>
              )}
            </button>

            {item.target === 'settings' && activeFile === 'settings' && (
              <div className="mb-1 ml-3 border-l border-zinc-800 pl-2">
                {SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'flex w-full items-center rounded px-2 py-1 text-left text-xs transition-colors',
                      activeSection === section.id
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                    )}
                  >
                    <span className="flex-1">{section.label}</span>
                    {errorsBySection[section.id] > 0 && (
                      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-900 px-1 text-[10px] text-red-300">
                        {errorsBySection[section.id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
