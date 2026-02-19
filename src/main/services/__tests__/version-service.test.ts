import { describe, it, expect } from 'vitest'
import { VersionDetectService } from '../version-service'

describe('VersionDetectService', () => {
  it('returns a VersionInfo object', async () => {
    const svc = new VersionDetectService()
    const result = await svc.detect()

    expect(result).toHaveProperty('version')
    expect(result).toHaveProperty('detected')
    expect(typeof result.detected).toBe('boolean')

    if (result.detected) {
      expect(result.version).toMatch(/^\d+\.\d+\.\d+$/)
    } else {
      expect(result.version).toBeNull()
    }
  })
})
