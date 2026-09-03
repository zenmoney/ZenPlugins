import { getDeviceToken } from '../api'
import { TemporaryUnavailableError } from '../../../errors'

function makeResponse (body, headers = {}) {
  const entries = Object.entries(headers)
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://superapp.sensebank.com.ua/mob/device/token',
    headers: {
      forEach: callback => entries.forEach(([key, value]) => callback(value, key)),
      entries: () => entries[Symbol.iterator](),
      get: key => headers[key.toLowerCase()] || null,
      has: key => Object.prototype.hasOwnProperty.call(headers, key.toLowerCase()),
      keys: () => entries.map(([key]) => key)[Symbol.iterator](),
      values: () => entries.map(([, value]) => value)[Symbol.iterator]()
    },
    text: jest.fn().mockResolvedValue(body)
  }
}

describe('Sense device token safety', () => {
  let debugSpy
  let warnSpy

  beforeEach(() => {
    global.ZenMoney = { device: { manufacturer: 'Google', model: 'Pixel' } }
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    debugSpy.mockRestore()
    warnSpy.mockRestore()
    delete global.fetch
    delete global.ZenMoney
  })

  it('masks WAF cookies and HTML bodies before they reach logs', async () => {
    const wafCookie = 'incap_ses_360_2935954=private-cookie-value'
    const wafHtml = '<html><body>This page cannot be displayed</body></html>'
    global.fetch = jest.fn().mockResolvedValue(makeResponse(wafHtml, { 'set-cookie': wafCookie }))

    await expect(getDeviceToken({ device: { fingerPrint: 'private-fingerprint' } }))
      .rejects.toBeInstanceOf(TemporaryUnavailableError)

    const log = JSON.stringify([...debugSpy.mock.calls, ...warnSpy.mock.calls])
    expect(log).not.toContain(wafCookie)
    expect(log).not.toContain(wafHtml)
    expect(log).not.toContain('private-fingerprint')
  })
})
