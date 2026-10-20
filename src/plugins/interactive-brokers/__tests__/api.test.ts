import fetchMock from 'fetch-mock'
import { requestFlexXML } from '../api'
import { InvalidPreferencesError, ZPAPIError } from '../../../errors'
import { getString } from '../../../types/get'

// mail_inbound 159728, build 16. Both full response bodies; public-safe identity
// replacements and a dummy retrieval reference preserve the recorded formats.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fixture = require('../__fixtures__/csv-report-159728.json') as { sendRequest: string, statement: string }
const url = 'https://gdcdyn.interactivebrokers.com/Universal/servlet/FlexStatementService'
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('explains the recorded CSV query setting and protects request/response logs', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  fetchMock.post(`${url}.SendRequest`, { body: fixture.sendRequest, headers: { 'set-cookie': 'JSESSIONID=fixture-cookie' } })
    .post(`${url}.GetStatement`, fixture.statement)
  const error: unknown = await requestFlexXML('fixture-flex-token', '1671304').catch((error: unknown) => error)
  expect(error).toBeInstanceOf(InvalidPreferencesError)
  expect((error as Error).message).toContain('XML')
  const logs = JSON.stringify(debug.mock.calls)
  expect(logs).not.toContain('fixture-flex-token')
  expect(logs).not.toContain('fixture-cookie')
  expect(logs).not.toContain('fixture-reference')
  expect(logs).not.toContain('John Example')
  expect(logs).toContain('Ending Balance')
  expect(logs).toContain('283')
  expect(logs).toContain('CurrencyPrimary')
  const request = debug.mock.calls.find(([event]) => event === 'request')?.[1]
  expect(getString(request, 'body')).toContain('q=1671304')
})

it('[model] leaves an unexpected transport error reportable', async () => {
  // A failed request has no report to interpret and must propagate unchanged.
  const failure = new Error('transport failed')
  fetchMock.post(`${url}.SendRequest`, { throws: failure })
  const error: unknown = await requestFlexXML('fixture-token', '1671304').catch((error: unknown) => error)
  expect(error).toBe(failure)
  expect(error).not.toBeInstanceOf(ZPAPIError)
})
