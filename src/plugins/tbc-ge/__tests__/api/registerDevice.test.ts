// Regression tests for TBC-GE registerDevice cookie fix.
// Without session cookies, TBC returns 401 with empty body → JSON.parse fails → null → crash.

import { fetchRegisterDeviceV2 } from '../../fetchApi'

const AUTH = { deviceName: 'TestPhone', passcode: '12345', deviceId: 'device-001' }

const originalFetch = global.fetch

let capturedRequests: Array<{ url: string, init?: RequestInit }> = []

beforeEach(() => {
  capturedRequests = []
  ;(global as { ZenMoney?: unknown }).ZenMoney = { features: {} }
})

afterEach(() => {
  global.fetch = originalFetch
  ;(global as { ZenMoney?: unknown }).ZenMoney = undefined
})

describe('fetchRegisterDeviceV2 — Cookie header', () => {
  it('sends cookies as Cookie header when provided', async () => {
    const cookies = ['JSESSIONID=abc123', 'token=xyz789']
    global.fetch = async (url, init?) => {
      capturedRequests.push({ url: String(url), init })
      return new Response(JSON.stringify({ success: true, registrationId: 'reg-42' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }

    const result = await fetchRegisterDeviceV2(AUTH, cookies)

    expect(capturedRequests).toHaveLength(1)
    const headers = capturedRequests[0]?.init?.headers as Record<string, string>
    expect(headers.Cookie).toBe('JSESSIONID=abc123; token=xyz789')
    expect(result).toBe('reg-42')
  })

  it('omits Cookie header when cookies array is empty', async () => {
    global.fetch = async (url, init?) => {
      capturedRequests.push({ url: String(url), init })
      return new Response(JSON.stringify({ success: true, registrationId: 'reg-00' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }

    await fetchRegisterDeviceV2(AUTH, [])

    const headers = capturedRequests[0]?.init?.headers as Record<string, string>
    expect(headers.Cookie).toBeUndefined()
  })

  it('throws "response is null" on 401 with empty body — the original bug', async () => {
    // Root cause: TBC returns 401 + empty body when Cookie header is missing.
    // JSON.parse('') throws → network.js catches → returns null → fetchRegisterDeviceV2 throws.
    global.fetch = async () => new Response('', { status: 401 })

    await expect(fetchRegisterDeviceV2(AUTH, [])).rejects.toThrow('response is null')
  })

  it('sends POST to the correct TBC endpoint', async () => {
    global.fetch = async (url, init?) => {
      capturedRequests.push({ url: String(url), init })
      return new Response(JSON.stringify({ success: true, registrationId: 'r' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      })
    }

    await fetchRegisterDeviceV2(AUTH, ['s=1'])

    expect(capturedRequests[0]?.url).toBe('https://rmbgwauth.tbconline.ge/v1/auth/registerDevice')
    expect(capturedRequests[0]?.init?.method).toBe('POST')
  })
})
