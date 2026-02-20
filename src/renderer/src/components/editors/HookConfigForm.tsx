import { cn } from '@/lib/utils'

interface CommandHook {
  type: 'command'
  command: string
  timeout?: number
  async?: boolean
  statusMessage?: string
}

interface PromptHook {
  type: 'prompt'
  prompt: string
  model?: string
  timeout?: number
  statusMessage?: string
}

interface AgentHook {
  type: 'agent'
  prompt: string
  model?: string
  timeout?: number
  statusMessage?: string
}

export type HookConfig = CommandHook | PromptHook | AgentHook

interface HookConfigFormProps {
  hook: HookConfig
  onChange: (hook: HookConfig) => void
  onRemove: () => void
}

const HOOK_TYPES = ['command', 'prompt', 'agent'] as const

const inputClass =
  'w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600'

const labelClass = 'text-xs font-medium text-zinc-400 mb-1'

function switchType(hook: HookConfig, newType: HookConfig['type']): HookConfig {
  const shared: { timeout?: number; statusMessage?: string } = {}
  if (hook.timeout !== undefined) shared.timeout = hook.timeout
  if (hook.statusMessage !== undefined) shared.statusMessage = hook.statusMessage

  switch (newType) {
    case 'command':
      return { type: 'command', command: '', ...shared }
    case 'prompt':
      return { type: 'prompt', prompt: '', ...shared }
    case 'agent':
      return { type: 'agent', prompt: '', ...shared }
  }
}

export function HookConfigForm({ hook, onChange, onRemove }: HookConfigFormProps): React.JSX.Element {
  return (
    <div className="relative rounded border border-zinc-700 bg-zinc-800/50 px-3 py-3">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 text-zinc-500 transition-colors hover:text-red-400"
      >
        ×
      </button>

      <div className="mb-3 flex gap-0 overflow-hidden rounded border border-zinc-700">
        {HOOK_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              if (t !== hook.type) onChange(switchType(hook, t))
            }}
            className={cn(
              'flex-1 px-3 py-1 text-xs font-medium transition-colors',
              hook.type === t
                ? 'bg-zinc-700 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {hook.type === 'command' && (
          <>
            <div>
              <label className={labelClass}>Command</label>
              <input
                type="text"
                value={hook.command}
                onChange={(e) => onChange({ ...hook, command: e.target.value })}
                placeholder="e.g. prettier --write $FILE"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Timeout</label>
              <input
                type="number"
                value={hook.timeout ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  onChange({ ...hook, timeout: v === '' ? undefined : Number(v) })
                }}
                placeholder="seconds"
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className={labelClass}>Async</label>
              <button
                type="button"
                role="switch"
                aria-checked={hook.async === true}
                onClick={() => onChange({ ...hook, async: !hook.async })}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
                  hook.async ? 'bg-blue-600' : 'bg-zinc-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform',
                    hook.async ? 'translate-x-4.5' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
            <div>
              <label className={labelClass}>Status Message</label>
              <input
                type="text"
                value={hook.statusMessage ?? ''}
                onChange={(e) => onChange({ ...hook, statusMessage: e.target.value || undefined })}
                placeholder="Custom spinner message"
                className={inputClass}
              />
            </div>
          </>
        )}

        {(hook.type === 'prompt' || hook.type === 'agent') && (
          <>
            <div>
              <label className={labelClass}>Prompt</label>
              <textarea
                value={hook.prompt}
                onChange={(e) => onChange({ ...hook, prompt: e.target.value })}
                placeholder="Prompt to evaluate. Use $ARGUMENTS for hook input."
                rows={4}
                className={cn(inputClass, 'resize-y min-h-[80px]')}
              />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <input
                type="text"
                value={hook.model ?? ''}
                onChange={(e) => onChange({ ...hook, model: e.target.value || undefined })}
                placeholder="Optional model override"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Timeout</label>
              <input
                type="number"
                value={hook.timeout ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  onChange({ ...hook, timeout: v === '' ? undefined : Number(v) })
                }}
                placeholder={hook.type === 'agent' ? '60' : '30'}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Status Message</label>
              <input
                type="text"
                value={hook.statusMessage ?? ''}
                onChange={(e) => onChange({ ...hook, statusMessage: e.target.value || undefined })}
                placeholder="Custom spinner message"
                className={inputClass}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
