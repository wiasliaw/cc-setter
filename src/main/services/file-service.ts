import { readFile, writeFile, rename, mkdir, stat, readdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename } from 'path'
import { parse as parseJsonc, ParseError } from 'jsonc-parser'
import type { FileReadResult, WriteResult } from '@shared/types'
import { BACKUP_DIR, MAX_BACKUPS } from '@shared/constants'

export class FileService {
  async read(filePath: string): Promise<FileReadResult> {
    try {
      const stats = await stat(filePath)
      const content = await readFile(filePath, 'utf-8')

      if (content.trim() === '') {
        return {
          success: true,
          content,
          parsed: {},
          filePath,
          lastModified: stats.mtimeMs
        }
      }

      const errors: ParseError[] = []
      const parsed = parseJsonc(content, errors, {
        allowTrailingComma: true,
        disallowComments: false
      })

      if (errors.length > 0) {
        return {
          success: false,
          content,
          parsed: null,
          filePath,
          lastModified: stats.mtimeMs,
          error: `JSONC parse errors: ${errors.map((e) => `offset ${e.offset}: ${e.error}`).join(', ')}`
        }
      }

      return {
        success: true,
        content,
        parsed: parsed ?? {},
        filePath,
        lastModified: stats.mtimeMs
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        content: '',
        parsed: null,
        filePath,
        lastModified: 0,
        error: message
      }
    }
  }

  async write(filePath: string, content: string): Promise<WriteResult> {
    try {
      if (existsSync(filePath)) {
        const backupPath = await this.backup(filePath)
        const tmpPath = filePath + '.tmp'
        await writeFile(tmpPath, content, 'utf-8')
        await rename(tmpPath, filePath)
        return { success: true, backupPath }
      }

      const dir = join(filePath, '..')
      await mkdir(dir, { recursive: true })
      await writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { success: false, error: message }
    }
  }

  private async backup(filePath: string): Promise<string> {
    await mkdir(BACKUP_DIR, { recursive: true })

    const name = basename(filePath)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupName = `${name}.${timestamp}.bak`
    const backupPath = join(BACKUP_DIR, backupName)

    const original = await readFile(filePath, 'utf-8')
    await writeFile(backupPath, original, 'utf-8')

    await this.pruneBackups(name)

    return backupPath
  }

  private async pruneBackups(originalName: string): Promise<void> {
    const entries = await readdir(BACKUP_DIR)
    const matching = entries
      .filter((e) => e.startsWith(originalName + '.') && e.endsWith('.bak'))
      .sort()

    if (matching.length <= MAX_BACKUPS) return

    const toDelete = matching.slice(0, matching.length - MAX_BACKUPS)
    await Promise.all(toDelete.map((f) => unlink(join(BACKUP_DIR, f))))
  }
}
