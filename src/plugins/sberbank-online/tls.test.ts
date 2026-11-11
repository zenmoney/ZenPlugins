import { X509Certificate } from 'crypto'
const { renewSession } = jest.requireActual<{
  renewSession: (session: { host: string, cookie: string }) => Promise<unknown>
}>('./api')

// [model] Bank transport receives the verified CA and preserves failures.
describe('[model] Sberbank TLS trust', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('passes the verified Russian root CA to the request without bypassing TLS', async () => {
    const failure = new Error('Model transport failure')
    const fetch = jest.fn().mockRejectedValue(failure)
    global.fetch = fetch
    await expect(renewSession({ host: 'online.sberbank.ru', cookie: 'model-cookie' })).rejects.toBe(failure)
    expect(fetch).toHaveBeenCalledTimes(5)
    const [url, options] = fetch.mock.calls[0] as [string, { tls?: { ca?: string[] } }]
    expect(url).toBe('https://online.sberbank.ru:4477/mobile9/private/renewSession.do')
    expect(options?.tls).toEqual({ ca: [expect.any(String)] })
    const ca = options?.tls?.ca
    expect(Array.isArray(ca)).toBe(true)
    const certificate = new X509Certificate((ca as string[])[0])
    expect(certificate.ca).toBe(true)
    expect(certificate.fingerprint256).toBe('D2:6D:2D:02:31:B7:C3:9F:92:CC:73:85:12:BA:54:10:35:19:E4:40:5D:68:B5:BD:70:3E:97:88:CA:8E:CF:31')
  })
})
