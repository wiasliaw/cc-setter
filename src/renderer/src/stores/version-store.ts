import { create } from 'zustand'
import type { VersionInfo } from '@shared/types'

interface VersionState extends VersionInfo {
  isLoading: boolean
  detect: () => Promise<void>
}

export const useVersionStore = create<VersionState>((set) => ({
  version: null,
  installPath: null,
  detected: false,
  isLoading: true,

  detect: async () => {
    set({ isLoading: true })
    const info = await window.api.detectVersion()
    set({ ...info, isLoading: false })
  }
}))
