import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { GenericFieldRenderer } from '@/components/fields/GenericFieldRenderer'
import { getDeprecation } from '@shared/deprecated-fields'
import type { FieldConfig } from '@/components/fields/types'

const GENERAL_FIELDS: FieldConfig[] = [
  {
    key: 'language',
    label: 'Language',
    description: "Preferred language for Claude's responses",
    type: 'string',
    placeholder: 'e.g. japanese, spanish, french'
  },
  {
    key: 'model',
    label: 'Model',
    description: 'Override the default model used by Claude Code',
    type: 'string',
    placeholder: 'e.g. claude-sonnet-4-20250514'
  },
  {
    key: 'availableModels',
    label: 'Available Models',
    description:
      'Restrict which models users can select. When defined, users can only switch between these model options.',
    type: 'taglist',
    placeholder: 'e.g. sonnet, haiku'
  },
  {
    key: 'effortLevel',
    label: 'Effort Level',
    description:
      'Control adaptive reasoning effort. Lower effort is faster and cheaper for straightforward tasks, higher effort provides deeper reasoning.',
    type: 'enum',
    enumValues: ['low', 'medium', 'high'],
    defaultValue: 'high'
  },
  {
    key: 'outputStyle',
    label: 'Output Style',
    description: 'Controls the output style for assistant responses.',
    type: 'string',
    placeholder: 'e.g. default, Explanatory, Learning'
  },
  {
    key: 'autoUpdatesChannel',
    label: 'Auto Updates Channel',
    description:
      'Release channel for updates. "stable" for a version about one week old, "latest" for the most recent release.',
    type: 'enum',
    enumValues: ['stable', 'latest'],
    defaultValue: 'latest'
  },
  {
    key: 'cleanupPeriodDays',
    label: 'Cleanup Period (days)',
    description: 'Number of days to retain chat transcripts. Set to 0 to disable cleanup.',
    type: 'number',
    defaultValue: 30,
    placeholder: '30',
    min: 0
  },
  {
    key: 'forceLoginMethod',
    label: 'Force Login Method',
    description:
      'Force a specific login method: "claudeai" for Claude Pro/Max, "console" for Console billing.',
    type: 'enum',
    enumValues: ['claudeai', 'console']
  },
  {
    key: 'respectGitignore',
    label: 'Respect .gitignore',
    description:
      'Control whether the @ file picker respects .gitignore patterns. Files matching .gitignore patterns are excluded from suggestions.',
    type: 'boolean',
    defaultValue: true
  },
  {
    key: 'alwaysThinkingEnabled',
    label: 'Always Enable Thinking',
    description: 'Enable extended thinking by default for all sessions.',
    type: 'boolean'
  },
  {
    key: 'spinnerTipsEnabled',
    label: 'Show Spinner Tips',
    description: 'Show tips in the spinner while Claude is working.',
    type: 'boolean',
    defaultValue: true
  },
  {
    key: 'showTurnDuration',
    label: 'Show Turn Duration',
    description: 'Show turn duration messages after responses.',
    type: 'boolean',
    defaultValue: true
  },
  {
    key: 'prefersReducedMotion',
    label: 'Reduce Motion',
    description: 'Reduce or disable UI animations (spinners, shimmer, flash effects) for accessibility.',
    type: 'boolean',
    defaultValue: false
  },
  {
    key: 'includeCoAuthoredBy',
    label: 'Include Co-Authored-By',
    description:
      'Whether to include the co-authored-by Claude byline in git commits and pull requests.',
    type: 'boolean',
    defaultValue: true,
    deprecated: getDeprecation('includeCoAuthoredBy')
  }
]

export function GeneralSection(): React.JSX.Element {
  const parsed = useEditorStore((s) => s.parsed)
  const updateField = useEditorStore((s) => s.updateField)
  const removeField = useEditorStore((s) => s.removeField)

  const handleUpdate = useCallback(
    (key: string, value: unknown) => updateField([key], value),
    [updateField]
  )

  const handleRemove = useCallback(
    (key: string) => removeField([key]),
    [removeField]
  )

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400">General</h2>
      <div className="flex flex-col gap-2">
        {GENERAL_FIELDS.map((config) => (
          <GenericFieldRenderer
            key={config.key}
            config={config}
            value={parsed[config.key]}
            onUpdate={(val) => handleUpdate(config.key, val)}
            onRemove={() => handleRemove(config.key)}
          />
        ))}
      </div>
    </section>
  )
}
