import { X509Certificate } from 'crypto'
import { trustYooMoneyCertificates } from '../certs'

describe('trustYooMoneyCertificates', () => {
  it('trusts the GlobalSign root used by YooMoney', () => {
    global.ZenMoney = { trustCertificates: jest.fn() }

    trustYooMoneyCertificates()

    expect(global.ZenMoney.trustCertificates).toHaveBeenCalledTimes(1)
    const [certificates] = global.ZenMoney.trustCertificates.mock.calls[0]
    expect(certificates).toHaveLength(1)
    expect(new X509Certificate(certificates[0]).subject).toContain('GlobalSign')
  })
})
