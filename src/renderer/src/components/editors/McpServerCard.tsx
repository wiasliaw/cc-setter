import { useState, useCallback, useRef, type KeyboardEvent } from 'react'
import { Trash2, ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyValueEditor } from '@/components/editors/KeyValueEditor'

type TransportType = 'stdio' | 'sse' | 'streamable-http'

interface McpServerCardProps {
  name: string
  config: Record<string, unknown>
  onUpdate: (config: Record<string, unknown>) => void
  onRemove: () => void
  onRename: (newName: string) => void
}

const NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

const INPUT_CLASS =
  'w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600'

function detectTransport(config: Record<string, unknown>): TransportType {
  if ('command' in config) return 'stdio'
  if ('url' in config) {
    if (config.type === 'streamable-http') return 'streamable-http'
    if (config.type === 'sse') return 'sse'
    return 'sse'
  }
  return 'stdio'
}

function buildTransportDefaults(
  transport: TransportType,
  prevConfig: Record<string, unknown>
): Record<string, unknown> {
  const base: Record<string, unknown> = {}
  if (prevConfig.env !== undefined) {
    base.env = prevConfig.env
  }

  switch (transport) {
    case 'stdio':
      return { ...base, command: '', args: [] }
    case 'sse':
      return { ...base, url: '', type: 'sse' }
    case 'streamable-http':
      return { ...base, url: '', type: 'streamable-http' }
  }
}

export function McpServerCard({
  name,
  config,
  onUpdate,
  onRemove,
  onRename
}: McpServerCardProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)
  const [editName, setEditName] = useState(name)
  const [argInput, setArgInput] = useState('')
  const prevNameRef = useRef(name)

  const transport = detectTransport(config)
  const nameValid = NAME_PATTERN.test(editName)

  const commitRename = useCallback(() => {
    const trimmed = editName.trim()
    if (trimmed && NAME_PATTERN.test(trimmed) && trimmed !== prevNameRef.current) {
      onRename(trimmed)
      prevNameRef.current = trimmed
    } else {
      setEditName(prevNameRef.current)
    }
  }, [editName, onRename])

  const handleNameKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.currentTarget.blur()
        commitRename()
      }
    },
    [commitRename]
  )

  const setTransport = useCallback(
    (t: TransportType) => {
      if (t === transport) return
      onUpdate(buildTransportDefaults(t, config))
    },
    [transport, config, onUpdate]
  )

  const updateConfigKey = useCallback(
    (key: string, value: unknown) => {
      onUpdate({ ...config, [key]: value })
    },
    [config, onUpdate]
  )

  const args = Array.isArray(config.args) ? (config.args as string[]) : []

  const addArg = useCallback(() => {
    const trimmed = argInput.trim()
    if (!trimmed) return
    updateConfigKey('args', [...args, trimmed])
    setArgInput('')
  }, [argInput, args, updateConfigKey])

  const removeArg = useCallback(
    (index: number) => {
      updateConfigKey(
        'args',
        args.filter((_, i) => i !== index)
      )
    },
    [args, updateConfigKey]
  )

  const handleArgKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addArg()
      }
    },
    [addArg]
  )

  const env = (config.env ?? {}) as Record<string, string>
  const headers = (config.headers ?? {}) as Record<string, string>

  const TRANSPORTS: TransportType[] = ['stdio', 'sse', 'streamable-http']

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50">
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-zinc-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          )}
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'bg-transparent text-sm font-medium text-zinc-200 outline-none',
              'border-b border-transparent transition-colors focus:border-blue-600',
              !nameValid && editName.length > 0 && 'border-red-600'
            )}
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-zinc-500 transition-colors hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div>
            <label className="mb-1 text-xs font-medium text-zinc-400">Transport</label>
            <div className="inline-flex overflow-hidden rounded border border-zinc-700">
              {TRANSPORTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTransport(t)}
                  className={cn(
                    'px-3 py-1 text-xs rounded',
                    t === transport
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'bg-transparent text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {transport === 'stdio' && (
            <>
              <div>
                <label className="mb-1 text-xs font-medium text-zinc-400">Command</label>
                <input
                  type="text"
                  value={(config.command as string) ?? ''}
                  onChange={(e) => updateConfigKey('command', e.target.value)}
                  placeholder="e.g. npx -y @modelcontextprotocol/server-memory"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1 text-xs font-medium text-zinc-400">Arguments</label>
                <div className="flex flex-wrap gap-1.5">
                  {args.map((arg, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
                    >
                      {arg}
                      <button
                        type="button"
                        onClick={() => removeArg(i)}
                        className="text-zinc-500 transition-colors hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={argInput}
                  onChange={(e) => setArgInput(e.target.value)}
                  onKeyDown={handleArgKeyDown}
                  placeholder="Type argument and press Enter"
                  className={cn(INPUT_CLASS, 'mt-1.5')}
                />
              </div>

              <div>
                <label className="mb-1 text-xs font-medium text-zinc-400">
                  Environment Variables
                </label>
                <KeyValueEditor entries={env} onChange={(v) => updateConfigKey('env', v)} />
              </div>
            </>
          )}

          {(transport === 'sse' || transport === 'streamable-http') && (
            <>
              <div>
                <label className="mb-1 text-xs font-medium text-zinc-400">URL</label>
                <input
                  type="text"
                  value={(config.url as string) ?? ''}
                  onChange={(e) => updateConfigKey('url', e.target.value)}
                  placeholder={
                    transport === 'sse'
                      ? 'http://localhost:3000/sse'
                      : 'http://localhost:3000/mcp'
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className="mb-1 text-xs font-medium text-zinc-400">Headers</label>
                <KeyValueEditor
                  entries={headers}
                  onChange={(v) => updateConfigKey('headers', v)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
