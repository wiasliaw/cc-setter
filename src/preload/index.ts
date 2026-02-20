import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  fileRead: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  fileWrite: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  getSettingsSchema: () => ipcRenderer.invoke('schema:get-settings'),
  getMcpSchema: () => ipcRenderer.invoke('schema:get-mcp'),
  detectVersion: () => ipcRenderer.invoke('version:detect'),
  setDirtyState: (isDirty: boolean) => ipcRenderer.send('dirty-state', isDirty),
  getFilePaths: () => ipcRenderer.invoke('paths:get')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose APIs:', error)
  }
} else {
  // @ts-expect-error nodeIntegration enabled in dev
  window.electron = electronAPI
  // @ts-expect-error nodeIntegration enabled in dev
  window.api = api
}
