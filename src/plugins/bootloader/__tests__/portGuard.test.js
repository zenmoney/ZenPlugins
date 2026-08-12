const { ensureBootloaderPort } = require('../../../../scripts/bootloaderServer/portGuard')

describe('Bootloader port guard', () => {
  it('does nothing when port 5050 is free', async () => {
    const terminate = jest.fn()

    await expect(ensureBootloaderPort({
      inspect: jest.fn().mockResolvedValue(null),
      findPid: jest.fn(),
      terminate
    })).resolves.toEqual({ stopped: false })
    expect(terminate).not.toHaveBeenCalled()
  })

  it('stops a previous Bootloader process', async () => {
    const terminate = jest.fn().mockResolvedValue()

    await expect(ensureBootloaderPort({
      inspect: jest.fn().mockResolvedValue({
        name: 'zenmoney-bootloader',
        protocolVersion: 2,
        pid: 123
      }),
      findPid: jest.fn(),
      terminate
    })).resolves.toEqual({ stopped: true, pid: 123 })
    expect(terminate).toHaveBeenCalledWith(123)
  })

  it('refuses to stop an unrelated application', async () => {
    const terminate = jest.fn()

    await expect(ensureBootloaderPort({
      inspect: jest.fn().mockResolvedValue({ name: 'another-service' }),
      findPid: jest.fn(),
      terminate
    })).rejects.toThrow('used by another application')
    expect(terminate).not.toHaveBeenCalled()
  })
})
