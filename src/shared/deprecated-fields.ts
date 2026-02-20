export interface DeprecatedFieldInfo {
  key: string
  message: string
  replacement: string
}

export const DEPRECATED_FIELDS: DeprecatedFieldInfo[] = [
  {
    key: 'includeCoAuthoredBy',
    message: 'This field is deprecated.',
    replacement: 'attribution'
  }
]

export function getDeprecation(key: string): DeprecatedFieldInfo | undefined {
  return DEPRECATED_FIELDS.find((f) => f.key === key)
}
