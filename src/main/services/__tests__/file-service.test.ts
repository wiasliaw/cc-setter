import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, readFile, readdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { FileService } from '../file-service'

let tmpDir: string
let svc: FileService

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'cc-setter-test-'))
  svc = new FileService()
})

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

describe('FileService.read', () => {
  it('reads valid JSON', async () => {
    const filePath = join(tmpDir, 'valid.json')
    await writeFile(filePath, '{"foo": "bar"}')

    const result = await svc.read(filePath)
    expect(result.success).toBe(true)
    expect(result.parsed).toEqual({ foo: 'bar' })
    expect(result.content).toBe('{"foo": "bar"}')
  })

  it('reads JSONC with trailing commas', async () => {
    const filePath = join(tmpDir, 'trailing.json')
    await writeFile(filePath, '{"a": 1, "b": 2,}')

    const result = await svc.read(filePath)
    expect(result.success).toBe(true)
    expect(result.parsed).toEqual({ a: 1, b: 2 })
  })

  it('reads JSONC with comments', async () => {
    const filePath = join(tmpDir, 'comments.json')
    await writeFile(filePath, '// line comment\n{"a": 1 /* inline */}')

    const result = await svc.read(filePath)
    expect(result.success).toBe(true)
    expect(result.parsed).toEqual({ a: 1 })
  })

  it('reads empty file as empty object', async () => {
    const filePath = join(tmpDir, 'empty.json')
    await writeFile(filePath, '')

    const result = await svc.read(filePath)
    expect(result.success).toBe(true)
    expect(result.parsed).toEqual({})
  })

  it('returns error for non-existent file', async () => {
    const result = await svc.read(join(tmpDir, 'nope.json'))
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

describe('FileService.write', () => {
  it('creates new file with parent directories', async () => {
    const filePath = join(tmpDir, 'sub', 'dir', 'new.json')
    const result = await svc.write(filePath, '{"new": true}')

    expect(result.success).toBe(true)
    const content = await readFile(filePath, 'utf-8')
    expect(content).toBe('{"new": true}')
  })

  it('creates backup before overwriting', async () => {
    const filePath = join(tmpDir, 'existing.json')
    await writeFile(filePath, '{"version": 1}')

    const backupDir = join(tmpDir, '.claude', 'backups')
    const origConstants = await import('@shared/constants')
    const origBackupDir = origConstants.BACKUP_DIR

    Object.defineProperty(origConstants, 'BACKUP_DIR', { value: backupDir, writable: true })

    try {
      const result = await svc.write(filePath, '{"version": 2}')
      expect(result.success).toBe(true)
      expect(result.backupPath).toBeDefined()

      const written = await readFile(filePath, 'utf-8')
      expect(written).toBe('{"version": 2}')

      const backups = await readdir(backupDir)
      expect(backups.length).toBe(1)
      expect(backups[0]).toMatch(/existing\.json\..+\.bak/)

      const backupContent = await readFile(join(backupDir, backups[0]), 'utf-8')
      expect(backupContent).toBe('{"version": 1}')
    } finally {
      Object.defineProperty(origConstants, 'BACKUP_DIR', { value: origBackupDir, writable: true })
    }
  })
})

describe('FileService backup pruning', () => {
  it('keeps only MAX_BACKUPS most recent', async () => {
    const filePath = join(tmpDir, 'prune.json')
    const backupDir = join(tmpDir, '.claude', 'backups')
    const origConstants = await import('@shared/constants')
    const origBackupDir = origConstants.BACKUP_DIR

    Object.defineProperty(origConstants, 'BACKUP_DIR', { value: backupDir, writable: true })

    try {
      for (let i = 0; i < 7; i++) {
        await writeFile(filePath, `{"i": ${i}}`)
        await svc.write(filePath, `{"i": ${i + 1}}`)
        await new Promise((r) => setTimeout(r, 10))
      }

      const backups = await readdir(backupDir)
      const matching = backups.filter((b) => b.startsWith('prune.json.'))
      expect(matching.length).toBeLessThanOrEqual(5)
    } finally {
      Object.defineProperty(origConstants, 'BACKUP_DIR', { value: origBackupDir, writable: true })
    }
  })
})
