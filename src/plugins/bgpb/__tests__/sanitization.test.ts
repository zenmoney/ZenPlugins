import fetchMock from 'fetch-mock'
import type { FetchOptions, FetchResponse } from '../../../common/network'

let mockRequestHeaders: Record<string, string> = {}
let mockResponseLogMask: unknown

jest.mock('../../../common/network', () => {
  const network: typeof import('../../../common/network') = jest.requireActual('../../../common/network')
  return {
    ...network,
    // Model generic HTTP authentication headers before the real network logger runs.
    fetch: async (url: string, options: FetchOptions = {}): Promise<FetchResponse> => {
      mockResponseLogMask = options.sanitizeResponseLog
      return await network.fetch(url, {
        ...options,
        headers: { ...options.headers, ...mockRequestHeaders }
      })
    }
  }
})

const { fetchFullTransactions, loginDeviceToken }: {
  fetchFullTransactions: (sid: string, account: { title: string, transactionsAccId: string }, fromDate: Date, toDate: Date,
    getDeviceAuthorization: () => Promise<{ deviceNo: string, otp: string }>) => Promise<unknown[]>
  loginDeviceToken: (deviceNo: string, otp: string) => Promise<string>
} = jest.requireActual('../api')

const url = 'https://mobapp-frontend.bgpb.by/sou2/xml_online.admin'

// Unchanged success XML from api.test.js: device-token login and fetchFullTransactions.
const loginResponse = '<BS_Response><Login SID="device-secret-sid"/></BS_Response>'
const statementResponse = '<BS_Response><ExecuteAction><MailId>mail-1</MailId></ExecuteAction></BS_Response>'
const attachmentResponse = '<BS_Response><MailAttachment><Attachment><Body>statement</Body></Attachment></MailAttachment></BS_Response>'

const requestSecrets = ['Bearer model-request-authorization', 'session=model-request-cookie', 'session=model-request-set-cookie']
const responseSecrets = ['Bearer model-response-authorization', 'session=model-response-cookie', 'session=model-response-set-cookie']
const headerCases = [
  { name: 'standard', names: ['Authorization', 'Cookie', 'Set-Cookie'] },
  { name: 'lowercase', names: ['authorization', 'cookie', 'set-cookie'] },
  { name: 'mixed case', names: ['aUtHoRiZaTiOn', 'cOoKiE', 'sEt-CoOkIe'] }
]

afterEach(() => {
  fetchMock.restore()
  jest.restoreAllMocks()
  mockRequestHeaders = {}
  mockResponseLogMask = undefined
})

describe('BGPB HTTP log sanitization [model]', () => {
  // Authentication headers must be masked independently of bank payloads while diagnostics remain visible.
  it.each(headerCases)('masks $name headers and statement authorization while retaining diagnostics', async ({ names }) => {
    mockRequestHeaders = {
      ...Object.fromEntries(names.map((name, index) => [name, requestSecrets[index]])),
      'X-Request-ID': 'model-request-id'
    }
    const headers = {
      ...Object.fromEntries(names.map((name, index) => [name, responseSecrets[index]])),
      'X-Correlation-ID': 'model-response-correlation-id'
    }
    fetchMock.post(url, (_url, options) => ({
      body: String(options.body).includes('<ExecuteAction ') ? statementResponse : attachmentResponse,
      headers
    }))
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})

    await expect(fetchFullTransactions('statement-secret-sid', {
      title: 'Deposit', transactionsAccId: 'statement-action'
    }, new Date('2026-05-01T00:00:00+0300'), new Date('2026-05-21T00:00:00+0300'), async () => ({
      deviceNo: '123456', otp: '654321'
    }))).resolves.toEqual([{ BS_Response: { MailAttachment: { Attachment: { Body: 'statement' } } } }])

    const output = JSON.stringify(debug.mock.calls)
    for (const secret of [...requestSecrets, ...responseSecrets, 'statement-secret-sid', '654321']) {
      expect(output).not.toContain(secret)
    }
    expect(debug.mock.calls.map(call => call[0])).toEqual(['request', 'response', 'request', 'response'])
    const [request, response] = debug.mock.calls.map(call => call[1] as { id: string, url: string })
    expect(request.id).toMatch(/^\d+$/)
    expect(response.id).toBe(request.id)
    expect(request.url).toBe(url)
    expect(response.url).toBe(url)
    for (const diagnostic of ['model-request-id', 'model-response-correlation-id', '<ExecuteAction Id=',
      'statement-action', '<RequestType>ExecuteAction</RequestType>', '<MailId>mail-1</MailId>', '<Body>statement</Body>']) {
      expect(output).toContain(diagnostic)
    }
  })

  it('retains header masks when a login endpoint masks its complete request body', async () => {
    mockRequestHeaders = { Authorization: requestSecrets[0], Cookie: requestSecrets[1] }
    fetchMock.postOnce(url, { body: loginResponse, headers: { 'Set-Cookie': responseSecrets[2], 'X-Request-ID': 'model-login-request-id' } })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})

    await expect(loginDeviceToken('123456', '654321')).resolves.toBe('device-secret-sid')

    const output = JSON.stringify(debug.mock.calls)
    for (const secret of [requestSecrets[0], requestSecrets[1], responseSecrets[2], 'device-secret-sid', '654321']) {
      expect(output).not.toContain(secret)
    }
    expect(debug.mock.calls[0][1].body).toMatch(/^<string\[\d+\]>$/)
    expect(output).toContain('model-login-request-id')
    expect(output).toContain('<Login SID=')
    expect(output).toContain(url)
  })

  it('selectively masks contact Hint attributes independently of attribute order [model]', async () => {
    // Acquire the plugin mask with an unchanged success sample, then test generic XML text only.
    // The model text goes through the real logger and is never interpreted as a bank response.
    fetchMock.postOnce(url, { body: loginResponse })
    await expect(loginDeviceToken('123456', '654321')).resolves.toBe('device-secret-sid')
    expect(mockResponseLogMask).toBeDefined()
    const { fetch }: Pick<typeof import('../../../common/network'), 'fetch'> = jest.requireActual('../../../common/network')
    const modelUrl = 'https://example.test/model-hints'
    const modelText = `<Model>
<Parameter Id="PhoneInfo" Name="Phone" Hint="model-phone-hint" Value="phone-option" Diagnostic="phone-meta"/>
<Parameter Hint="model-email-hint" Name="Email" Id="EmailInfo" Value="email-option" Diagnostic="email-meta"/>
<Parameter Hint="model-phone-hint" Value="phone-option" Id="PhoneInfo" Name="Phone"/>
<Parameter Id="EmailInfo" Hint="model-email-hint" Name="Email" Value="email-option"/>
<Parameter Id="BankMetadata" Name="Bank" Hint="harmless-metadata" Value="diagnostic-value"/>
</Model>`
    const expectedText = `<Model>
<Parameter Id="PhoneInfo" Name="Phone" Hint="<string[16]>" Value="phone-option" Diagnostic="phone-meta"/>
<Parameter Hint="<string[16]>" Name="Email" Id="EmailInfo" Value="email-option" Diagnostic="email-meta"/>
<Parameter Hint="<string[16]>" Value="phone-option" Id="PhoneInfo" Name="Phone"/>
<Parameter Id="EmailInfo" Hint="<string[16]>" Name="Email" Value="email-option"/>
<Parameter Id="BankMetadata" Name="Bank" Hint="harmless-metadata" Value="diagnostic-value"/>
</Model>`
    fetchMock.postOnce(modelUrl, { body: modelText })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})

    const response = await fetch(modelUrl, {
      method: 'POST',
      body: modelText,
      sanitizeRequestLog: mockResponseLogMask,
      sanitizeResponseLog: mockResponseLogMask
    })

    expect(response.body).toBe(modelText)
    expect(debug.mock.calls.map(call => [call[0], call[1].body])).toEqual([
      ['request', expectedText],
      ['response', expectedText]
    ])
    expect(debug.mock.calls.map(call => call[1].url)).toEqual([modelUrl, modelUrl])
  })
})
