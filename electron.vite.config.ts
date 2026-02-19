import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'

const monacoEditorPlugin = (
  (monacoEditorPluginModule as Record<string, unknown>).default ?? monacoEditorPluginModule
) as typeof monacoEditorPluginModule

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      monacoEditorPlugin({ languageWorkers: ['editorWorkerService', 'json'] })
    ]
  }
})
