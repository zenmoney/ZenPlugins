import fetchMock from 'fetch-mock'
import { fetchTransactions } from '../api'
import { Session } from '../models'
import { ZPAPIError } from '../../../errors'

const tape = 'https://bl-online.nskbl.ru/mobileService/3.0/json/pfmTape'
const session = (): Session => ({ cookieHeader: 'model-cookie', fingerprint: 'model-device', persist: jest.fn() })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('rejects the observed foreign-account response before accepting or paginating a deposit history', async () => {
  // 2026-11-03: AC_53786292465 returned another account's operation. Reduced
  // outside-conversion input retains the first offending record's two relevant fields.
  // Full private capture provenance: deposit-history-validation.json, first response.
  fetchMock.post(tape, { response: { result: 0, object: { operations: [{ id: 950001, accountId: 920001 }] } } })
  const failure = await fetchTransactions(session(), { accountId: '920006', historyAvailable: true }, new Date('2019-05-20T21:00:00Z'), new Date('2019-05-22T21:00:00Z')).catch((error: unknown) => error)
  expect(failure).toBeInstanceOf(Error)
  expect(failure).not.toBeInstanceOf(ZPAPIError)
  expect((failure as Error).message).toContain('History belongs to a different account')
  expect(fetchMock.calls(tape)).toHaveLength(1)
})

it('[model] never requests the known unavailable history of an old closed deposit', async () => {
  // A metadata-only plan must not send a filter that the bank is known to ignore.
  const info = jest.spyOn(console, 'info').mockImplementation(() => {})
  expect(await fetchTransactions(session(), { accountId: '920006', historyAvailable: false }, new Date('2019-01-01T00:00:00Z'))).toEqual([])
  expect(fetchMock.calls(tape)).toHaveLength(0)
  expect(info).toHaveBeenCalledWith('Levoberezhny closed deposit history unavailable', { accountId: '920006' })
})
