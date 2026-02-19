import Ajv from 'ajv'
import { parse as parseJsonc, ParseError } from 'jsonc-parser'
import type { ValidationError } from '@/stores/validation-store'

let ajvSettings: Ajv | null = null
let ajvMcp: Ajv | null = null
let settingsValidate: ReturnType<Ajv['compile']> | null = null
let mcpValidate: ReturnType<Ajv['compile']> | null = null

export function initValidation(settingsSchema: unknown, mcpSchema: unknown): void {
  ajvSettings = new Ajv({ allErrors: true, verbose: true, strict: false })
  ajvMcp = new Ajv({ allErrors: true, verbose: true, strict: false })
  settingsValidate = ajvSettings.compile(settingsSchema as object)
  mcpValidate = ajvMcp.compile(mcpSchema as object)
}

export function validateContent(
  rawContent: string,
  fileType: 'settings' | 'mcp'
): ValidationError[] {
  if (rawContent.trim() === '') return []

  const parseErrors: ParseError[] = []
  const parsed = parseJsonc(rawContent, parseErrors, {
    allowTrailingComma: true,
    disallowComments: false
  })

  if (parseErrors.length > 0) {
    return parseErrors.map((e) => ({
      path: '',
      message: `Parse error at offset ${e.offset}: ${formatParseError(e.error)}`,
      severity: 'error' as const
    }))
  }

  const validate = fileType === 'settings' ? settingsValidate : mcpValidate
  if (!validate) return []

  const valid = validate(parsed)
  if (valid) return []

  return (validate.errors ?? []).map((err) => ({
    path: err.instancePath || '/',
    message: `${err.instancePath || '/'}: ${err.message ?? 'validation error'}`,
    severity: 'error' as const
  }))
}

function formatParseError(errorCode: number): string {
  const messages: Record<number, string> = {
    1: 'Invalid symbol',
    2: 'Invalid number format',
    3: 'Property name expected',
    4: 'Value expected',
    5: 'Colon expected',
    6: 'Comma expected',
    7: 'Closing brace expected',
    8: 'Closing bracket expected',
    9: 'End of file expected',
    10: 'Invalid comment token',
    11: 'Unexpected end of comment',
    12: 'Unexpected end of string',
    13: 'Unexpected end of number',
    14: 'Invalid unicode',
    15: 'Invalid escape character',
    16: 'Invalid character'
  }
  return messages[errorCode] ?? `Error code ${errorCode}`
}
