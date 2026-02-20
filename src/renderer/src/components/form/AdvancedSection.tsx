import { useCallback, useMemo } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { GenericFieldRenderer } from '@/components/fields/GenericFieldRenderer'
import { ALL_CLAIMED_KEYS } from '@/constants/sections'
import type { FieldConfig } from '@/components/fields/types'

const ADVANCED_FIELDS: FieldConfig[] = [
  {
    key: 'apiKeyHelper',
    label: 'API Key Helper',
    description: 'Path to a script that outputs authentication values',
    type: 'string',
    placeholder: '/bin/generate_temp_api_key.sh'
  },
  {
    key: 'awsCredentialExport',
    label: 'AWS Credential Export',
    description: 'Path to a script that exports AWS credentials',
    type: 'string',
    placeholder: '/bin/generate_aws_grant.sh'
  },
  {
    key: 'awsAuthRefresh',
    label: 'AWS Auth Refresh',
    description: 'Path to a script that refreshes AWS authentication',
    type: 'string',
    placeholder: 'aws sso login --profile myprofile'
  },
  {
    key: 'plansDirectory',
    label: 'Plans Directory',
    description: 'Customize where plan files are stored (relative to project root)',
    type: 'string',
    placeholder: '~/.claude/plans'
  },
  {
    key: 'forceLoginOrgUUID',
    label: 'Force Login Org UUID',
    description: 'Organization UUID to use for OAuth login',
    type: 'string',
    placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
  },
  {
    key: 'otelHeadersHelper',
    label: 'OTEL Headers Helper',
    description: 'Path to a script that outputs OpenTelemetry headers',
    type: 'string'
  },
  {
    key: 'enableAllProjectMcpServers',
    label: 'Enable All Project MCP Servers',
    description: 'Automatically approve all MCP servers in the project',
    type: 'boolean'
  },
  {
    key: 'skipWebFetchPreflight',
    label: 'Skip WebFetch Preflight',
    description: 'Skip the WebFetch blocklist check for enterprise environments',
    type: 'boolean'
  },
  {
    key: 'terminalProgressBarEnabled',
    label: 'Terminal Progress Bar',
    description: 'Enable the terminal progress bar in supported terminals',
    type: 'boolean',
    defaultValue: true
  },
  {
    key: 'teammateMode',
    label: 'Teammate Mode',
    description: 'How agent team teammates display: auto, in-process, or tmux',
    type: 'enum',
    enumValues: ['auto', 'in-process', 'tmux']
  },
  {
    key: 'enabledMcpjsonServers',
    label: 'Enabled MCP JSON Servers',
    description: 'List of approved MCP servers from .mcp.json',
    type: 'taglist',
    placeholder: 'e.g. memory, github'
  },
  {
    key: 'disabledMcpjsonServers',
    label: 'Disabled MCP JSON Servers',
    description: 'List of rejected MCP servers from .mcp.json',
    type: 'taglist',
    placeholder: 'e.g. filesystem'
  },
  {
    key: 'skippedMarketplaces',
    label: 'Skipped Marketplaces',
    description: 'Marketplaces the user has chosen not to install',
    type: 'taglist'
  },
  {
    key: 'skippedPlugins',
    label: 'Skipped Plugins',
    description: 'Plugins the user has chosen not to install (plugin@marketplace format)',
    type: 'taglist'
  },
  {
    key: 'companyAnnouncements',
    label: 'Company Announcements',
    description: 'Announcements to display at startup (one randomly selected)',
    type: 'taglist'
  }
]

const COMPLEX_FIELD_KEYS = [
  {
    key: 'attribution',
    label: 'Attribution',
    description: 'Customize attribution for git commits and pull requests'
  },
  {
    key: 'statusLine',
    label: 'Status Line',
    description: 'Custom status line display configuration'
  },
  {
    key: 'fileSuggestion',
    label: 'File Suggestion',
    description: 'Custom script for @ file autocomplete'
  },
  {
    key: 'spinnerVerbs',
    label: 'Spinner Verbs',
    description: 'Customize verbs shown in spinner messages'
  },
  {
    key: 'enabledPlugins',
    label: 'Enabled Plugins',
    description: 'Plugin configuration'
  },
  {
    key: 'extraKnownMarketplaces',
    label: 'Extra Marketplaces',
    description: 'Additional plugin marketplaces'
  },
  {
    key: 'strictKnownMarketplaces',
    label: 'Strict Marketplaces',
    description: 'Allowlist of plugin marketplaces (managed settings)'
  },
  {
    key: 'allowedMcpServers',
    label: 'Allowed MCP Servers',
    description: 'Enterprise allowlist of MCP servers'
  },
  {
    key: 'deniedMcpServers',
    label: 'Denied MCP Servers',
    description: 'Enterprise denylist of MCP servers'
  },
  {
    key: 'pluginConfigs',
    label: 'Plugin Configs',
    description: 'Per-plugin configuration including MCP server user configs'
  }
]

const ADVANCED_KEYS = new Set(ADVANCED_FIELDS.map((f) => f.key))
const COMPLEX_KEYS = new Set(COMPLEX_FIELD_KEYS.map((f) => f.key))

export function AdvancedSection(): React.JSX.Element {
  const parsed = useEditorStore((s) => s.parsed)
  const updateField = useEditorStore((s) => s.updateField)
  const removeField = useEditorStore((s) => s.removeField)

  const handleUpdate = useCallback(
    (key: string, value: unknown) => updateField([key], value),
    [updateField]
  )

  const handleRemove = useCallback((key: string) => removeField([key]), [removeField])

  const unknownKeys = useMemo(
    () =>
      Object.keys(parsed).filter(
        (k) => k !== '$schema' && !ALL_CLAIMED_KEYS.has(k) && !ADVANCED_KEYS.has(k) && !COMPLEX_KEYS.has(k)
      ),
    [parsed]
  )

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400">Advanced</h2>
      <div className="flex flex-col gap-2">
        {ADVANCED_FIELDS.map((config) => (
          <GenericFieldRenderer
            key={config.key}
            config={config}
            value={parsed[config.key]}
            onUpdate={(val) => handleUpdate(config.key, val)}
            onRemove={() => handleRemove(config.key)}
          />
        ))}

        {COMPLEX_FIELD_KEYS.map((field) => (
          <div key={field.key} className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">{field.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{field.description}</p>
              </div>
              {parsed[field.key] !== undefined && (
                <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                  configured
                </span>
              )}
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">Edit this field in JSON view for full control</p>
          </div>
        ))}

        {unknownKeys.map((key) => (
          <div key={key} className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">{key}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">Unrecognized field</p>
              </div>
              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                configured
              </span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-600">Edit this field in JSON view for full control</p>
          </div>
        ))}
      </div>
    </section>
  )
}
