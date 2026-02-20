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
  // ── API & Authentication ──────────────────────────────────────────────
  {
    id: 'api-auth',
    label: 'API & Authentication',
    vars: [
      {
        key: 'ANTHROPIC_API_KEY',
        label: 'API key',
        description:
          'Primary API key for Anthropic. Caution: settings.json may be committed to version control.',
        type: 'string',
        placeholder: 'sk-ant-...'
      },
      {
        key: 'ANTHROPIC_AUTH_TOKEN',
        label: 'Auth token',
        description: 'Alternative authentication token for Anthropic services.',
        type: 'string',
        placeholder: 'Bearer token'
      },
      {
        key: 'ANTHROPIC_BASE_URL',
        label: 'Base URL',
        description: 'Custom base URL for Anthropic API endpoints (proxies, on-prem).',
        type: 'string',
        placeholder: 'https://api.anthropic.com'
      },
      {
        key: 'ANTHROPIC_CUSTOM_HEADERS',
        label: 'Custom headers (JSON)',
        description: 'Additional HTTP headers for Anthropic API requests in JSON format.',
        type: 'string',
        placeholder: '{"X-Custom-Header":"value"}'
      },
      {
        key: 'ANTHROPIC_BETAS',
        label: 'Beta features',
        description: 'Comma-separated list of beta feature flags to enable.',
        type: 'string',
        placeholder: 'feature-a,feature-b'
      }
    ]
  },
  // ── Model ─────────────────────────────────────────────────────────────
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
        label: 'Small / fast model (deprecated)',
        description:
          'Override the model for lightweight background tasks. Deprecated — use ANTHROPIC_DEFAULT_HAIKU_MODEL instead.',
        type: 'string',
        placeholder: 'claude-haiku-3-5-latest'
      },
      {
        key: 'ANTHROPIC_DEFAULT_OPUS_MODEL',
        label: 'Default Opus model',
        description:
          'Pin the model used for the "opus" alias and "opusplan" in Plan Mode. Use full model names.',
        type: 'string',
        placeholder: 'claude-opus-4-6'
      },
      {
        key: 'ANTHROPIC_DEFAULT_SONNET_MODEL',
        label: 'Default Sonnet model',
        description: 'Pin the model used for the "sonnet" alias and "opusplan" in execution mode.',
        type: 'string',
        placeholder: 'claude-sonnet-4-6'
      },
      {
        key: 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
        label: 'Default Haiku model',
        description: 'Pin the model used for the "haiku" alias and background functionality.',
        type: 'string',
        placeholder: 'claude-haiku-3-5-latest'
      },
      {
        key: 'CLAUDE_CODE_SUBAGENT_MODEL',
        label: 'Subagent model',
        description: 'Override the model used for subagent operations.',
        type: 'string',
        placeholder: 'claude-sonnet-4-6'
      }
    ]
  },
  // ── Output & Tokens ───────────────────────────────────────────────────
  {
    id: 'output-tokens',
    label: 'Output & Tokens',
    vars: [
      {
        key: 'CLAUDE_CODE_MAX_OUTPUT_TOKENS',
        label: 'Max output tokens',
        description: 'Maximum number of output tokens per response.',
        type: 'number-string',
        placeholder: '16384'
      },
      {
        key: 'MAX_THINKING_TOKENS',
        label: 'Max thinking tokens',
        description: 'Maximum tokens allocated for model thinking/reasoning steps.',
        type: 'number-string',
        placeholder: '10000'
      },
      {
        key: 'MAX_MCP_OUTPUT_TOKENS',
        label: 'Max MCP output tokens',
        description: 'Maximum tokens for MCP server tool outputs.',
        type: 'number-string',
        placeholder: '25000'
      },
      {
        key: 'CLAUDE_CODE_MAX_RETRIES',
        label: 'Max retries',
        description: 'Maximum number of API request retries on failure.',
        type: 'number-string',
        placeholder: '3'
      },
      {
        key: 'API_TIMEOUT_MS',
        label: 'API timeout (ms)',
        description: 'Timeout for API requests in milliseconds.',
        type: 'number-string',
        placeholder: '60000'
      },
      {
        key: 'CLAUDE_CODE_API_KEY_HELPER_TTL_MS',
        label: 'API key helper TTL (ms)',
        description: 'Time-to-live for the API key helper cache in milliseconds.',
        type: 'number-string',
        placeholder: '3600000'
      }
    ]
  },
  // ── Behavior & Feature Flags ──────────────────────────────────────────
  {
    id: 'behavior',
    label: 'Behavior & Feature Flags',
    vars: [
      {
        key: 'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC',
        label: 'Disable non-essential traffic',
        description:
          'Reduce non-critical network requests (update checks, telemetry, tips). Set to "1" to enable.',
        type: 'flag'
      },
      {
        key: 'CLAUDE_CODE_DISABLE_TERMINAL_TITLE',
        label: 'Disable terminal title',
        description: 'Prevent Claude Code from updating the terminal window title.',
        type: 'flag'
      },
      {
        key: 'ENABLE_TOOL_SEARCH',
        label: 'Enable tool search',
        description: 'Enable the ToolSearch tool for discovering available tools.',
        type: 'enum',
        enumValues: ['true', 'false']
      },
      {
        key: 'DISABLE_AUTOUPDATER',
        label: 'Disable auto-updater',
        description: 'Prevent Claude Code from checking for and installing updates.',
        type: 'flag'
      },
      {
        key: 'DISABLE_COST_WARNINGS',
        label: 'Disable cost warnings',
        description: 'Suppress API cost warning messages.',
        type: 'flag'
      },
      {
        key: 'DISABLE_ERROR_REPORTING',
        label: 'Disable error reporting',
        description: 'Disable automatic error reporting to Anthropic.',
        type: 'flag'
      },
      {
        key: 'DISABLE_TELEMETRY',
        label: 'Disable telemetry',
        description: 'Disable all telemetry collection.',
        type: 'flag'
      },
      {
        key: 'DISABLE_INTERLEAVED_THINKING',
        label: 'Disable interleaved thinking',
        description:
          'Disable interleaved thinking mode. Thinking will not be interspersed with responses.',
        type: 'flag'
      },
      {
        key: 'CLAUDE_CODE_DISABLE_COMMAND_INJECTION_CHECK',
        label: 'Disable command injection check',
        description: 'Disable the command injection security check for bash commands.',
        type: 'flag'
      },
      {
        key: 'CLAUDE_CODE_DONT_INHERIT_ENV',
        label: "Don't inherit env",
        description:
          'Prevent Claude Code from inheriting environment variables from the parent shell.',
        type: 'flag'
      },
      {
        key: 'CLAUDE_CODE_EXTRA_BODY',
        label: 'Extra request body (JSON)',
        description: 'Additional JSON data merged into every API request body.',
        type: 'string',
        placeholder: '{"metadata":{"user_id":"123"}}'
      },
      {
        key: 'CLAUDE_CODE_SHELL_PREFIX',
        label: 'Shell prefix',
        description: 'Prefix prepended to all shell commands executed by Claude.',
        type: 'string',
        placeholder: 'bash -c'
      },
      {
        key: 'CLAUDE_CODE_EFFORT_LEVEL',
        label: 'Effort level',
        description:
          'Control Opus 4.6 adaptive reasoning effort. Lower = faster & cheaper, higher = deeper reasoning.',
        type: 'enum',
        enumValues: ['low', 'medium', 'high']
      }
    ]
  },
  // ── Prompt Caching ────────────────────────────────────────────────────
  {
    id: 'prompt-caching',
    label: 'Prompt Caching',
    vars: [
      {
        key: 'DISABLE_PROMPT_CACHING',
        label: 'Disable all prompt caching',
        description:
          'Disable prompt caching for all models. Takes precedence over per-model settings.',
        type: 'flag'
      },
      {
        key: 'DISABLE_PROMPT_CACHING_OPUS',
        label: 'Disable caching (Opus)',
        description: 'Disable prompt caching for Opus models only.',
        type: 'flag'
      },
      {
        key: 'DISABLE_PROMPT_CACHING_SONNET',
        label: 'Disable caching (Sonnet)',
        description: 'Disable prompt caching for Sonnet models only.',
        type: 'flag'
      },
      {
        key: 'DISABLE_PROMPT_CACHING_HAIKU',
        label: 'Disable caching (Haiku)',
        description: 'Disable prompt caching for Haiku models only.',
        type: 'flag'
      }
    ]
  },
  // ── Agent Teams (Experimental) ────────────────────────────────────────
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
  // ── Bash Execution ────────────────────────────────────────────────────
  {
    id: 'bash',
    label: 'Bash Execution',
    vars: [
      {
        key: 'BASH_DEFAULT_TIMEOUT_MS',
        label: 'Default timeout (ms)',
        description: 'Default timeout for bash command execution in milliseconds.',
        type: 'number-string',
        placeholder: '120000'
      },
      {
        key: 'BASH_MAX_TIMEOUT_MS',
        label: 'Max timeout (ms)',
        description: 'Maximum timeout allowed for bash commands in milliseconds.',
        type: 'number-string',
        placeholder: '600000'
      },
      {
        key: 'BASH_MAX_OUTPUT_LENGTH',
        label: 'Max output length',
        description: 'Maximum character length of bash command output before truncation.',
        type: 'number-string',
        placeholder: '30000'
      },
      {
        key: 'CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR',
        label: 'Maintain project working dir',
        description: 'Force all bash commands to execute in the project directory for consistency.',
        type: 'flag'
      }
    ]
  },
  // ── MCP (Model Context Protocol) ──────────────────────────────────────
  {
    id: 'mcp',
    label: 'MCP (Model Context Protocol)',
    vars: [
      {
        key: 'MCP_TIMEOUT',
        label: 'General timeout (ms)',
        description: 'Timeout for MCP operations in milliseconds.',
        type: 'number-string',
        placeholder: '30000'
      },
      {
        key: 'MCP_TOOL_TIMEOUT',
        label: 'Tool timeout (ms)',
        description: 'Timeout specifically for MCP tool execution in milliseconds.',
        type: 'number-string',
        placeholder: '60000'
      },
      {
        key: 'MCP_SERVER_CONNECTION_BATCH_SIZE',
        label: 'Connection batch size',
        description: 'Number of MCP servers to connect to concurrently during startup.',
        type: 'number-string',
        placeholder: '5'
      },
      {
        key: 'MCP_OAUTH_CALLBACK_PORT',
        label: 'OAuth callback port',
        description: 'Port for OAuth callback when authenticating with MCP servers.',
        type: 'number-string',
        placeholder: '3000'
      }
    ]
  },
  // ── AWS Bedrock ───────────────────────────────────────────────────────
  {
    id: 'bedrock',
    label: 'AWS Bedrock',
    vars: [
      {
        key: 'CLAUDE_CODE_USE_BEDROCK',
        label: 'Use Bedrock',
        description: 'Route API requests through AWS Bedrock instead of the direct Anthropic API.',
        type: 'flag'
      },
      {
        key: 'BEDROCK_BASE_URL',
        label: 'Bedrock base URL',
        description: 'Custom base URL for AWS Bedrock API endpoint.',
        type: 'string',
        placeholder: 'https://bedrock-runtime.us-east-1.amazonaws.com'
      },
      {
        key: 'AWS_REGION',
        label: 'AWS region',
        description: 'AWS region for Bedrock service calls.',
        type: 'string',
        placeholder: 'us-east-1'
      },
      {
        key: 'AWS_PROFILE',
        label: 'AWS profile',
        description: 'AWS profile name for credential selection from ~/.aws/credentials.',
        type: 'string',
        placeholder: 'default'
      },
      {
        key: 'ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION',
        label: 'Small/fast model region',
        description: 'AWS region for the small fast model when using Bedrock.',
        type: 'string',
        placeholder: 'us-west-2'
      },
      {
        key: 'CLAUDE_CODE_SKIP_BEDROCK_AUTH',
        label: 'Skip Bedrock auth',
        description: 'Skip AWS Bedrock authentication (for custom auth setups).',
        type: 'flag'
      }
    ]
  },
  // ── Google Vertex AI ──────────────────────────────────────────────────
  {
    id: 'vertex',
    label: 'Google Vertex AI',
    vars: [
      {
        key: 'CLAUDE_CODE_USE_VERTEX',
        label: 'Use Vertex AI',
        description: 'Route API requests through Google Vertex AI.',
        type: 'flag'
      },
      {
        key: 'ANTHROPIC_VERTEX_PROJECT_ID',
        label: 'GCP project ID',
        description: 'Google Cloud project ID for Vertex AI integration.',
        type: 'string',
        placeholder: 'my-gcp-project'
      },
      {
        key: 'CLOUD_ML_REGION',
        label: 'Cloud ML region',
        description: 'Google Cloud ML region for Vertex AI.',
        type: 'string',
        placeholder: 'us-central1'
      },
      {
        key: 'VERTEX_BASE_URL',
        label: 'Vertex base URL',
        description: 'Custom base URL for Google Vertex AI API.',
        type: 'string',
        placeholder: 'https://us-central1-aiplatform.googleapis.com'
      },
      {
        key: 'CLAUDE_CODE_SKIP_VERTEX_AUTH',
        label: 'Skip Vertex auth',
        description: 'Skip Google Vertex AI authentication.',
        type: 'flag'
      }
    ]
  },
  // ── Network & TLS ─────────────────────────────────────────────────────
  {
    id: 'network',
    label: 'Network & TLS',
    vars: [
      {
        key: 'HTTP_PROXY',
        label: 'HTTP proxy',
        description: 'HTTP proxy server URL for outgoing requests.',
        type: 'string',
        placeholder: 'http://proxy.example.com:8080'
      },
      {
        key: 'HTTPS_PROXY',
        label: 'HTTPS proxy',
        description: 'HTTPS proxy server URL for outgoing requests.',
        type: 'string',
        placeholder: 'http://proxy.example.com:8080'
      },
      {
        key: 'NO_PROXY',
        label: 'No proxy domains',
        description: 'Comma-separated domains that bypass the proxy.',
        type: 'string',
        placeholder: 'localhost,127.0.0.1,.internal.com'
      },
      {
        key: 'NODE_EXTRA_CA_CERTS',
        label: 'Extra CA certificates',
        description: 'Path to additional CA certificates file for TLS verification.',
        type: 'string',
        placeholder: '/etc/ssl/certs/custom-ca.pem'
      },
      {
        key: 'CLAUDE_CODE_CLIENT_CERT',
        label: 'Client certificate',
        description: 'Path to client TLS certificate for mutual TLS authentication.',
        type: 'string',
        placeholder: '/path/to/client.crt'
      },
      {
        key: 'CLAUDE_CODE_CLIENT_KEY',
        label: 'Client key',
        description: 'Path to client TLS private key.',
        type: 'string',
        placeholder: '/path/to/client.key'
      },
      {
        key: 'CLAUDE_CODE_CLIENT_KEY_PASSPHRASE',
        label: 'Client key passphrase',
        description: 'Passphrase for the encrypted client private key.',
        type: 'string',
        placeholder: ''
      }
    ]
  },
  // ── Telemetry (OpenTelemetry) ─────────────────────────────────────────
  {
    id: 'telemetry',
    label: 'Telemetry (OpenTelemetry)',
    vars: [
      {
        key: 'CLAUDE_CODE_ENABLE_TELEMETRY',
        label: 'Enable telemetry',
        description:
          'Enable OpenTelemetry metric and event export. Required for all OTel settings.',
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
      },
      {
        key: 'CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS',
        label: 'OTel shutdown timeout (ms)',
        description: 'Timeout for OpenTelemetry graceful shutdown in milliseconds.',
        type: 'number-string',
        placeholder: '5000'
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
            <VarRow key={v.key} v={v} currentValue={env[v.key]} onSet={onSet} onUnset={onUnset} />
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
  const env = useMemo(() => (parsed.env ?? {}) as Record<string, string>, [parsed.env])

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
