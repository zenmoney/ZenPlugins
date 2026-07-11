import { sanitize } from '../../../../common/sanitize'

/**
 * The other redaction test only asserts that the sanitize OPTIONS are passed.
 * That is a proxy: if the mask shape were wrong, credentials would still be
 * logged and that test would happily pass. This one runs the REAL sanitizer over
 * a real payload and proves the secrets actually disappear.
 */
describe('credential redaction actually redacts (real sanitizer)', () => {
  const requestMask = { headers: { Cookie: true }, body: { email: true, code: true } }
  const responseMask = { headers: { 'set-cookie': true }, body: { accessToken: true, refreshToken: true } }

  it('scrubs the OTP code and the email from a logged verify-code request', () => {
    const logged = sanitize({
      url: 'https://global.jup.ag/api/proxy/auth/email/verify-code',
      method: 'POST',
      headers: { Cookie: 'access_token=SECRET', 'User-Agent': 'Mozilla/5.0' },
      body: { email: 'victim@example.com', code: '123456', type: 'LOGIN' }
    }, requestMask)

    const dump = JSON.stringify(logged)
    expect(dump).not.toContain('victim@example.com')
    expect(dump).not.toContain('123456')
    expect(dump).not.toContain('SECRET')
    // non-secrets must survive, or the logs become useless for debugging
    expect(dump).toContain('LOGIN')
    expect(dump).toContain('verify-code')
  })

  it('scrubs the tokens from a logged verify-code response', () => {
    const logged = sanitize({
      status: 200,
      headers: { 'set-cookie': ['access_token=SECRET_A', 'refresh_token=SECRET_R'] },
      body: { accessToken: 'SECRET_A', refreshToken: 'SECRET_R' }
    }, responseMask)

    const dump = JSON.stringify(logged)
    expect(dump).not.toContain('SECRET_A')
    expect(dump).not.toContain('SECRET_R')
    expect(dump).toContain('200')
  })
})
