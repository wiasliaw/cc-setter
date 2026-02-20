import { useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { RuleListEditor } from '@/components/editors/RuleListEditor'
import { TagListField } from '@/components/fields/TagListField'

const PERMISSION_MODES = [
  'default',
  'acceptEdits',
  'plan',
  'delegate',
  'dontAsk',
  'bypassPermissions'
] as const

export function PermissionsSection(): React.JSX.Element {
  const parsed = useEditorStore((s) => s.parsed)
  const updateField = useEditorStore((s) => s.updateField)
  const removeField = useEditorStore((s) => s.removeField)

  const permissions = (parsed.permissions ?? {}) as Record<string, unknown>

  const handleUpdate = useCallback(
    (subKey: string, value: unknown) => {
      updateField(['permissions', subKey], value)
    },
    [updateField]
  )

  const handleRemove = useCallback(
    (subKey: string) => {
      removeField(['permissions', subKey])
    },
    [removeField]
  )

  const defaultMode = (permissions.defaultMode as string) ?? ''
  const disableBypass = (permissions.disableBypassPermissionsMode as string) ?? ''
  const allowRules = (permissions.allow ?? []) as string[]
  const denyRules = (permissions.deny ?? []) as string[]
  const askRules = (permissions.ask ?? []) as string[]

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400">Permissions</h2>

      <div className="flex flex-col gap-2">
        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <p className="text-sm font-medium text-zinc-200">Default Permission Mode</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Controls how Claude handles tool-use permissions by default.
          </p>
          <select
            value={defaultMode}
            onChange={(e) =>
              e.target.value
                ? handleUpdate('defaultMode', e.target.value)
                : handleRemove('defaultMode')
            }
            className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none transition-colors focus:border-blue-600"
          >
            <option value="">Use default</option>
            {PERMISSION_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <p className="text-sm font-medium text-zinc-200">Disable Bypass Permissions Mode</p>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
            Prevent users from using the bypass permissions mode.
          </p>
          <select
            value={disableBypass}
            onChange={(e) =>
              e.target.value
                ? handleUpdate('disableBypassPermissionsMode', e.target.value)
                : handleRemove('disableBypassPermissionsMode')
            }
            className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none transition-colors focus:border-blue-600"
          >
            <option value="">Use default</option>
            <option value="disable">disable</option>
          </select>
        </div>

        <RuleListEditor
          label="Allow Rules"
          description="Operations that are always permitted without prompting"
          rules={allowRules}
          onChange={(rules) =>
            rules.length ? handleUpdate('allow', rules) : handleRemove('allow')
          }
        />

        <RuleListEditor
          label="Deny Rules"
          description="Operations that are always denied"
          rules={denyRules}
          onChange={(rules) => (rules.length ? handleUpdate('deny', rules) : handleRemove('deny'))}
        />

        <RuleListEditor
          label="Ask Rules"
          description="Operations that always prompt for confirmation"
          rules={askRules}
          onChange={(rules) => (rules.length ? handleUpdate('ask', rules) : handleRemove('ask'))}
        />

        <TagListField
          label="Additional Directories"
          description="Extra directories Claude is allowed to access beyond the project root"
          value={permissions.additionalDirectories}
          onChange={(val) =>
            val !== undefined
              ? handleUpdate('additionalDirectories', val)
              : handleRemove('additionalDirectories')
          }
          placeholder="e.g. /shared/libs"
        />
      </div>
    </section>
  )
}
