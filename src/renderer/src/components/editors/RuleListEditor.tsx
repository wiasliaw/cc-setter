import { useCallback } from 'react'
import { ChevronUp, ChevronDown, Plus } from 'lucide-react'
import { RuleInput } from './RuleInput'

interface RuleListEditorProps {
  label: string
  description: string
  rules: string[]
  onChange: (rules: string[]) => void
}

export function RuleListEditor({
  label,
  description,
  rules,
  onChange
}: RuleListEditorProps): React.JSX.Element {
  const handleRuleChange = useCallback(
    (index: number, value: string) => {
      const next = [...rules]
      next[index] = value
      onChange(next)
    },
    [rules, onChange]
  )

  const handleRemove = useCallback(
    (index: number) => {
      const next = rules.filter((_, i) => i !== index)
      onChange(next)
    },
    [rules, onChange]
  )

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      const next = [...rules]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      onChange(next)
    },
    [rules, onChange]
  )

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index >= rules.length - 1) return
      const next = [...rules]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      onChange(next)
    },
    [rules, onChange]
  )

  const handleAdd = useCallback(() => {
    onChange([...rules, ''])
  }, [rules, onChange])

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>

      {rules.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-zinc-500 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-700"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === rules.length - 1}
                  className="text-zinc-500 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-700"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <RuleInput
                  value={rule}
                  onChange={(v) => handleRuleChange(index, v)}
                  onRemove={() => handleRemove(index)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-zinc-600">No rules configured</p>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300"
      >
        <Plus size={12} />
        Add rule
      </button>
    </div>
  )
}
