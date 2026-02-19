import { create } from 'zustand'
import type { FileReadResult, WriteResult } from '@shared/types'

export type FileTarget = 'settings' | 'mcp'

interface EditorState {
  activeFile: FileTarget
  raw: string
  parsed: unknown
  filePath: string
  isDirty: boolean
  isLoading: boolean
  lastSavedAt: number | null
  error: string | null

  setActiveFile: (target: FileTarget) => void
  loadFile: (target: FileTarget) => Promise<void>
  updateRaw: (content: string) => void
  save: () => Promise<WriteResult>
  markClean: () => void
}

const FILE_PATHS: Record<FileTarget, string> = {
  settings: '',
  mcp: ''
}

async function resolveFilePaths(): Promise<void> {
  const homeDir =
    typeof process !== 'undefined' && process.env['HOME']
      ? process.env['HOME']
      : '/Users/unknown'
  FILE_PATHS.settings = `${homeDir}/.claude/settings.json`
  FILE_PATHS.mcp = `${homeDir}/.mcp.json`
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeFile: 'settings',
  raw: '',
  parsed: {},
  filePath: '',
  isDirty: false,
  isLoading: false,
  lastSavedAt: null,
  error: null,

  setActiveFile: (target: FileTarget) => {
    const state = get()
    if (state.activeFile === target) return
    set({ activeFile: target })
    state.loadFile(target)
  },

  loadFile: async (target: FileTarget) => {
    set({ isLoading: true, error: null })

    await resolveFilePaths()
    const filePath = FILE_PATHS[target]

    const result: FileReadResult = await window.api.fileRead(filePath)

    if (result.success) {
      set({
        raw: result.content,
        parsed: result.parsed,
        filePath: result.filePath,
        isDirty: false,
        isLoading: false,
        error: null
      })
    } else {
      set({
        raw: target === 'settings' ? '{}' : '{"mcpServers": {}}',
        parsed: target === 'settings' ? {} : { mcpServers: {} },
        filePath,
        isDirty: false,
        isLoading: false,
        error: result.error ?? null
      })
    }
  },

  updateRaw: (content: string) => {
    set({ raw: content, isDirty: true })
  },

  save: async () => {
    const { filePath, raw } = get()
    const result = await window.api.fileWrite(filePath, raw)
    if (result.success) {
      set({ isDirty: false, lastSavedAt: Date.now() })
    }
    return result
  },

  markClean: () => {
    set({ isDirty: false })
  }
}))
