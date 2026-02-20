import { ipcMain } from 'electron'
import { FileService } from './services/file-service'
import { SchemaService } from './services/schema-service'
import { VersionDetectService } from './services/version-service'
import { USER_SETTINGS_PATH, USER_MCP_PATH } from '@shared/constants'

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

  ipcMain.handle('schema:get-settings', (_event, version?: string) => {
    return schemaService.getSettingsSchema(version)
  })

  ipcMain.handle('schema:get-mcp', () => {
    return schemaService.getMcpSchema()
  })

  ipcMain.handle('schema:get-deprecated', (_event, version?: string) => {
    return schemaService.getDeprecatedFields(version)
  })

  ipcMain.handle('version:detect', () => {
    return versionService.detect()
  })

  ipcMain.handle('paths:get', () => {
    return { settings: USER_SETTINGS_PATH, mcp: USER_MCP_PATH }
  })
}
