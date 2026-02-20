export interface DeprecatedFieldInfo {
  key: string
  since: string
  message: string
  replacement: string
}

const DEPRECATED_FIELDS: DeprecatedFieldInfo[] = [
  {
    key: 'includeCoAuthoredBy',
    since: '1.0.0',
    message: 'This field is deprecated.',
    replacement: 'attribution'
  }
]

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

export function getDeprecation(
  key: string,
  version?: string | null
): DeprecatedFieldInfo | undefined {
  const field = DEPRECATED_FIELDS.find((f) => f.key === key)
  if (!field) return undefined
  if (version && compareSemver(version, field.since) < 0) return undefined
  return field
}

export function getDeprecatedFields(version?: string | null): DeprecatedFieldInfo[] {
  if (!version) return DEPRECATED_FIELDS
  return DEPRECATED_FIELDS.filter((f) => compareSemver(version, f.since) >= 0)
}
