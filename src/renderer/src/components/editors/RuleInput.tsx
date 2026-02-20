import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RuleInputProps {
  value: string
  onChange: (value: string) => void
  onRemove: () => void
}

const TOOL_NAMES = [
  'Bash',
  'Edit',
  'ExitPlanMode',
  'Glob',
  'Grep',
  'KillShell',
  'LS',
  'LSP',
  'MultiEdit',
  'NotebookEdit',
  'NotebookRead',
  'Read',
  'Skill',
  'Task',
  'TaskCreate',
  'TaskGet',
  'TaskList',
  'TaskOutput',
  'TaskStop',
  'TaskUpdate',
  'TodoWrite',
  'ToolSearch',
  'WebFetch',
  'WebSearch',
  'Write'
] as const

const SPECIFIER_HINTS: Partial<Record<string, string>> = {
  Bash: 'e.g. npm run *',
  Edit: 'e.g. /src/**/*.ts',
  Read: 'e.g. /src/**/*.ts',
  Write: 'e.g. /src/**/*.ts',
  MultiEdit: 'e.g. /src/**/*.ts',
  Glob: 'e.g. **/*.json',
  Grep: 'e.g. **/*.ts',
  LS: 'e.g. /src',
  WebFetch: 'e.g. https://example.com/*',
  WebSearch: 'e.g. site:docs.example.com'
}

// Pattern: ToolName, ToolName(specifier), or mcp__*
const RULE_PATTERN =
  /^((Bash|Edit|ExitPlanMode|Glob|Grep|KillShell|LS|LSP|MultiEdit|NotebookEdit|NotebookRead|Read|Skill|Task|TaskCreate|TaskGet|TaskList|TaskOutput|TaskStop|TaskUpdate|TodoWrite|ToolSearch|WebFetch|WebSearch|Write)(\((?=.*[^)*?])[^)]+\))?|mcp__.*)$/

function parseRule(raw: string): { isMcp: boolean; tool: string; specifier: string } {
  if (raw.startsWith('mcp__')) {
    return { isMcp: true, tool: '', specifier: raw }
  }

  const match = raw.match(/^([A-Za-z]+)(?:\(([^)]*)\))?$/)
  if (match) {
    return { isMcp: false, tool: match[1], specifier: match[2] ?? '' }
  }

  return { isMcp: false, tool: '', specifier: '' }
}

function buildOutput(tool: string, specifier: string): string {
  if (!tool) return ''
  return specifier ? `${tool}(${specifier})` : tool
}

const inputBase =
  'rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-blue-600'

export function RuleInput({ value, onChange, onRemove }: RuleInputProps): React.JSX.Element {
  const initial = useMemo(() => parseRule(value), [value])
  const [isMcp, setIsMcp] = useState(initial.isMcp)
  const [tool, setTool] = useState(initial.tool)
  const [specifier, setSpecifier] = useState(initial.specifier)
  const [mcpValue, setMcpValue] = useState(initial.isMcp ? value : '')

  useEffect(() => {
    const parsed = parseRule(value)
    setIsMcp(parsed.isMcp)
    if (parsed.isMcp) {
      setMcpValue(value)
    } else {
      setTool(parsed.tool)
      setSpecifier(parsed.specifier)
    }
  }, [value])

  const currentOutput = isMcp ? mcpValue : buildOutput(tool, specifier)
  const isValid = currentOutput === '' || RULE_PATTERN.test(currentOutput)

  const handleToolChange = (newTool: string): void => {
    setTool(newTool)
    const output = buildOutput(newTool, specifier)
    onChange(output)
  }

  const handleSpecifierChange = (newSpec: string): void => {
    setSpecifier(newSpec)
    const output = buildOutput(tool, newSpec)
    onChange(output)
  }

  const handleMcpChange = (raw: string): void => {
    setMcpValue(raw)
    onChange(raw)
  }

  const toggleMode = (): void => {
    if (isMcp) {
      setIsMcp(false)
      setTool('')
      setSpecifier('')
      onChange('')
    } else {
      setIsMcp(true)
      setMcpValue('')
      onChange('')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleMode}
        className="shrink-0 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
      >
        {isMcp ? 'MCP' : 'Tool'}
      </button>

      {isMcp ? (
        <input
          type="text"
          value={mcpValue}
          onChange={(e) => handleMcpChange(e.target.value)}
          placeholder="mcp__serverName__toolName"
          className={cn(inputBase, 'min-w-0 flex-1', !isValid && 'border-red-600')}
        />
      ) : (
        <>
          <select
            value={tool}
            onChange={(e) => handleToolChange(e.target.value)}
            className={cn(inputBase, 'w-[35%] shrink-0', !isValid && 'border-red-600')}
          >
            <option value="">Select tool...</option>
            {TOOL_NAMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={specifier}
            onChange={(e) => handleSpecifierChange(e.target.value)}
            placeholder={SPECIFIER_HINTS[tool] ?? 'specifier (optional)'}
            className={cn(inputBase, 'min-w-0 flex-[1_1_55%]', !isValid && 'border-red-600')}
          />
        </>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
      >
        <X size={16} />
      </button>
    </div>
  )
}
