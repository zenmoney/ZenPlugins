import fetchMock from 'fetch-mock'
import { fetchApiDepositStatementsV2, fetchDepositDetailsV2 } from '../../fetchApi'
import { SessionV2 } from '../../models'
import { ZPAPIError } from '../../../../errors'

const session: SessionV2 = { cookies: [], auth: { username: 'test', passcode: null, deviceId: null, registrationId: 'test' } }

afterEach(() => { fetchMock.restore() })

it('rejects the observed deposit server error before converting it as deposit details', async () => {
  // mail_inbound 198688, build 109: relevant fields of the HTTP 500 response.
  // Transport validation needs no customer account data or server trace identifiers.
  fetchMock.getOnce('https://rmbgw.tbconline.ge/deposits/api/v1/deposits/1/details', {
    status: 500,
    body: { type: '/error-codes#SystemError', title: 'An error occurred while processing your request', status: 500, detail: 'An error occurred while processing request', code: 'SystemError' }
  })
  const error = await fetchDepositDetailsV2(1, session).catch(error => error)
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
  expect(error.message).toContain('Unexpected deposit details HTTP status')
})

it('[model] propagates a history transport failure instead of returning an empty statement', async () => {
  // An unknown transport failure must remain the original reportable error, never successful partial data.
  const failure = new Error('injected history failure')
  fetchMock.getOnce('https://rmbgw.tbconline.ge/deposits/api/v1/statements/1', { throws: failure })
  const error = await fetchApiDepositStatementsV2(1, session).catch(error => error)
  expect(error).toBe(failure)
  expect(error).not.toBeInstanceOf(ZPAPIError)
})
