import { modify, applyEdits, type FormattingOptions, type ModificationOptions } from 'jsonc-parser'

function detectIndent(content: string): string {
  const match = content.match(/^[\t ]+/m)
  return match ? match[0] : '  '
}

function buildOptions(content: string): ModificationOptions {
  const indent = detectIndent(content)
  const formattingOptions: FormattingOptions = {
    tabSize: indent === '\t' ? 1 : indent.length,
    insertSpaces: indent !== '\t',
    eol: ''
  }
  return { formattingOptions }
}

export function updateJsonField(
  raw: string,
  jsonPath: (string | number)[],
  value: unknown
): string {
  const edits = modify(raw, jsonPath, value, buildOptions(raw))
  return applyEdits(raw, edits)
}

export function removeJsonField(
  raw: string,
  jsonPath: (string | number)[]
): string {
  const edits = modify(raw, jsonPath, undefined, buildOptions(raw))
  return applyEdits(raw, edits)
}
