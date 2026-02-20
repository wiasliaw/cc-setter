import { useCallback } from 'react'
import type { FieldConfig } from './types'
import { BooleanField } from './BooleanField'
import { EnumField } from './EnumField'
import { StringField } from './StringField'
import { NumberField } from './NumberField'
import { TagListField } from './TagListField'

interface GenericFieldRendererProps {
  config: FieldConfig
  value: unknown
  onUpdate: (value: unknown) => void
  onRemove: () => void
}

export function GenericFieldRenderer({
  config,
  value,
  onUpdate,
  onRemove
}: GenericFieldRendererProps): React.JSX.Element {
  const handleChange = useCallback(
    (newValue: unknown) => {
      if (config.type === 'boolean') {
        onUpdate(newValue)
        return
      }
      if (newValue === undefined || newValue === null || newValue === '') {
        onRemove()
      } else if (Array.isArray(newValue) && newValue.length === 0) {
        onRemove()
      } else {
        onUpdate(newValue)
      }
    },
    [config.type, onUpdate, onRemove]
  )

  const fieldProps = {
    label: config.label,
    description: config.description,
    value,
    onChange: handleChange,
    placeholder: config.placeholder,
    enumValues: config.enumValues,
    min: config.min
  }

  return (
    <div className="relative">
      {config.deprecated && (
        <div className="mb-1 flex items-center gap-1.5">
          <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
            Deprecated
          </span>
          <span className="text-[11px] text-amber-500/80">
            {config.deprecated.message} Use &quot;{config.deprecated.replacement}&quot; instead.
          </span>
        </div>
      )}

      {config.type === 'boolean' && <BooleanField {...fieldProps} />}
      {config.type === 'enum' && <EnumField {...fieldProps} />}
      {config.type === 'string' && <StringField {...fieldProps} />}
      {config.type === 'number' && <NumberField {...fieldProps} />}
      {config.type === 'taglist' && <TagListField {...fieldProps} />}
    </div>
  )
}
