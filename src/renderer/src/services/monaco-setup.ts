import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'

loader.config({ monaco })

export function configureJsonDefaults(
  settingsSchema: unknown,
  mcpSchema: unknown
): void {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    trailingCommas: 'ignore',
    schemas: [
      {
        uri: 'https://cc-setter/settings-schema.json',
        fileMatch: ['settings.json'],
        schema: settingsSchema as Record<string, unknown>
      },
      {
        uri: 'https://cc-setter/mcp-schema.json',
        fileMatch: ['mcp.json'],
        schema: mcpSchema as Record<string, unknown>
      }
    ]
  })
}
