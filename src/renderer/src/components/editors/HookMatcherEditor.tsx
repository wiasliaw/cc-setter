import { useCallback, useState } from 'react'
import { ChevronUp, ChevronDown, Plus, X } from 'lucide-react'
import { HookConfigForm } from './HookConfigForm'
import type { HookConfig } from './HookConfigForm'

export interface HookMatcher {
  matcher?: string
  hooks: HookConfig[]
}

interface HookMatcherEditorProps {
  matcher: HookMatcher
  onChange: (matcher: HookMatcher) => void
  onRemove: () => void
  index: number
}

const inputClass =
  'w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600'

export function HookMatcherEditor({
  matcher,
  onChange,
  onRemove,
  index
}: HookMatcherEditorProps): React.JSX.Element {
  const [showTypeMenu, setShowTypeMenu] = useState(false)

  const updateHook = useCallback(
    (hookIndex: number, updated: HookConfig) => {
      const hooks = [...matcher.hooks]
      hooks[hookIndex] = updated
      onChange({ ...matcher, hooks })
    },
    [matcher, onChange]
  )

  const removeHook = useCallback(
    (hookIndex: number) => {
      const hooks = matcher.hooks.filter((_, i) => i !== hookIndex)
      onChange({ ...matcher, hooks })
    },
    [matcher, onChange]
  )

  const moveHook = useCallback(
    (hookIndex: number, direction: -1 | 1) => {
      const hooks = [...matcher.hooks]
      const target = hookIndex + direction
      if (target < 0 || target >= hooks.length) return
      ;[hooks[hookIndex], hooks[target]] = [hooks[target], hooks[hookIndex]]
      onChange({ ...matcher, hooks })
    },
    [matcher, onChange]
  )

  const addHook = useCallback(
    (type: HookConfig['type']) => {
      const newHook: HookConfig =
        type === 'command'
          ? { type: 'command', command: '' }
          : { type, prompt: '' }
      onChange({ ...matcher, hooks: [...matcher.hooks, newHook] })
      setShowTypeMenu(false)
    },
    [matcher, onChange]
  )

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">Matcher #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-zinc-500 transition-colors hover:text-red-400"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-3">
        <label className="mb-1 text-xs font-medium text-zinc-400">Matcher Pattern</label>
        <p className="mb-1.5 text-[11px] leading-relaxed text-zinc-600">
          Pattern to match tool names or event context
        </p>
        <input
          type="text"
          value={matcher.matcher ?? ''}
          onChange={(e) =>
            onChange({ ...matcher, matcher: e.target.value || undefined })
          }
          placeholder="e.g. Edit|Write (leave empty to match all)"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        {matcher.hooks.map((hook, i) => (
          <div key={i} className="flex gap-1.5">
            <div className="flex flex-col justify-center gap-0.5">
              <button
                type="button"
                disabled={i === 0}
                onClick={() => moveHook(i, -1)}
                className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                disabled={i === matcher.hooks.length - 1}
                onClick={() => moveHook(i, 1)}
                className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <HookConfigForm
                hook={hook}
                onChange={(updated) => updateHook(i, updated)}
                onRemove={() => removeHook(i)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-2">
        <button
          type="button"
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          className="flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
        >
          <Plus size={12} />
          Add hook
        </button>
        {showTypeMenu && (
          <div className="absolute left-0 top-full z-10 mt-1 overflow-hidden rounded border border-zinc-700 bg-zinc-800 shadow-lg">
            {(['command', 'prompt', 'agent'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => addHook(type)}
                className="block w-full px-4 py-1.5 text-left text-xs text-zinc-300 transition-colors hover:bg-zinc-700"
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
