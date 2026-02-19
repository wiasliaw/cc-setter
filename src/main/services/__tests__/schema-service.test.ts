import { describe, it, expect } from 'vitest'
import { SchemaService } from '../schema-service'

const svc = new SchemaService()

describe('SchemaService', () => {
  it('returns settings schema with draft-07', () => {
    const schema = svc.getSettingsSchema() as Record<string, unknown>
    expect(schema['$schema']).toBe('http://json-schema.org/draft-07/schema#')
    expect(schema['type']).toBe('object')
    expect(schema['properties']).toBeDefined()
  })

  it('settings schema has expected top-level properties', () => {
    const schema = svc.getSettingsSchema() as Record<string, unknown>
    const props = schema['properties'] as Record<string, unknown>
    expect(props['permissions']).toBeDefined()
    expect(props['hooks']).toBeDefined()
    expect(props['env']).toBeDefined()
    expect(props['model']).toBeDefined()
    expect(props['effortLevel']).toBeDefined()
  })

  it('returns MCP schema with correct structure', () => {
    const schema = svc.getMcpSchema() as Record<string, unknown>
    expect(schema['$schema']).toBe('http://json-schema.org/draft-07/schema#')
    const props = schema['properties'] as Record<string, unknown>
    expect(props['mcpServers']).toBeDefined()
  })
})
