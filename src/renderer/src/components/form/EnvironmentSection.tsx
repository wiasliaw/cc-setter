import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useEditorStore } from '@/stores/editor-store'
import { KeyValueEditor } from '@/components/editors/KeyValueEditor'
import { cn } from '@/lib/utils'

interface KnownVar {
  key: string
  label: string
  description: string
  type: 'string' | 'enum' | 'flag' | 'number-string'
  enumValues?: string[]
  placeholder?: string
}

interface KnownCategory {
  id: string
  label: string
  vars: KnownVar[]
}

const KNOWN_CATEGORIES: KnownCategory[] = [
  {
    id: 'model',
    label: 'Model',
    vars: [
      {
        key: 'ANTHROPIC_MODEL',
        label: 'Primary model',
        description: 'Override the default Claude model for all sessions.',
        type: 'string',
        placeholder: 'claude-sonnet-4-6'
      },
      {
        key: 'ANTHROPIC_SMALL_FAST_MODEL',
        label: 'Small / fast model',
        description: 'Override the model used for lightweight background tasks.',
        type: 'string',
        placeholder: 'claude-haiku-3-5-latest'
      }
    ]
  },
  {
    id: 'agent-teams',
    label: 'Agent Teams (Experimental)',
    vars: [
      {
        key: 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS',
        label: 'Enable agent teams',
        description:
          'Enable experimental agent teams: multiple Claude Code instances coordinate work on a shared task list. Set to "1" to enable.',
        type: 'flag'
      }
    ]
  },
  {
    id: 'telemetry',
    label: 'Telemetry (OpenTelemetry)',
    vars: [
      {
        key: 'CLAUDE_CODE_ENABLE_TELEMETRY',
        label: 'Enable telemetry',
        description: 'Enable OpenTelemetry metric and event export. Required for all OTel settings.',
        type: 'flag'
      },
      {
        key: 'OTEL_METRICS_EXPORTER',
        label: 'Metrics exporter',
        description: 'Comma-separated list of metrics exporters.',
        type: 'enum',
        enumValues: ['otlp', 'prometheus', 'console', 'otlp,console', 'prometheus,console']
      },
      {
        key: 'OTEL_LOGS_EXPORTER',
        label: 'Logs / events exporter',
        description: 'Comma-separated list of log/event exporters.',
        type: 'enum',
        enumValues: ['otlp', 'console', 'otlp,console']
      },
      {
        key: 'OTEL_EXPORTER_OTLP_PROTOCOL',
        label: 'OTLP protocol',
        description: 'Protocol for the OTLP exporter (applies to all signals unless overridden).',
        type: 'enum',
        enumValues: ['grpc', 'http/json', 'http/protobuf']
      },
      {
        key: 'OTEL_EXPORTER_OTLP_ENDPOINT',
        label: 'OTLP endpoint',
        description: 'Collector endpoint URL for all OTLP signals.',
        type: 'string',
        placeholder: 'http://localhost:4317'
      },
      {
        key: 'OTEL_EXPORTER_OTLP_HEADERS',
        label: 'OTLP auth headers',
        description: 'Authentication headers sent with every OTLP request. Format: key=value.',
        type: 'string',
        placeholder: 'Authorization=Bearer your-token'
      },
      {
        key: 'OTEL_METRIC_EXPORT_INTERVAL',
        label: 'Metrics export interval (ms)',
        description: 'How often metrics are exported in milliseconds. Default: 60000.',
        type: 'number-string',
        placeholder: '60000'
      },
      {
        key: 'OTEL_LOGS_EXPORT_INTERVAL',
        label: 'Logs export interval (ms)',
        description: 'How often logs/events are exported in milliseconds. Default: 5000.',
        type: 'number-string',
        placeholder: '5000'
      },
      {
        key: 'OTEL_LOG_USER_PROMPTS',
        label: 'Log user prompt content',
        description:
          'Include user prompt content in telemetry events. Disabled by default for privacy.',
        type: 'flag'
      },
      {
        key: 'OTEL_LOG_TOOL_DETAILS',
        label: 'Log tool details',
        description:
          'Include MCP server/tool names and skill names in tool events. Disabled by default.',
        type: 'flag'
      },
      {
        key: 'OTEL_RESOURCE_ATTRIBUTES',
        label: 'Resource attributes',
        description:
          'Custom attributes attached to all metrics and events. Comma-separated key=value pairs. No spaces allowed in values.',
        type: 'string',
        placeholder: 'department=engineering,team.id=platform'
      },
      {
        key: 'OTEL_METRICS_INCLUDE_SESSION_ID',
        label: 'Include session ID in metrics',
        description: 'Attach session.id to all metric data points. Default: true.',
        type: 'enum',
        enumValues: ['true', 'false']
      },
      {
        key: 'OTEL_METRICS_INCLUDE_ACCOUNT_UUID',
        label: 'Include account UUID in metrics',
        description: 'Attach user.account_uuid to all metric data points. Default: true.',
        type: 'enum',
        enumValues: ['true', 'false']
      },
      {
        key: 'OTEL_METRICS_INCLUDE_VERSION',
        label: 'Include app version in metrics',
        description: 'Attach app.version to all metric data points. Default: false.',
        type: 'enum',
        enumValues: ['true', 'false']
      },
      {
        key: 'CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS',
        label: 'OTel headers refresh interval (ms)',
        description:
          'How often the otelHeadersHelper script runs to refresh dynamic auth tokens. Default: 1740000 (29 min).',
        type: 'number-string',
        placeholder: '1740000'
      }
    ]
  }
]

const KNOWN_KEYS = new Set(KNOWN_CATEGORIES.flatMap((c) => c.vars.map((v) => v.key)))

const inputBase =
  'w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600'

interface VarRowProps {
  v: KnownVar
  currentValue: string | undefined
  onSet: (key: string, value: string) => void
  onUnset: (key: string) => void
}

function VarRow({ v, currentValue, onSet, onUnset }: VarRowProps): React.JSX.Element {
  const isSet = currentValue !== undefined

  const handleToggleFlag = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        onSet(v.key, '1')
      } else {
        onUnset(v.key)
      }
    },
    [v.key, onSet, onUnset]
  )

  const handleTextChange = useCallback(
    (val: string) => {
      if (val === '') {
        onUnset(v.key)
      } else {
        onSet(v.key, val)
      }
    },
    [v.key, onSet, onUnset]
  )

  const handleEnumChange = useCallback(
    (val: string) => {
      if (val === '') {
        onUnset(v.key)
      } else {
        onSet(v.key, val)
      }
    },
    [v.key, onSet, onUnset]
  )

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-200">{v.label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{v.description}</p>
          <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{v.key}</p>
        </div>

        {v.type === 'flag' && (
          <button
            type="button"
            onClick={() => handleToggleFlag(!isSet)}
            className={cn(
              'mt-0.5 shrink-0 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              isSet
                ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
            )}
          >
            {isSet ? 'Enabled' : 'Disabled'}
          </button>
        )}
      </div>

      {(v.type === 'string' || v.type === 'number-string') && (
        <input
          type="text"
          value={currentValue ?? ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={v.placeholder ?? ''}
          className={inputBase}
        />
      )}

      {v.type === 'enum' && (
        <select
          value={currentValue ?? ''}
          onChange={(e) => handleEnumChange(e.target.value)}
          className={inputBase}
        >
          <option value="">Use default</option>
          {(v.enumValues ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

interface CategoryPanelProps {
  category: KnownCategory
  env: Record<string, string>
  onSet: (key: string, value: string) => void
  onUnset: (key: string) => void
}

function CategoryPanel({ category, env, onSet, onUnset }: CategoryPanelProps): React.JSX.Element {
  const activeCount = category.vars.filter((v) => env[v.key] !== undefined).length
  const [open, setOpen] = useState(activeCount > 0)

  return (
    <div className="rounded-md border border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-zinc-800/50"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="size-4 text-zinc-500" />
          ) : (
            <ChevronRight className="size-4 text-zinc-500" />
          )}
          <span className="text-sm font-medium text-zinc-200">{category.label}</span>
          {activeCount > 0 && (
            <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">
              {activeCount} set
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-600">{category.vars.length}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 border-t border-zinc-800 px-4 py-3">
          {category.vars.map((v) => (
            <VarRow
              key={v.key}
              v={v}
              currentValue={env[v.key]}
              onSet={onSet}
              onUnset={onUnset}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function EnvironmentSection(): React.JSX.Element {
  const parsed = useEditorStore((s) => s.parsed)
  const updateField = useEditorStore((s) => s.updateField)
  const removeField = useEditorStore((s) => s.removeField)
  const env = useMemo(() => ((parsed.env ?? {}) as Record<string, string>), [parsed.env])

  const customVars = useMemo(() => {
    const result: Record<string, string> = {}
    for (const [k, v] of Object.entries(env)) {
      if (!KNOWN_KEYS.has(k)) result[k] = v
    }
    return result
  }, [env])

  const handleSet = useCallback(
    (key: string, value: string) => {
      updateField(['env', key], value)
    },
    [updateField]
  )

  const handleUnset = useCallback(
    (key: string) => {
      removeField(['env', key])
    },
    [removeField]
  )

  const handleCustomChange = useCallback(
    (entries: Record<string, string>) => {
      for (const key of Object.keys(customVars)) {
        if (!(key in entries)) {
          removeField(['env', key])
        }
      }
      for (const [key, value] of Object.entries(entries)) {
        if (!KNOWN_KEYS.has(key)) {
          updateField(['env', key], value)
        }
      }
    },
    [customVars, updateField, removeField]
  )

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="mb-1 text-sm font-semibold tracking-wide text-zinc-400">Environment</h2>
        <p className="text-xs text-zinc-600">
          Environment variables applied to every Claude Code session.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {KNOWN_CATEGORIES.map((cat) => (
          <CategoryPanel
            key={cat.id}
            category={cat}
            env={env}
            onSet={handleSet}
            onUnset={handleUnset}
          />
        ))}
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-zinc-300">Custom variables</p>
        <p className="mb-3 text-xs text-zinc-600">
          Any other environment variables not listed above.
        </p>
        <KeyValueEditor
          entries={customVars}
          onChange={handleCustomChange}
          keyPattern={/^[A-Z_][A-Z0-9_]*$/}
          keyPlaceholder="VARIABLE_NAME"
          valuePlaceholder="value"
        />
      </div>
    </section>
  )
}
