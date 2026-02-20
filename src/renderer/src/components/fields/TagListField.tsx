import { useState, useCallback } from 'react'
import type { FieldProps } from './types'

export function TagListField({
  label,
  description,
  value,
  onChange,
  placeholder
}: FieldProps): React.JSX.Element {
  const tags: string[] = Array.isArray(value) ? (value as string[]) : []
  const [input, setInput] = useState('')

  const addTag = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed || tags.includes(trimmed)) return
    onChange([...tags, trimmed])
    setInput('')
  }, [input, tags, onChange])

  const removeTag = useCallback(
    (tag: string) => {
      const next = tags.filter((t) => t !== tag)
      onChange(next.length > 0 ? next : undefined)
    },
    [tags, onChange]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-zinc-500 transition-colors hover:text-zinc-200"
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Type and press Enter'}
        className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600"
      />
    </div>
  )
}
