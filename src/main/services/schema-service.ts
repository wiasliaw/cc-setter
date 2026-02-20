import settingsSchema from '@shared/schemas/settings-schema.json'
import mcpSchema from '@shared/schemas/mcp-schema.json'
import { getDeprecatedFields, type DeprecatedFieldInfo } from '@shared/deprecated-fields'

export class SchemaService {
  getSettingsSchema(_version?: string | null): unknown {
    return settingsSchema
  }

  getMcpSchema(): unknown {
    return mcpSchema
  }

  getDeprecatedFields(version?: string | null): DeprecatedFieldInfo[] {
    return getDeprecatedFields(version)
  }
}
