import { join } from 'path'
import { homedir } from 'os'

export const USER_CLAUDE_DIR = join(homedir(), '.claude')
export const USER_SETTINGS_PATH = join(USER_CLAUDE_DIR, 'settings.json')
export const USER_MCP_PATH = join(homedir(), '.mcp.json')
export const BACKUP_DIR = join(USER_CLAUDE_DIR, 'backups')
export const MAX_BACKUPS = 5
