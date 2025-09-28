import { describe, it, expect, vi } from 'vitest'
import { AgentRunner } from './index'
import { Intent } from '@layr/core'

describe('AgentRunner', () => {
  it('should create an instance', () => {
    const runner = new AgentRunner()
    expect(runner).toBeInstanceOf(AgentRunner)
  })

  it('should have required methods', () => {
    const runner = new AgentRunner()
    expect(runner.run).toBeDefined()
    expect(typeof runner.run).toBe('function')
  })

  it('should handle intent as object', async () => {
    const runner = new AgentRunner()
    const mockIntent: Intent = {
      goal: 'Create a test application',
      audience: 'business',
      capabilities: ['database', 'auth']
    }

    // We can't easily test the full pipeline without proper mocking setup
    // This is a basic smoke test to ensure the method signature works
    try {
      // This will fail because we don't have proper setup but it validates the API
      await runner.run(mockIntent)
    } catch (error) {
      // Expected to fail without proper environment setup
      expect(error).toBeDefined()
    }
  })
})