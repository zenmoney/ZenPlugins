import { readFileSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { Buffer } from 'buffer'
import { deviceCddc, loginPage, pushPage, authorizationCode } from '../authPage'

// Full bank HTML and fingerprint come from the authorized HTTP login on 2026-10-07.
describe('MyAmeria captured authorization pages', () => {
  it('reads the dynamic login action without evaluating bank JavaScript', () => {
    const html = readFileSync(join(__dirname, 'fixtures/auth/login.html'), 'utf8')
    expect(loginPage(html)).toEqual({ action: expect.stringContaining('/login-actions/authenticate?session_code=fixture-session_code'), error: '' })
  })

  it('reads the application confirmation identity and form action', () => {
    const html = readFileSync(join(__dirname, 'fixtures/auth/push.html'), 'utf8')
    expect(pushPage(html)).toEqual({ action: expect.stringContaining('/login-actions/authenticate?session_code=fixture-session_code'), evaluatedRequestId: 'fixture-evaluated-request', sessionId: 'fixture-push-session' })
  })

  it('generates the captured CDDC structure and SHA-256 hash exactly', () => {
    const fingerprint = readFileSync(join(__dirname, 'fixtures/auth/fingerprint.json'), 'utf8')
    const expected = Buffer.from(JSON.stringify({ browserCDDC: { fingerprintRaw: fingerprint, fingerprintHash: createHash('sha256').update(fingerprint).digest('hex') } }), 'latin1').toString('base64')
    expect(deviceCddc()).toBe(expected)
  })
})

// Model OAuth redirect integrity independently of bank rejection formats.
describe('[model] MyAmeria redirect integrity', () => {
  it('rejects a callback with a different state', () => {
    expect(() => authorizationCode('https://myameria.am/#code=secret&state=other', 'expected')).toThrow()
  })

  it('rejects a callback to a different host', () => {
    expect(() => authorizationCode('https://example.com/#code=secret&state=expected', 'expected')).toThrow()
  })
})
