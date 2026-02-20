import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/editor-store'
import { HookEventGroup } from '@/components/editors/HookEventGroup'
import { HOOK_EVENT_TYPES } from '@/constants/sections'
import type { HookMatcher } from '@/components/editors/HookMatcherEditor'

function Toggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
          checked ? 'bg-blue-600' : 'bg-zinc-700'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}

export function HooksSection(): React.JSX.Element {
  const parsed = useEditorStore((s) => s.parsed)
  const updateField = useEditorStore((s) => s.updateField)
  const removeField = useEditorStore((s) => s.removeField)

  const disableAllHooks = parsed.disableAllHooks === true
  const allowManagedHooksOnly = parsed.allowManagedHooksOnly === true
  const hooks = (parsed.hooks ?? {}) as Record<string, unknown[]>

  const handleToggle = useCallback(
    (key: string, value: boolean) => {
      if (value) {
        updateField([key], true)
      } else {
        removeField([key])
      }
    },
    [updateField, removeField]
  )

  const handleEventChange = useCallback(
    (eventKey: string, newMatchers: HookMatcher[]) => {
      if (newMatchers.length === 0) {
        removeField(['hooks', eventKey])
      } else {
        updateField(['hooks', eventKey], newMatchers)
      }
    },
    [updateField, removeField]
  )

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400">Hooks</h2>

      <h3 className="mb-2 text-xs font-medium text-zinc-500">Global Settings</h3>
      <div className="flex flex-col gap-2">
        <Toggle
          label="Disable All Hooks"
          description="Globally disable all hooks from running."
          checked={disableAllHooks}
          onChange={(v) => handleToggle('disableAllHooks', v)}
        />
        <Toggle
          label="Allow Managed Hooks Only"
          description="Only allow hooks that are managed by the system, blocking user-defined hooks."
          checked={allowManagedHooksOnly}
          onChange={(v) => handleToggle('allowManagedHooksOnly', v)}
        />
      </div>

      <h3 className="mb-2 mt-4 text-xs font-medium text-zinc-500">Event Hooks</h3>
      <div className="flex flex-col gap-2">
        {HOOK_EVENT_TYPES.map(({ key, description }) => {
          const matchers = (hooks[key] ?? []) as HookMatcher[]
          return (
            <HookEventGroup
              key={key}
              eventType={key}
              description={description}
              matchers={matchers}
              onChange={(newMatchers) => handleEventChange(key, newMatchers)}
            />
          )
        })}
      </div>
    </section>
  )
}
