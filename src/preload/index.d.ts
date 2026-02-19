import type { ElectronAPI } from '@electron-toolkit/preload'
import type { FileReadResult, WriteResult, VersionInfo } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fileRead: (filePath: string) => Promise<FileReadResult>
      fileWrite: (filePath: string, content: string) => Promise<WriteResult>
      getSettingsSchema: () => Promise<unknown>
      getMcpSchema: () => Promise<unknown>
      detectVersion: () => Promise<VersionInfo>
      setDirtyState: (isDirty: boolean) => void
    }
  }
}
