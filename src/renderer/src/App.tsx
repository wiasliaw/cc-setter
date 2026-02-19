import { useEffect, useRef, useCallback, useMemo } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomBar } from '@/components/layout/BottomBar'
import { MonacoWrapper } from '@/components/json/MonacoWrapper'
import { ToastContainer } from '@/components/layout/ToastContainer'
import { useEditorStore } from '@/stores/editor-store'
import { useVersionStore } from '@/stores/version-store'
import { useValidationStore } from '@/stores/validation-store'
import { configureJsonDefaults } from '@/services/monaco-setup'
import { initValidation, validateContent } from '@/services/validation-engine'
import { useSave } from '@/hooks/useSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function App(): React.JSX.Element {
  const loadFile = useEditorStore((s) => s.loadFile)
  const isLoading = useEditorStore((s) => s.isLoading)
  const activeFile = useEditorStore((s) => s.activeFile)
  const raw = useEditorStore((s) => s.raw)
  const isDirty = useEditorStore((s) => s.isDirty)
  const detectVersion = useVersionStore((s) => s.detect)
  const setErrors = useValidationStore((s) => s.setErrors)
  const schemasLoaded = useRef(false)
  const handleSave = useSave()

  useKeyboardShortcuts(
    useMemo(() => ({ save: handleSave }), [handleSave])
  )

  useEffect(() => {
    window.api.setDirtyState(isDirty)
  }, [isDirty])

  useEffect(() => {
    async function init(): Promise<void> {
      detectVersion()

      if (!schemasLoaded.current) {
        const [settingsSchema, mcpSchema] = await Promise.all([
          window.api.getSettingsSchema(),
          window.api.getMcpSchema()
        ])
        configureJsonDefaults(settingsSchema, mcpSchema)
        initValidation(settingsSchema, mcpSchema)
        schemasLoaded.current = true
      }

      loadFile('settings')
    }
    init()
  }, [detectVersion, loadFile])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runValidation = useCallback(
    (content: string, fileType: 'settings' | 'mcp') => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const errors = validateContent(content, fileType)
        setErrors(errors)
      }, 300)
    },
    [setErrors]
  )

  useEffect(() => {
    if (!schemasLoaded.current) return
    runValidation(raw, activeFile)
  }, [raw, activeFile, runValidation])

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />

      <main className="flex flex-1 flex-col">
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-500">Loading...</p>
            </div>
          ) : (
            <MonacoWrapper />
          )}
        </div>

        <BottomBar />
      </main>

      <ToastContainer />
    </div>
  )
}

export default App
