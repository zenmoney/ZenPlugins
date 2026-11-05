import fetchMock from 'fetch-mock'
import { TemporaryError, ZPAPIError } from '../../../errors'

interface DeviceAuthorization { deviceNo: string, otp: string }
type AuthorizationProvider = (options?: { afterOtp: string }) => Promise<DeviceAuthorization>
const { fetchFullTransactions }: {
  fetchFullTransactions: (sid: string, account: { title: string, transactionsAccId: string }, fromDate: Date, toDate: Date,
    getDeviceAuthorization?: AuthorizationProvider | null) => Promise<unknown[]>
} = jest.requireActual('../api')

const url = 'https://mobapp-frontend.bgpb.by/sou2/xml_online.admin'
const sid = 'statement-secret-sid'
const account = { title: 'Deposit', transactionsAccId: 'statement-action' }
// SOU formats date-only bounds with local calendar getters; keep model inputs calendar-based too.
const fromDate = new Date(2026, 4, 1)
const toDate = new Date(2026, 4, 21)
const authorization = { deviceNo: '123456', otp: '654321' }
const nextAuthorization = { deviceNo: '123456', otp: '654322' }

// Complete unchanged samples from api.test.js: fetchFullTransactions success and observed error cases.
const statementResponse = '<BS_Response><ExecuteAction><MailId>mail-1</MailId></ExecuteAction></BS_Response>'
const attachmentResponse = '<BS_Response><MailAttachment><Attachment><Body>statement</Body></Attachment></MailAttachment></BS_Response>'
const passwordRejection = '<BS_Response><Error Count="1" Class="2"><ErrorLine Idx="1">Ошибка проверки пароля</ErrorLine></Error></BS_Response>'
const unknownRejection = '<BS_Response><Error Count="1" Class="2"><ErrorLine Idx="1">Ошибка авторизации</ErrorLine></Error></BS_Response>'
const expectedMails = [{ BS_Response: { MailAttachment: { Attachment: { Body: 'statement' } } } }]

function deferred (): { promise: Promise<void>, resolve: () => void } {
  let resolvePromise = (): void => {}
  const promise = new Promise<void>(resolve => { resolvePromise = resolve })
  return { promise, resolve: resolvePromise }
}

async function load (provider?: AuthorizationProvider | null): Promise<unknown[]> {
  return await fetchFullTransactions(sid, account, fromDate, toDate, provider)
}

afterEach(() => {
  fetchMock.restore()
})

describe('protected statement authorization [model]', () => {
  // The model verifies scheduling, bounded recovery, and error propagation, not bank OTP replay policy.
  it('serializes generation and ExecuteAction requests in FIFO order for one provider', async () => {
    const generationStarted = deferred()
    const generationGate = deferred()
    const requestStarted = deferred()
    const requestGate = deferred()
    let generated = 0
    const provider = jest.fn(async () => {
      generated++
      const otp = String(100000 + generated)
      if (generated === 1) {
        generationStarted.resolve()
        await generationGate.promise
      }
      return { deviceNo: authorization.deviceNo, otp }
    })
    let active = 0
    let maximumActive = 0
    const requestOtps: string[] = []
    fetchMock.post(url, async (_url, options) => {
      const body = String(options.body)
      if (!body.includes('<ExecuteAction ')) return attachmentResponse
      active++
      maximumActive = Math.max(maximumActive, active)
      requestOtps.push(body.match(/<Parameter Id="Password">([^<]+)<\/Parameter>/)?.[1] ?? '')
      if (requestOtps.length === 1) {
        requestStarted.resolve()
        await requestGate.promise
      }
      active--
      return statementResponse
    })

    const results = [load(provider), load(provider), load(provider)]
    await generationStarted.promise
    const generatedBeforeRelease = provider.mock.calls.length
    generationGate.resolve()
    await requestStarted.promise
    const generatedDuringRequest = provider.mock.calls.length
    requestGate.resolve()

    await expect(Promise.all(results)).resolves.toEqual([expectedMails, expectedMails, expectedMails])
    expect(generatedBeforeRelease).toBe(1)
    expect(generatedDuringRequest).toBe(1)
    expect(maximumActive).toBe(1)
    expect(requestOtps).toEqual(['100001', '100002', '100003'])
  })

  it('retries the same statement once with a later code after the exact known rejection', async () => {
    const provider = jest.fn().mockResolvedValueOnce(authorization).mockResolvedValueOnce(nextAuthorization)
    const statements: string[] = []
    fetchMock.post(url, (_url, options) => {
      const body = String(options.body)
      if (!body.includes('<ExecuteAction ')) return attachmentResponse
      statements.push(body)
      return statements.length === 1 ? passwordRejection : statementResponse
    })

    await expect(load(provider)).resolves.toEqual(expectedMails)

    expect(provider.mock.calls).toEqual([[], [{ afterOtp: authorization.otp }]])
    expect(statements).toHaveLength(2)
    for (const body of statements) {
      expect(body).toContain(`SID="${sid}"`)
      expect(body).toContain('<ExecuteAction Id="statement-action" Button="OK">')
      expect(body).toContain('<Parameter Id="DeviceNo">123456</Parameter>')
      expect(body).toContain('<Parameter Id="DateFrom">1.05.2026</Parameter>')
      expect(body).toContain('<Parameter Id="DateTill">21.05.2026</Parameter>')
    }
    expect(statements[0]).toContain('<Parameter Id="Password">654321</Parameter>')
    expect(statements[1]).toContain('<Parameter Id="Password">654322</Parameter>')
  })

  it('stops after the second exact rejection as an ordinary error', async () => {
    const provider = jest.fn().mockResolvedValueOnce(authorization).mockResolvedValueOnce(nextAuthorization)
    fetchMock.post(url, { body: passwordRejection })

    const result = load(provider)

    await expect(result).rejects.toBeInstanceOf(Error)
    await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
    await expect(result).rejects.toMatchObject({ message: 'BGPB rejected device-token authorization' })
    expect(provider.mock.calls).toEqual([[], [{ afterOtp: authorization.otp }]])
    expect(fetchMock.calls(url)).toHaveLength(2)
  })

  it('keeps later requests queued while awaiting and using the replacement code', async () => {
    const replacementStarted = deferred()
    const replacementGate = deferred()
    const retryStarted = deferred()
    const retryGate = deferred()
    const provider = jest.fn(async (options?: { afterOtp: string }) => {
      if (options !== undefined) {
        replacementStarted.resolve()
        await replacementGate.promise
        return nextAuthorization
      }
      return authorization
    })
    let statements = 0
    fetchMock.post(url, async (_url, options) => {
      if (!String(options.body).includes('<ExecuteAction ')) return attachmentResponse
      statements++
      if (statements === 1) return passwordRejection
      if (statements === 2) {
        retryStarted.resolve()
        await retryGate.promise
      }
      return statementResponse
    })

    const results = [load(provider), load(provider)]
    await replacementStarted.promise
    const generatedDuringReplacement = provider.mock.calls.length
    replacementGate.resolve()
    await retryStarted.promise
    const generatedDuringRetry = provider.mock.calls.length
    retryGate.resolve()

    await expect(Promise.all(results)).resolves.toEqual([expectedMails, expectedMails])
    expect(generatedDuringReplacement).toBe(2)
    expect(generatedDuringRetry).toBe(2)
    expect(provider.mock.calls).toEqual([[], [{ afterOtp: authorization.otp }], []])
    expect(statements).toBe(3)
  })

  it('rejects a provider returning the same code before sending a second statement', async () => {
    const provider = jest.fn().mockResolvedValue(authorization)
    fetchMock.post(url, { body: passwordRejection })

    const result = load(provider)

    await expect(result).rejects.toBeInstanceOf(Error)
    await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
    await expect(result).rejects.toMatchObject({ message: 'BGPB statement retry requires a different device authorization code' })
    expect(provider.mock.calls).toEqual([[], [{ afterOtp: authorization.otp }]])
    expect(fetchMock.calls(url)).toHaveLength(1)
  })

  it.each([
    ['ordinary', new Error('Model statement transport failure')],
    ['temporary', new TemporaryError('Модель временного отказа транспорта')]
  ] as const)('preserves a %s transport error without retry', async (_kind, failure) => {
    const provider = jest.fn().mockResolvedValue(authorization)
    fetchMock.post(url, { throws: failure })

    await expect(load(provider)).rejects.toBe(failure)
    expect(provider.mock.calls).toEqual([[]])
    expect(fetchMock.calls(url)).toHaveLength(1)
  })

  it('preserves a transport failure on the single retry without another attempt', async () => {
    const failure = new Error('Model retry transport failure')
    const provider = jest.fn().mockResolvedValueOnce(authorization).mockResolvedValueOnce(nextAuthorization)
    let requests = 0
    fetchMock.post(url, () => ++requests === 1 ? passwordRejection : { throws: failure })

    await expect(load(provider)).rejects.toBe(failure)
    expect(provider.mock.calls).toEqual([[], [{ afterOtp: authorization.otp }]])
    expect(fetchMock.calls(url)).toHaveLength(2)
  })

  it('keeps an unknown bank authorization error ordinary without retry', async () => {
    const provider = jest.fn().mockResolvedValue(authorization)
    fetchMock.post(url, { body: unknownRejection })

    const result = load(provider)

    await expect(result).rejects.toBeInstanceOf(Error)
    await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
    await expect(result).rejects.toMatchObject({ message: 'Unexpected BGPB device-token authorization error' })
    expect(provider.mock.calls).toEqual([[]])
    expect(fetchMock.calls(url)).toHaveLength(1)
  })

  it('propagates an exact rejection without retry when there is no provider', async () => {
    fetchMock.post(url, { body: passwordRejection })

    const result = load(null)

    await expect(result).rejects.toBeInstanceOf(Error)
    await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
    await expect(result).rejects.toMatchObject({ message: 'BGPB rejected device-token authorization' })
    expect(fetchMock.calls(url)).toHaveLength(1)
  })

  it('never retries an attachment authorization rejection', async () => {
    const provider = jest.fn().mockResolvedValue(authorization)
    fetchMock.post(url, (_url, options) => String(options.body).includes('<ExecuteAction ') ? statementResponse : passwordRejection)

    const result = load(provider)

    await expect(result).rejects.toBeInstanceOf(Error)
    await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
    await expect(result).rejects.toMatchObject({ message: 'BGPB rejected device-token authorization' })
    expect(provider.mock.calls).toEqual([[]])
    expect(fetchMock.calls(url)).toHaveLength(2)
  })

  it('releases the provider queue after a request failure', async () => {
    const failure = new Error('Model first statement transport failure')
    const provider = jest.fn().mockResolvedValue(authorization)
    let statements = 0
    fetchMock.post(url, (_url, options) => {
      if (!String(options.body).includes('<ExecuteAction ')) return attachmentResponse
      return ++statements === 1 ? { throws: failure } : statementResponse
    })

    await expect(Promise.allSettled([load(provider), load(provider)])).resolves.toEqual([
      { status: 'rejected', reason: failure },
      { status: 'fulfilled', value: expectedMails }
    ])
    expect(provider.mock.calls).toEqual([[], []])
  })

  it('releases the provider queue after authorization generation fails', async () => {
    const failure = new Error('Model authorization generation failure')
    const provider = jest.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce(authorization)
    fetchMock.post(url, (_url, options) => String(options.body).includes('<ExecuteAction ') ? statementResponse : attachmentResponse)

    await expect(Promise.allSettled([load(provider), load(provider)])).resolves.toEqual([
      { status: 'rejected', reason: failure },
      { status: 'fulfilled', value: expectedMails }
    ])
    expect(provider.mock.calls).toEqual([[], []])
  })

  it('preserves replacement-generation failure and releases the next queued statement', async () => {
    const failure = new Error('Model replacement authorization generation failure')
    const provider = jest.fn().mockResolvedValueOnce(authorization).mockRejectedValueOnce(failure).mockResolvedValueOnce(authorization)
    let statements = 0
    fetchMock.post(url, (_url, options) => {
      if (!String(options.body).includes('<ExecuteAction ')) return attachmentResponse
      return ++statements === 1 ? passwordRejection : statementResponse
    })

    await expect(Promise.allSettled([load(provider), load(provider)])).resolves.toEqual([
      { status: 'rejected', reason: failure },
      { status: 'fulfilled', value: expectedMails }
    ])
    expect(provider.mock.calls).toEqual([[], [{ afterOtp: authorization.otp }], []])
    expect(statements).toBe(2)
  })
})
