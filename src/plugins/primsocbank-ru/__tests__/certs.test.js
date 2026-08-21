import { X509Certificate } from 'crypto'
import { trustPrimsocbankCertificates } from '../certs'

describe('trustPrimsocbankCertificates', () => {
  it('trusts the Russian root CA used by Primsocbank', () => {
    global.ZenMoney = { trustCertificates: jest.fn() }

    trustPrimsocbankCertificates()

    expect(global.ZenMoney.trustCertificates).toHaveBeenCalledTimes(1)
    const [certificates] = global.ZenMoney.trustCertificates.mock.calls[0]
    expect(certificates).toHaveLength(1)

    const certificate = new X509Certificate(certificates[0])
    expect(certificate.subject).toContain('CN=Russian Trusted Root CA')
    expect(certificate.issuer).toBe(certificate.subject)
    expect(certificate.fingerprint256).toBe('D2:6D:2D:02:31:B7:C3:9F:92:CC:73:85:12:BA:54:10:35:19:E4:40:5D:68:B5:BD:70:3E:97:88:CA:8E:CF:31')
  })
})
