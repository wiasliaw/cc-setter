import { useRef, useCallback } from 'react'
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useEditorStore, type FileTarget } from '@/stores/editor-store'

const FILE_URI_MAP: Record<FileTarget, string> = {
  settings: 'settings.json',
  mcp: 'mcp.json'
}

export function MonacoWrapper(): React.JSX.Element {
  const raw = useEditorStore((s) => s.raw)
  const activeFile = useEditorStore((s) => s.activeFile)
  const updateRaw = useEditorStore((s) => s.updateRaw)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
    editor.focus()
  }, [])

  const handleChange: OnChange = useCallback(
    (value) => {
      if (value !== undefined) {
        updateRaw(value)
      }
    },
    [updateRaw]
  )

  return (
    <Editor
      height="100%"
      language="json"
      theme="vs-dark"
      path={FILE_URI_MAP[activeFile]}
      value={raw}
      onMount={handleMount}
      onChange={handleChange}
      options={{
        tabSize: 2,
        minimap: { enabled: false },
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        fontSize: 13,
        lineNumbers: 'on',
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
        automaticLayout: true,
        padding: { top: 12, bottom: 12 }
      }}
    />
  )
}
