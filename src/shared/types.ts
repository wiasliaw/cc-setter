export interface FileReadResult {
  success: boolean
  content: string
  parsed: unknown
  filePath: string
  lastModified: number
  error?: string
}

export interface WriteResult {
  success: boolean
  backupPath?: string
  error?: string
}

export interface VersionInfo {
  version: string | null
  installPath: string | null
  detected: boolean
}

export type IpcChannel =
  | 'file:read'
  | 'file:write'
  | 'schema:get-settings'
  | 'schema:get-mcp'
  | 'version:detect'
