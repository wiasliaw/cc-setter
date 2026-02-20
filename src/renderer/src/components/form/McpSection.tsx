import { useState, useCallback, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/editor-store'
import { McpServerCard } from '@/components/editors/McpServerCard'

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

const INPUT_CLASS =
  'w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600'

export function McpSection(): React.JSX.Element {
  const parsed = useEditorStore((s) => s.parsed)
  const updateField = useEditorStore((s) => s.updateField)
  const removeField = useEditorStore((s) => s.removeField)

  const [isAdding, setIsAdding] = useState(false)
  const [newServerName, setNewServerName] = useState('')

  const servers = (parsed.mcpServers ?? {}) as Record<string, Record<string, unknown>>
  const serverEntries = Object.entries(servers)

  const nameValid = NAME_PATTERN.test(newServerName)
  const nameDuplicate = newServerName in servers

  const confirmAdd = useCallback(() => {
    const trimmed = newServerName.trim()
    if (!trimmed || !NAME_PATTERN.test(trimmed) || trimmed in servers) return
    updateField(['mcpServers', trimmed], { command: '' })
    setNewServerName('')
    setIsAdding(false)
  }, [newServerName, servers, updateField])

  const cancelAdd = useCallback(() => {
    setNewServerName('')
    setIsAdding(false)
  }, [])

  const handleAddKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') confirmAdd()
      if (e.key === 'Escape') cancelAdd()
    },
    [confirmAdd, cancelAdd]
  )

  const handleUpdate = useCallback(
    (name: string, newConfig: Record<string, unknown>) => {
      updateField(['mcpServers', name], newConfig)
    },
    [updateField]
  )

  const handleRemove = useCallback(
    (name: string) => {
      removeField(['mcpServers', name])
    },
    [removeField]
  )

  const handleRename = useCallback(
    (oldName: string, newName: string, config: Record<string, unknown>) => {
      removeField(['mcpServers', oldName])
      updateField(['mcpServers', newName], config)
    },
    [removeField, updateField]
  )

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400">MCP Servers</h2>

      {serverEntries.length === 0 && !isAdding && (
        <p className="py-8 text-center text-sm text-zinc-600">No MCP servers configured</p>
      )}

      <div className="flex flex-col gap-3">
        {serverEntries.map(([name, config]) => (
          <McpServerCard
            key={name}
            name={name}
            config={config}
            onUpdate={(newConfig) => handleUpdate(name, newConfig)}
            onRemove={() => handleRemove(name)}
            onRename={(newName) => handleRename(name, newName, config)}
          />
        ))}
      </div>

      {isAdding && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newServerName}
            onChange={(e) => setNewServerName(e.target.value)}
            onKeyDown={handleAddKeyDown}
            onBlur={cancelAdd}
            placeholder="server-name"
            autoFocus
            className={cn(
              INPUT_CLASS,
              'max-w-xs',
              newServerName.length > 0 && (!nameValid || nameDuplicate) && 'border-red-600'
            )}
          />
          {newServerName.length > 0 && nameDuplicate && (
            <span className="text-xs text-red-400">Name already exists</span>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="mt-3 flex items-center gap-1 text-sm text-blue-400 transition-colors hover:text-blue-300"
      >
        <Plus className="h-4 w-4" />
        Add Server
      </button>
    </section>
  )
}
