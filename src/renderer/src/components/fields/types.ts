import type { DeprecatedFieldInfo } from '@shared/deprecated-fields'

export interface FieldConfig {
  key: string
  label: string
  description: string
  type: 'boolean' | 'string' | 'number' | 'enum' | 'taglist'
  enumValues?: string[]
  defaultValue?: unknown
  placeholder?: string
  min?: number
  deprecated?: DeprecatedFieldInfo
}

export interface FieldProps {
  label: string
  description: string
  value: unknown
  onChange: (value: unknown) => void
  placeholder?: string
  enumValues?: string[]
  min?: number
}
