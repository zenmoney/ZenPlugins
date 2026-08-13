import { Debug } from '../../../common/debug'

describe('Debug proxy', () => {
  const originalBootloader = global.bootloader

  afterEach(() => {
    global.bootloader = originalBootloader
  })

  it('is a safe no-op outside Bootloader', async () => {
    global.bootloader = undefined

    expect(Debug.isActive).toBe(false)
    expect(Debug.sessionId).toBeUndefined()
    await expect(Debug.checkpoint('accounts', [{ id: 'account' }])).resolves.toBeUndefined()
  })

  it('forwards calls and metadata to the active Bootloader environment', async () => {
    const checkpoint = jest.fn().mockResolvedValue()
    global.bootloader = {
      isActive: true,
      version: '2',
      sessionId: 'session-1',
      plugin: { id: 'example', version: '1', build: 1 },
      server: { url: 'http://192.168.1.2:5050' },
      config: { captureConsole: true },
      checkpoint
    }

    expect(Debug.isActive).toBe(true)
    expect(Debug.sessionId).toBe('session-1')
    expect(Debug.plugin).toEqual({ id: 'example', version: '1', build: 1 })
    await expect(Debug.checkpoint('accounts', [{ id: 'account' }])).resolves.toBeUndefined()
    expect(checkpoint).toHaveBeenCalledWith('accounts', [{ id: 'account' }])
  })
})
