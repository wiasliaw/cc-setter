import { ipcMain } from 'electron'
import { FileService } from './services/file-service'
import { SchemaService } from './services/schema-service'
import { VersionDetectService } from './services/version-service'

const fileService = new FileService()
const schemaService = new SchemaService()
const versionService = new VersionDetectService()

export function registerIpcHandlers(): void {
  ipcMain.handle('file:read', (_event, filePath: string) => {
    return fileService.read(filePath)
  })

  ipcMain.handle('file:write', (_event, filePath: string, content: string) => {
    return fileService.write(filePath, content)
  })

  ipcMain.handle('schema:get-settings', () => {
    return schemaService.getSettingsSchema()
  })

  ipcMain.handle('schema:get-mcp', () => {
    return schemaService.getMcpSchema()
  })

  ipcMain.handle('version:detect', () => {
    return versionService.detect()
  })
}
