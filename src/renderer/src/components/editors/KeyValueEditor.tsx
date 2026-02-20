import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface KeyValueEditorProps {
  entries: Record<string, string>
  onChange: (entries: Record<string, string>) => void
  keyPattern?: RegExp
  keyPlaceholder?: string
  valuePlaceholder?: string
  label?: string
  description?: string
}

interface Row {
  id: number
  key: string
  value: string
}

let nextId = 0

function toRows(entries: Record<string, string>): Row[] {
  return Object.entries(entries).map(([key, value]) => ({
    id: nextId++,
    key,
    value
  }))
}

function toRecord(rows: Row[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const row of rows) {
    if (row.key.trim() !== '') {
      result[row.key] = row.value
    }
  }
  return result
}

export function KeyValueEditor({
  entries,
  onChange,
  keyPattern,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
  label,
  description
}: KeyValueEditorProps): React.JSX.Element {
  const [rows, setRows] = useState<Row[]>(() => toRows(entries))

  const emitChange = useCallback(
    (updated: Row[]) => {
      onChange(toRecord(updated))
    },
    [onChange]
  )

  const handleKeyChange = useCallback(
    (id: number, newKey: string) => {
      setRows((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, key: newKey } : r))
        emitChange(updated)
        return updated
      })
    },
    [emitChange]
  )

  const handleValueChange = useCallback(
    (id: number, newValue: string) => {
      setRows((prev) => {
        const updated = prev.map((r) => (r.id === id ? { ...r, value: newValue } : r))
        emitChange(updated)
        return updated
      })
    },
    [emitChange]
  )

  const handleRemove = useCallback(
    (id: number) => {
      setRows((prev) => {
        const updated = prev.filter((r) => r.id !== id)
        emitChange(updated)
        return updated
      })
    },
    [emitChange]
  )

  const handleAdd = useCallback(() => {
    setRows((prev) => [...prev, { id: nextId++, key: '', value: '' }])
  }, [])

  const inputBase =
    'w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600'

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      {label && (
        <div className="mb-3">
          <p className="text-sm font-medium text-zinc-200">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row) => {
            const keyInvalid = keyPattern && row.key.length > 0 && !keyPattern.test(row.key)

            return (
              <div key={row.id} className="flex items-center gap-2">
                <div className="w-[40%]">
                  <input
                    type="text"
                    value={row.key}
                    onChange={(e) => handleKeyChange(row.id, e.target.value)}
                    placeholder={keyPlaceholder}
                    className={cn(inputBase, keyInvalid && 'border-red-600')}
                  />
                </div>
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={row.value}
                    onChange={(e) => handleValueChange(row.id, e.target.value)}
                    placeholder={valuePlaceholder}
                    className={inputBase}
                  />
                </div>
                <div className="flex w-[10%] justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemove(row.id)}
                    className="text-zinc-500 transition-colors hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 text-xs text-blue-400 transition-colors hover:text-blue-300"
      >
        + Add
      </button>
    </div>
  )
}
