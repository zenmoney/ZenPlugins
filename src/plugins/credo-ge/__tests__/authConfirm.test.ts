import fetchMock from 'fetch-mock'
import { authConfirm } from '../fetchApi'
import { ZPAPIError } from '../../../errors'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const invalidInput = require('./fixtures/auth-confirm-156591.json') as Record<string, unknown> & { errorCode: string }
// eslint-disable-next-line @typescript-eslint/no-var-requires
const emptyResult = require('./fixtures/auth-confirm-156813.json') as Record<string, unknown> & { errorCode: string }

// Full bank envelopes from mail_inbound 156591/156813, build 56.
// Error classification: these failures do not establish wrong credentials or OTP.
describe('Credo authentication confirmation', () => {
  afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

  it.each([invalidInput, emptyResult])('preserves a reportable rejection instead of returning null data', async body => {
    fetchMock.post('https://mobileapp.mycredo.ge/api/Auth/confirm', { status: 200, body })
    let failure: unknown
    try { await authConfirm('model-otp', 'model-operation') } catch (error) { failure = error }
    expect(failure).toBeInstanceOf(Error)
    expect(failure).not.toBeInstanceOf(ZPAPIError)
    expect((failure as Error).message).toContain(body.errorCode)
  })

  it('masks OTP in actual network diagnostics [model]', async () => {
    // The sentinel models a credential; the response retains the real rejected envelope.
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    fetchMock.post('https://mobileapp.mycredo.ge/api/Auth/confirm', { status: 200, body: emptyResult })
    await authConfirm('secret-otp-sentinel', 'model-operation').catch(() => {})
    const emitted = JSON.stringify(debug.mock.calls)
    expect(emitted).not.toContain('secret-otp-sentinel')
    expect(emitted).toContain('model-operation')
    expect(emitted).toContain('RESULT_EMPTY')
  })

  it('propagates the original transport failure [model]', async () => {
    const error = new Error('model transport failure')
    fetchMock.post('https://mobileapp.mycredo.ge/api/Auth/confirm', { throws: error })
    await expect(authConfirm('model-otp', 'model-operation')).rejects.toBe(error)
  })
})
