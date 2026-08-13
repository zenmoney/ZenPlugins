import { installNetworkCapture } from '../captureNetwork'

describe('Bootloader network capture', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('captures raw request and response data', async () => {
    const response = {
      status: 200,
      statusText: 'OK',
      url: 'https://example.com/path?token=response-secret',
      headers: { forEach: visit => visit('private', 'set-cookie') },
      text: jest.fn().mockResolvedValue('{"password":"response-secret","value":1}')
    }
    global.fetch = jest.fn().mockResolvedValue(response)
    const events = []
    installNetworkCapture({
      transport: { enqueue: (type, payload) => events.push({ type, payload }) },
      config: { enabled: true, maxBodyBytes: 1024 }
    })

    const fetched = await global.fetch('https://example.com/path?token=request-secret', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' },
      body: '{"password":"request-secret","value":1}'
    })
    await fetched.text()

    expect(events[0]).toMatchObject({
      type: 'network:request',
      payload: {
        url: 'https://example.com/path?token=request-secret',
        headers: { Authorization: 'Bearer secret' }
      }
    })
    expect(events[0].payload.body).toContain('"password":"request-secret"')
    expect(events[1]).toMatchObject({
      type: 'network:response',
      payload: {
        url: 'https://example.com/path?token=response-secret',
        headers: { 'set-cookie': 'private' },
        status: 200
      }
    })
    expect(events[2].payload.body).toContain('"password":"response-secret"')
  })
})
