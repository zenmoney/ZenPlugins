// [model] Diagnostic metadata is not an authentication credential or authority.
const { normalizeDirectAuthLifecycle } = jest.requireActual<{
  normalizeDirectAuthLifecycle: (value: unknown) => unknown
}>('../api')

describe('[model] direct authentication lifecycle metadata', () => {
  beforeEach(() => { jest.spyOn(console, 'warn').mockImplementation(() => {}) })
  afterEach(() => { jest.restoreAllMocks() })

  it.each([
    { version: 1, kind: 'verified', reason: null, httpStatus: null, updatedAt: 1000 },
    { version: 1, kind: 'rejected', reason: 'step-up-otp', httpStatus: 401, updatedAt: 1000 },
    { version: 1, kind: 'rejected', reason: 'login-redirect', httpStatus: 302, updatedAt: 1000 }
  ])('keeps only the defined diagnostic fields: $kind/$reason', value => {
    expect(normalizeDirectAuthLifecycle({ ...value, password: 'CANARY_PRIVATE_METADATA' })).toEqual(value)
    expect(console.warn).not.toHaveBeenCalled()
  })

  it.each([
    null, undefined, false, '', [], {},
    { version: 2, kind: 'verified', reason: null, httpStatus: null, updatedAt: 1000 },
    { version: 1, kind: 'verified', reason: null, httpStatus: null, updatedAt: Infinity },
    { version: 1, kind: 'verified', reason: null, httpStatus: null, updatedAt: -1 },
    { version: 1, kind: 'rejected', reason: 'CANARY_PRIVATE_METADATA', httpStatus: 401, updatedAt: 1000 },
    { version: 1, kind: 'rejected', reason: 'step-up-otp', httpStatus: 500, updatedAt: 1000 }
  ])('ignores absent, unknown or malformed metadata without exposing it: %#', value => {
    expect(normalizeDirectAuthLifecycle(value)).toBeNull()
    expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('CANARY_PRIVATE_METADATA')
  })
})
