import settingsSchema from '@shared/schemas/settings-schema.json'
import mcpSchema from '@shared/schemas/mcp-schema.json'

export class SchemaService {
  getSettingsSchema(): unknown {
    return settingsSchema
  }

  getMcpSchema(): unknown {
    return mcpSchema
  }
}
