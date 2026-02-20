import { useEditorStore } from '@/stores/editor-store'
import type { SectionId } from '@/constants/sections'
import { GeneralSection } from './GeneralSection'
import { PermissionsSection } from './PermissionsSection'
import { HooksSection } from './HooksSection'
import { EnvironmentSection } from './EnvironmentSection'
import { SandboxSection } from './SandboxSection'
import { AdvancedSection } from './AdvancedSection'
import { McpSection } from './McpSection'

const SECTION_COMPONENTS: Record<SectionId, React.FC> = {
  general: GeneralSection,
  permissions: PermissionsSection,
  hooks: HooksSection,
  environment: EnvironmentSection,
  sandbox: SandboxSection,
  advanced: AdvancedSection
}

export function FormView(): React.JSX.Element {
  const activeFile = useEditorStore((s) => s.activeFile)
  const activeSection = useEditorStore((s) => s.activeSection)

  if (activeFile === 'mcp') {
    return (
      <div className="h-full overflow-y-auto px-6 py-5">
        <McpSection />
      </div>
    )
  }

  const ActiveComponent = SECTION_COMPONENTS[activeSection]

  return (
    <div className="h-full overflow-y-auto px-6 py-5">
      <ActiveComponent />
    </div>
  )
}
