import type { FieldProps } from './types'

export function StringField({
  label,
  description,
  value,
  onChange,
  placeholder
}: FieldProps): React.JSX.Element {
  const current = typeof value === 'string' ? value : ''

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <p className="text-sm font-medium text-zinc-200">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      <input
        type="text"
        value={current}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={placeholder}
        className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600"
      />
    </div>
  )
}
