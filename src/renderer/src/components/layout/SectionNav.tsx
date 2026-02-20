import { useValidationStore } from '@/stores/validation-store'
import { SECTIONS, getErrorCountsBySection, type SectionId } from '@/constants/sections'
import { cn } from '@/lib/utils'

interface SectionNavProps {
  activeSection: SectionId
  onSectionChange: (id: SectionId) => void
}

export function SectionNav({ activeSection, onSectionChange }: SectionNavProps): React.JSX.Element {
  const errors = useValidationStore((s) => s.errors)
  const counts = getErrorCountsBySection(errors)

  return (
    <div>
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionChange(section.id)}
          className={cn(
            'mb-0.5 flex w-full items-center rounded px-3 py-1.5 text-left text-xs transition-colors',
            activeSection === section.id
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
          )}
        >
          {section.label}
          {counts[section.id] > 0 && (
            <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-900 px-1 text-[10px] text-red-300">
              {counts[section.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
