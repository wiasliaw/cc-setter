import { useCallback, useState } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { BooleanField } from '@/components/fields/BooleanField'
import { NumberField } from '@/components/fields/NumberField'
import { TagListField } from '@/components/fields/TagListField'
import { cn } from '@/lib/utils'

function ViolationsEditor({
  violations,
  onChange
}: {
  violations: Record<string, string[]>
  onChange: (value: Record<string, string[]> | undefined) => void
}): React.JSX.Element {
  const entries = Object.entries(violations)
  const [drafts, setDrafts] = useState<{ key: string; paths: string[] }[]>(() =>
    entries.map(([key, paths]) => ({ key, paths }))
  )

  const emit = useCallback(
    (next: { key: string; paths: string[] }[]) => {
      const obj: Record<string, string[]> = {}
      for (const { key, paths } of next) {
        const trimmed = key.trim()
        if (trimmed) {
          obj[trimmed] = paths
        }
      }
      if (Object.keys(obj).length > 0) {
        onChange(obj)
      } else {
        onChange(undefined)
      }
    },
    [onChange]
  )

  const addEntry = (): void => {
    const next = [...drafts, { key: '', paths: [] }]
    setDrafts(next)
  }

  const removeEntry = (index: number): void => {
    const next = drafts.filter((_, i) => i !== index)
    setDrafts(next)
    emit(next)
  }

  const updateKey = (index: number, newKey: string): void => {
    const next = drafts.map((d, i) => (i === index ? { ...d, key: newKey } : d))
    setDrafts(next)
    emit(next)
  }

  const updatePaths = (index: number, paths: string[]): void => {
    const next = drafts.map((d, i) => (i === index ? { ...d, paths } : d))
    setDrafts(next)
    emit(next)
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <p className="text-sm font-medium text-zinc-200">Ignore Violations</p>
      <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
        Map of command patterns to filesystem paths whose violations should be ignored.
      </p>

      {drafts.length === 0 && (
        <p className="mt-2 text-xs italic text-zinc-600">No violation ignores configured</p>
      )}

      {drafts.map((draft, index) => (
        <div
          key={index}
          className="mt-3 rounded border border-zinc-800 bg-zinc-950/40 px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft.key}
              onChange={(e) => updateKey(index, e.target.value)}
              placeholder="Command pattern"
              className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600"
            />
            <button
              type="button"
              onClick={() => removeEntry(index)}
              className="shrink-0 rounded px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              Remove
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {draft.paths.map((path) => (
              <span
                key={path}
                className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300"
              >
                {path}
                <button
                  type="button"
                  onClick={() =>
                    updatePaths(
                      index,
                      draft.paths.filter((p) => p !== path)
                    )
                  }
                  className="text-zinc-500 transition-colors hover:text-zinc-200"
                >
                  x
                </button>
              </span>
            ))}
          </div>

          <PathInput onAdd={(p) => updatePaths(index, [...draft.paths, p])} />
        </div>
      ))}

      <button
        type="button"
        onClick={addEntry}
        className={cn(
          'mt-3 rounded border border-dashed border-zinc-700 px-3 py-1.5 text-xs text-zinc-400',
          'transition-colors hover:border-zinc-500 hover:text-zinc-300'
        )}
      >
        + Add pattern
      </button>
    </div>
  )
}

function PathInput({ onAdd }: { onAdd: (path: string) => void }): React.JSX.Element {
  const [input, setInput] = useState('')

  const add = (): void => {
    const trimmed = input.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setInput('')
  }

  return (
    <input
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          add()
        }
      }}
      placeholder="Path — press Enter to add"
      className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600"
    />
  )
}

export function SandboxSection(): React.JSX.Element {
  const parsed = useEditorStore((s) => s.parsed)
  const updateField = useEditorStore((s) => s.updateField)
  const removeField = useEditorStore((s) => s.removeField)

  const sandbox = (parsed.sandbox ?? {}) as Record<string, unknown>
  const network = (sandbox.network ?? {}) as Record<string, unknown>

  const handleSandboxUpdate = useCallback(
    (path: string[], value: unknown) => {
      updateField(['sandbox', ...path], value)
    },
    [updateField]
  )

  const handleSandboxRemove = useCallback(
    (path: string[]) => {
      removeField(['sandbox', ...path])
    },
    [removeField]
  )

  const violations = (sandbox.ignoreViolations ?? {}) as Record<string, string[]>

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-zinc-400">Sandbox</h2>

      <div className="flex flex-col gap-2">
        <BooleanField
          label="Enable Sandbox"
          description="Enable sandboxed bash execution"
          value={sandbox.enabled}
          onChange={(val) => handleSandboxUpdate(['enabled'], val)}
        />
        <BooleanField
          label="Auto-Allow Bash If Sandboxed"
          description="Automatically allow bash commands without prompting when sandboxed"
          value={sandbox.autoAllowBashIfSandboxed}
          onChange={(val) => handleSandboxUpdate(['autoAllowBashIfSandboxed'], val)}
        />
        <BooleanField
          label="Enable Weaker Nested Sandbox"
          description="Enable weaker sandbox mode for unprivileged docker environments"
          value={sandbox.enableWeakerNestedSandbox}
          onChange={(val) => handleSandboxUpdate(['enableWeakerNestedSandbox'], val)}
        />
        <BooleanField
          label="Allow Unsandboxed Commands"
          description="Allow commands to run outside the sandbox via dangerouslyDisableSandbox parameter"
          value={sandbox.allowUnsandboxedCommands}
          onChange={(val) => handleSandboxUpdate(['allowUnsandboxedCommands'], val)}
        />
      </div>

      <h3 className="mb-2 mt-6 text-xs font-medium text-zinc-500">Network</h3>
      <div className="flex flex-col gap-2">
        <BooleanField
          label="Allow Local Binding"
          description="Allow binding to local network addresses (e.g., localhost ports)"
          value={network.allowLocalBinding}
          onChange={(val) => handleSandboxUpdate(['network', 'allowLocalBinding'], val)}
        />
        <BooleanField
          label="Allow All Unix Sockets"
          description="Allow all Unix domain socket connections (overrides specific socket list)"
          value={network.allowAllUnixSockets}
          onChange={(val) => handleSandboxUpdate(['network', 'allowAllUnixSockets'], val)}
        />
        <NumberField
          label="HTTP Proxy Port"
          description="HTTP proxy port for network filtering (auto-assigned if not specified)"
          value={network.httpProxyPort}
          onChange={(val) =>
            val != null
              ? handleSandboxUpdate(['network', 'httpProxyPort'], val)
              : handleSandboxRemove(['network', 'httpProxyPort'])
          }
          placeholder="1-65535"
          min={1}
        />
        <NumberField
          label="SOCKS Proxy Port"
          description="SOCKS proxy port for network filtering (auto-assigned if not specified)"
          value={network.socksProxyPort}
          onChange={(val) =>
            val != null
              ? handleSandboxUpdate(['network', 'socksProxyPort'], val)
              : handleSandboxRemove(['network', 'socksProxyPort'])
          }
          placeholder="1-65535"
          min={1}
        />
        <TagListField
          label="Allowed Domains"
          description="Allowlist of network domains. Supports wildcards like *.example.com"
          value={network.allowedDomains}
          onChange={(val) =>
            Array.isArray(val) && val.length > 0
              ? handleSandboxUpdate(['network', 'allowedDomains'], val)
              : handleSandboxRemove(['network', 'allowedDomains'])
          }
          placeholder="e.g. *.example.com"
        />
        <TagListField
          label="Denied Domains"
          description="Denylist of network domains. Supports wildcards like *.example.com"
          value={network.deniedDomains}
          onChange={(val) =>
            Array.isArray(val) && val.length > 0
              ? handleSandboxUpdate(['network', 'deniedDomains'], val)
              : handleSandboxRemove(['network', 'deniedDomains'])
          }
          placeholder="e.g. *.malicious.com"
        />
        <TagListField
          label="Allowed Unix Sockets"
          description="Specific Unix domain socket paths to allow (SSH agent, Docker, etc.)"
          value={network.allowUnixSockets}
          onChange={(val) =>
            Array.isArray(val) && val.length > 0
              ? handleSandboxUpdate(['network', 'allowUnixSockets'], val)
              : handleSandboxRemove(['network', 'allowUnixSockets'])
          }
          placeholder="/path/to/socket"
        />
      </div>

      <h3 className="mb-2 mt-6 text-xs font-medium text-zinc-500">Commands</h3>
      <div className="flex flex-col gap-2">
        <TagListField
          label="Excluded Commands"
          description="Commands that should never run in the sandbox (e.g., git, docker)"
          value={sandbox.excludedCommands}
          onChange={(val) =>
            Array.isArray(val) && val.length > 0
              ? handleSandboxUpdate(['excludedCommands'], val)
              : handleSandboxRemove(['excludedCommands'])
          }
          placeholder="e.g. git"
        />
      </div>

      <h3 className="mb-2 mt-6 text-xs font-medium text-zinc-500">Ignore Violations</h3>
      <div className="flex flex-col gap-2">
        <ViolationsEditor
          violations={violations}
          onChange={(val) =>
            val != null
              ? handleSandboxUpdate(['ignoreViolations'], val)
              : handleSandboxRemove(['ignoreViolations'])
          }
        />
      </div>
    </section>
  )
}
