import { exec } from 'child_process'
import type { VersionInfo } from '@shared/types'

function execPromise(command: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = exec(command, { timeout: timeoutMs }, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
    child.unref()
  })
}

function parseVersion(stdout: string): string | null {
  const match = stdout.match(/v?(\d+\.\d+\.\d+)/)
  return match ? match[1] : null
}

export class VersionDetectService {
  async detect(): Promise<VersionInfo> {
    try {
      const stdout = await execPromise('claude --version', 3000)
      const version = parseVersion(stdout)
      if (version) {
        return { version, installPath: null, detected: true }
      }
    } catch {}

    try {
      const stdout = await execPromise('npm list -g @anthropic-ai/claude-code --json', 5000)
      const data = JSON.parse(stdout)
      const version =
        data?.dependencies?.['@anthropic-ai/claude-code']?.version ??
        data?.dependencies?.['claude-code']?.version ??
        null
      if (version) {
        return { version, installPath: null, detected: true }
      }
    } catch {}

    return { version: null, installPath: null, detected: false }
  }
}
