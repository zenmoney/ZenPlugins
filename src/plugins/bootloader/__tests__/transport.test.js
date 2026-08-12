import { BootloaderTransport } from '../transport'

function jsonResponse (body, status = 200) {
  return {
    status,
    text: () => Promise.resolve(JSON.stringify(body))
  }
}

describe('BootloaderTransport', () => {
  it('uses an explicit IP and sends queued events', async () => {
    const fetchImplementation = jest.fn((url) => {
      if (url.endsWith('/health')) {
        return Promise.resolve(jsonResponse({ name: 'zenmoney-bootloader', protocolVersion: 2 }))
      }
      if (url.endsWith('/sessions')) {
        return Promise.resolve(jsonResponse({ sessionId: 'session-1' }, 201))
      }
      return Promise.resolve(jsonResponse({ accepted: 1, lastSequence: 1 }))
    })
    const transport = new BootloaderTransport(fetchImplementation)
    const connection = await transport.connect('192.168.1.2')
    expect(connection).toMatchObject({ serverUrl: 'http://192.168.1.2:5050' })
    await transport.createSession({ application: { platform: 'test' } })
    transport.enqueue('console', { args: ['hello'] })
    await transport.flush()

    expect(fetchImplementation).toHaveBeenCalledWith(
      'http://192.168.1.2:5050/api/v2/sessions/session-1/events',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('rejects URLs in the IP-only preference', async () => {
    const transport = new BootloaderTransport(jest.fn())
    await expect(transport.connect('http://192.168.1.2')).rejects.toThrow('only an IP address')
    await expect(transport.connect('localhost')).rejects.toThrow('only an IP address')
    await expect(transport.connect(':')).rejects.toThrow('only an IP address')
  })

  it('requires a server IP without trying fallbacks', async () => {
    const fetchImplementation = jest.fn()
    const transport = new BootloaderTransport(fetchImplementation)

    await expect(transport.connect()).rejects.toThrow('server IP is required')
    expect(fetchImplementation).not.toHaveBeenCalled()
  })
})
