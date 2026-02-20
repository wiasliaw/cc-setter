import { useState, useCallback } from 'react'
import { ChevronDown, ChevronRight, ChevronUp, Plus } from 'lucide-react'
import { HookMatcherEditor } from './HookMatcherEditor'
import type { HookMatcher } from './HookMatcherEditor'

interface HookEventGroupProps {
  eventType: string
  description: string
  matchers: HookMatcher[]
  onChange: (matchers: HookMatcher[]) => void
}

export function HookEventGroup({
  eventType,
  description,
  matchers,
  onChange
}: HookEventGroupProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(matchers.length > 0)

  const moveMatcher = useCallback(
    (index: number, direction: -1 | 1) => {
      const updated = [...matchers]
      const target = index + direction
      if (target < 0 || target >= updated.length) return
      ;[updated[index], updated[target]] = [updated[target], updated[index]]
      onChange(updated)
    },
    [matchers, onChange]
  )

  const addMatcher = useCallback(() => {
    onChange([...matchers, { hooks: [] }])
    setExpanded(true)
  }, [matchers, onChange])

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/30">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2"
      >
        {expanded ? (
          <ChevronDown size={14} className="shrink-0 text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-zinc-500" />
        )}
        <span className="text-sm font-medium text-zinc-300">{eventType}</span>
        {matchers.length > 0 && (
          <span className="rounded-full bg-zinc-700 px-1.5 text-[10px] text-zinc-400">
            {matchers.length}
          </span>
        )}
        <span className="ml-auto text-[11px] text-zinc-600">{description}</span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-3">
          <div className="flex flex-col gap-2">
            {matchers.map((m, i) => (
              <div key={i} className="flex gap-1.5">
                <div className="flex flex-col justify-start gap-0.5 pt-3">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveMatcher(i, -1)}
                    className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    type="button"
                    disabled={i === matchers.length - 1}
                    onClick={() => moveMatcher(i, 1)}
                    className="text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-30 disabled:hover:text-zinc-500"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <HookMatcherEditor
                    matcher={m}
                    onChange={(updated) => {
                      const next = [...matchers]
                      next[i] = updated
                      onChange(next)
                    }}
                    onRemove={() => {
                      onChange(matchers.filter((_, idx) => idx !== i))
                    }}
                    index={i}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addMatcher}
            className="mt-2 flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
          >
            <Plus size={12} />
            Add matcher
          </button>
        </div>
      )}
    </div>
  )
}
