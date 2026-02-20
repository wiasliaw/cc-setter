import type { ValidationError } from '@/stores/validation-store'

export type SectionId =
  | 'general'
  | 'permissions'
  | 'hooks'
  | 'environment'
  | 'sandbox'
  | 'advanced'

export interface SectionDef {
  id: SectionId
  label: string
  description: string
  claimedKeys: string[]
}

export const SECTIONS: SectionDef[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Language, model, effort, and display preferences',
    claimedKeys: [
      'language',
      'model',
      'availableModels',
      'effortLevel',
      'outputStyle',
      'autoUpdatesChannel',
      'cleanupPeriodDays',
      'forceLoginMethod',
      'respectGitignore',
      'alwaysThinkingEnabled',
      'spinnerTipsEnabled',
      'showTurnDuration',
      'prefersReducedMotion',
      'includeCoAuthoredBy'
    ]
  },
  {
    id: 'permissions',
    label: 'Permissions',
    description: 'Tool usage permissions and access rules',
    claimedKeys: ['permissions', 'allowManagedPermissionRulesOnly']
  },
  {
    id: 'hooks',
    label: 'Hooks',
    description: 'Custom commands for tool lifecycle events',
    claimedKeys: ['hooks', 'disableAllHooks', 'allowManagedHooksOnly']
  },
  {
    id: 'environment',
    label: 'Environment',
    description: 'Environment variables for Claude Code sessions',
    claimedKeys: ['env']
  },
  {
    id: 'sandbox',
    label: 'Sandbox',
    description: 'Sandboxed execution and network rules',
    claimedKeys: ['sandbox']
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Additional settings, plugins, and system configuration',
    claimedKeys: []
  }
]

export const ALL_CLAIMED_KEYS: Set<string> = new Set(
  SECTIONS.flatMap((s) => s.claimedKeys)
)

export const TOOL_NAMES = [
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

export const PERMISSION_MODES = [
  'default',
  'acceptEdits',
  'plan',
  'delegate',
  'dontAsk',
  'bypassPermissions'
] as const

export const HOOK_EVENT_TYPES = [
  { key: 'PreToolUse', description: 'Hooks that run before tool calls' },
  { key: 'PostToolUse', description: 'Hooks that run after tool completion' },
  { key: 'PostToolUseFailure', description: 'Hooks that run after a tool fails' },
  { key: 'PermissionRequest', description: 'Hooks that run when a permission dialog appears' },
  { key: 'Notification', description: 'Hooks that trigger on notifications' },
  { key: 'UserPromptSubmit', description: 'Hooks that run when a user submits a prompt' },
  { key: 'Stop', description: 'Hooks that run when agents finish responding' },
  { key: 'SubagentStart', description: 'Hooks that run when a subagent is spawned' },
  { key: 'SubagentStop', description: 'Hooks that run when subagents finish responding' },
  { key: 'PreCompact', description: 'Hooks that run before context is compacted' },
  { key: 'TeammateIdle', description: 'Hooks that run when a teammate is about to go idle' },
  { key: 'TaskCompleted', description: 'Hooks that run when a task is being marked as completed' },
  { key: 'Setup', description: 'Hooks that run during repository initialization or maintenance' },
  { key: 'SessionStart', description: 'Hooks that run when a new session starts' },
  { key: 'SessionEnd', description: 'Hooks that run when a session ends' }
] as const

// Matches schema $defs.permissionRule.pattern: ToolName(specifier)? | mcp__*
export const PERMISSION_RULE_PATTERN =
  /^((Bash|Edit|ExitPlanMode|Glob|Grep|KillShell|LS|LSP|MultiEdit|NotebookEdit|NotebookRead|Read|Skill|Task|TaskCreate|TaskGet|TaskList|TaskOutput|TaskStop|TaskUpdate|TodoWrite|ToolSearch|WebFetch|WebSearch|Write)(\((?=.*[^)*?])[^)]+\))?|mcp__.*)$/

export function getSectionForPath(errorPath: string): SectionId {
  if (!errorPath || errorPath === '/') return 'general'

  const normalized = errorPath.startsWith('/') ? errorPath.slice(1) : errorPath
  const topKey = normalized.split('/')[0]

  for (const section of SECTIONS) {
    if (section.claimedKeys.includes(topKey)) {
      return section.id
    }
  }
  return 'advanced'
}

export function getErrorCountsBySection(
  errors: ValidationError[]
): Record<SectionId, number> {
  const counts: Record<SectionId, number> = {
    general: 0,
    permissions: 0,
    hooks: 0,
    environment: 0,
    sandbox: 0,
    advanced: 0
  }

  for (const error of errors) {
    const section = getSectionForPath(error.path)
    counts[section]++
  }

  return counts
}
