import { describe, it, expect } from 'vitest'
import { program } from './index'

describe('CLI', () => {
  it('should have required commands', () => {
    const commands = program.commands.map((cmd: any) => cmd.name())
    expect(commands).toContain('create')
    expect(commands).toContain('validate')
    expect(commands).toContain('deploy')
  })

  it('should have correct program name', () => {
    expect(program.name()).toBe('layr')
  })

  it('should have description', () => {
    const description = program.description()
    expect(description).toBeTruthy()
    expect(description).toContain('Natural language')
  })
})