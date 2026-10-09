import { addTrustedCertificates } from './tls'
import { IncompatibleVersionError } from '../../errors'

// [model] Public TLS registration preserves the active host's behavior and failures.
describe('[model] trusted certificate registration', () => {
  const originalZenMoney = global.ZenMoney

  afterEach(() => { global.ZenMoney = originalZenMoney })

  it('uses the active host and preserves its receiver', async () => {
    const certs = Object.freeze(['model-ca'])
    const host = {
      trustCertificates: jest.fn(function (this: unknown, certificates: string[]): void {
        expect(this).toBe(host)
        expect(certificates).toEqual(certs)
      })
    }
    global.ZenMoney = host as unknown as typeof ZenMoney
    await addTrustedCertificates(certs)
    expect(host.trustCertificates).toHaveBeenCalledTimes(1)
    const next = jest.fn()
    global.ZenMoney = { trustCertificates: next } as unknown as typeof ZenMoney
    await addTrustedCertificates(certs)
    expect(next).toHaveBeenCalledWith(certs)
  })

  it('checks support at use and propagates host failures', async () => {
    Reflect.deleteProperty(global, 'ZenMoney')
    expect(() => jest.requireActual('./tls')).not.toThrow()
    await expect(addTrustedCertificates(['model-ca'])).rejects.toBeInstanceOf(IncompatibleVersionError)
    const error = new Error('Model certificate failure')
    global.ZenMoney = { trustCertificates: () => { throw error } } as unknown as typeof ZenMoney
    await expect(addTrustedCertificates(['model-ca'])).rejects.toBe(error)
    Reflect.set(global.ZenMoney, 'trustCertificates', async () => { throw error })
    await expect(addTrustedCertificates(['model-ca'])).rejects.toBe(error)
  })

  it.each([false, true])('accumulates CA directly on native fetch hosts with legacy method present: %p', async legacyMethodPresent => {
    const legacy = jest.fn(() => { throw new Error('Native fetch must not use the legacy delegate') })
    global.ZenMoney = {
      fetch: jest.fn(),
      ...(legacyMethodPresent ? { trustCertificates: legacy } : {})
    } as unknown as typeof ZenMoney
    jest.resetModules()
    const tls = jest.requireActual<typeof import('./tls')>('./tls')
    await tls.addTrustedCertificates(Object.freeze(['model-first-ca']))
    const firstRequest = tls.withDefaultTls()
    await tls.addTrustedCertificates(['model-second-ca'])
    expect(firstRequest).toEqual({ tls: { ca: ['model-first-ca'], pfx: [] } })
    expect(tls.withDefaultTls()).toEqual({ tls: { ca: ['model-first-ca', 'model-second-ca'], pfx: [] } })
    expect(tls.withWebViewTls({})).toEqual({ tls: { ca: ['model-first-ca', 'model-second-ca'] } })
    expect(legacy).not.toHaveBeenCalled()
  })
})
