import fetchMock from 'fetch-mock'
import { ZPAPIError } from '../../../errors'

jest.mock('../config', () => ({}), { virtual: true })
const { fetchTransactions } = jest.requireActual<{
  fetchTransactions: (auth: { accessToken: string }, company: { inn: string }, account: { id: string }, from: Date, to: Date) => Promise<unknown[]>
}>('../api')

afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('reports the complete observed 422 statement failure before transaction iteration', async () => {
  // Complete bank body, mail_inbound 173897, tinkoff-business build 140.
  const response = { errorMessage: 'Something went wrong. Please try again later.', errorCode: 'INTERNAL_ERROR', errorId: '5fcb7a5aa653c6a4' }
  fetchMock.get(/^https:\/\/business\.tinkoff\.ru\/openapi\/api\/v1\/bank-statement\?/, { status: 422, body: response })
  const error: unknown = await fetchTransactions({ accessToken: 'model-access-token' }, { inn: 'model-inn' }, { id: 'model-account' }, new Date('2026-10-07T00:00:00Z'), new Date('2026-10-22T00:00:00Z')).catch((error: unknown) => error)
  expect(error).toBeInstanceOf(Error)
  expect(error).not.toBeInstanceOf(ZPAPIError)
  expect(error).toHaveProperty('message', expect.stringMatching(/Unexpected bank statement response/))
  expect(error).toHaveProperty('message', expect.stringMatching(/422/))
  expect(error).toHaveProperty('message', expect.stringMatching(/INTERNAL_ERROR/))
})

it('[model] propagates a statement transport failure unchanged', async () => {
  // Unknown failures must not turn into successful empty history.
  const failure = new Error('Model transport failure')
  fetchMock.get(/^https:\/\/business\.tinkoff\.ru\/openapi\/api\/v1\/bank-statement\?/, { throws: failure })
  await expect(fetchTransactions({ accessToken: 'model-token' }, { inn: '' }, { id: 'model-account' }, new Date('2026-10-07T00:00:00Z'), new Date('2026-10-22T00:00:00Z'))).rejects.toBe(failure)
})
