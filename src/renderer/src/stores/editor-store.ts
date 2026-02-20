import { create } from 'zustand'
import { parse as parseJsonc, type ParseError } from 'jsonc-parser'
import type { FileReadResult, WriteResult } from '@shared/types'
import { updateJsonField, removeJsonField } from '@/services/jsonc-edit'
import type { SectionId } from '@/constants/sections'

export type FileTarget = 'settings' | 'mcp'
export type ViewMode = 'form' | 'json'
export type SyncSource = 'form' | 'monaco' | null

interface EditorState {
  activeFile: FileTarget
  activeView: ViewMode
  activeSection: SectionId
  raw: string
  parsed: Record<string, unknown>
  filePath: string
  isDirty: boolean
  isLoading: boolean
  lastSavedAt: number | null
  error: string | null
  syncSource: SyncSource

  setActiveFile: (target: FileTarget) => void
  setActiveView: (view: ViewMode) => void
  setActiveSection: (section: SectionId) => void
  loadFile: (target: FileTarget) => Promise<void>
  updateRaw: (content: string) => void
  updateField: (jsonPath: (string | number)[], value: unknown) => void
  removeField: (jsonPath: (string | number)[]) => void
  save: () => Promise<WriteResult>
  discard: () => Promise<void>
  markClean: () => void
}

function tryParse(raw: string): Record<string, unknown> | null {
  if (!raw.trim()) return null
  const errors: ParseError[] = []
  const result = parseJsonc(raw, errors, {
    allowTrailingComma: true,
    disallowComments: false
  })
  if (errors.length > 0 || typeof result !== 'object' || result === null) {
    return null
  }
  return result as Record<string, unknown>
}

const FILE_PATHS: Record<FileTarget, string> = {
  settings: '',
  mcp: ''
}

let pathsResolved = false

async function resolveFilePaths(): Promise<void> {
  if (pathsResolved) return
  const paths = await window.api.getFilePaths()
  FILE_PATHS.settings = paths.settings
  FILE_PATHS.mcp = paths.mcp
  pathsResolved = true
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeFile: 'settings',
  activeView: 'form',
  activeSection: 'general',
  raw: '',
  parsed: {},
  filePath: '',
  isDirty: false,
  isLoading: false,
  lastSavedAt: null,
  error: null,
  syncSource: null,

  setActiveFile: (target: FileTarget) => {
    const state = get()
    if (state.activeFile === target) return
    set({ activeFile: target })
    state.loadFile(target)
  },

  setActiveView: (view: ViewMode) => {
    set({ activeView: view })
  },

  setActiveSection: (section: SectionId) => {
    set({ activeSection: section })
  },

  loadFile: async (target: FileTarget) => {
    set({ isLoading: true, error: null })

    await resolveFilePaths()
    const filePath = FILE_PATHS[target]

    const result: FileReadResult = await window.api.fileRead(filePath)

    if (result.success) {
      const parsed = tryParse(result.content) ?? (result.parsed as Record<string, unknown>) ?? {}
      set({
        raw: result.content,
        parsed,
        filePath: result.filePath,
        isDirty: false,
        isLoading: false,
        error: null,
        syncSource: null
      })
    } else {
      const fallback = target === 'settings' ? {} : { mcpServers: {} }
      set({
        raw: target === 'settings' ? '{}' : '{"mcpServers": {}}',
        parsed: fallback,
        filePath,
        isDirty: false,
        isLoading: false,
        error: result.error ?? null,
        syncSource: null
      })
    }
  },

  updateRaw: (content: string) => {
    const state = get()
    if (state.syncSource === 'form') {
      set({ syncSource: null })
      return
    }
    if (content === state.raw) return
    const newParsed = tryParse(content)
    set({
      raw: content,
      parsed: newParsed ?? state.parsed,
      isDirty: true,
      syncSource: 'monaco'
    })
  },

  updateField: (jsonPath: (string | number)[], value: unknown) => {
    const state = get()
    const newRaw = updateJsonField(state.raw, jsonPath, value)
    if (newRaw === state.raw) return
    const newParsed = tryParse(newRaw) ?? state.parsed
    set({
      raw: newRaw,
      parsed: newParsed,
      isDirty: true,
      syncSource: 'form'
    })
  },

  removeField: (jsonPath: (string | number)[]) => {
    const state = get()
    const newRaw = removeJsonField(state.raw, jsonPath)
    if (newRaw === state.raw) return
    const newParsed = tryParse(newRaw) ?? state.parsed
    set({
      raw: newRaw,
      parsed: newParsed,
      isDirty: true,
      syncSource: 'form'
    })
  },

  save: async () => {
    const { filePath, raw } = get()
    const result = await window.api.fileWrite(filePath, raw)
    if (result.success) {
      set({ isDirty: false, lastSavedAt: Date.now() })
    }
    return result
  },

  discard: async () => {
    const { activeFile, loadFile } = get()
    await loadFile(activeFile)
  },

  markClean: () => {
    set({ isDirty: false })
  }
}))
