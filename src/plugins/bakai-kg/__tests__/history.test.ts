import fetchMock from 'fetch-mock'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fetchTransactions } from '../api'
import { InvalidPreferencesError, ZPAPIError } from '../../../errors'
import { FetchParams } from '../models'
import get from '../../../types/get'

const state = { version: 1 as const, deviceId: '00000000-0000-4000-8000-000000000000', token: 'test-token', otpVerified: true }
const card = { accountId: 1000, cardId: 1002 }
const empty: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/empty-statement.json'), 'utf8'))
const accountEmpty: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/empty-account-history.json'), 'utf8'))
const limit: unknown = JSON.parse(readFileSync(join(__dirname, 'fixtures/history-limit.json'), 'utf8'))
const cardUrl = 'https://bakai24.bakai.kg/v2/card.online_statement'
const accountUrl = 'https://bakai24.bakai.kg/v2/account.history'

beforeEach(() => {
  jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-10-16T12:00:00+06:00').getTime())
  global.ZenMoney = { device: { manufacturer: 'Apple', model: 'iPhone', os: { name: 'ios', version: '27.0' } } } as unknown as typeof ZenMoney
  fetchMock.catch({ throws: new Error('Unexpected model history request') })
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

describe('[model] history interval bounds', () => {
  // Calendar/transport invariants use observed empty envelopes, not invented bank operations.
  it.each([
    ['2026-10-16T12:00:00+06:00', '2026-04-16T00:00:00+06:00', '2026-04-15', '2026-10-16'],
    ['2026-10-15T18:01:00Z', '2026-04-16T00:00:00+06:00', '2026-04-15', '2026-10-16'],
    ['2026-08-31T12:00:00+06:00', '2026-02-28T00:00:00+06:00', '2026-02-27', '2026-08-31'],
    ['2024-08-31T12:00:00+06:00', '2024-02-29T00:00:00+06:00', '2024-02-28', '2024-08-31']
  ])('accepts six calendar months at %s and preserves the preceding day', async (now, from, start, end) => {
    jest.mocked(Date.now).mockReturnValue(new Date(now).getTime())
    fetchMock.postOnce(cardUrl, { body: get(empty, 'response') })
    await expect(fetchTransactions(state, card, new Date(from))).resolves.toEqual([])
    const body = JSON.parse(String(fetchMock.lastOptions(cardUrl)?.body)) as Record<string, unknown>
    expect({ start: body.datbeg, end: body.datend }).toEqual({ start, end })
  })

  it('rejects an older selected card period before any history request without silently clipping it', async () => {
    const promise = fetchTransactions(state, card, new Date('2026-04-15T23:59:59+06:00'))
    await expect(promise).rejects.toBeInstanceOf(InvalidPreferencesError)
    await expect(promise).rejects.toMatchObject({ message: expect.stringContaining('16.04.2026') })
    expect(fetchMock.calls()).toEqual({ matched: [], unmatched: [] })
  })

  it('uses the effective recent period when the original connection start date is old', async () => {
    fetchMock.postOnce(cardUrl, { body: get(empty, 'response') })
    await expect(fetchTransactions(state, card, new Date('2026-10-02T00:00:00+06:00'))).resolves.toEqual([])
    const body = JSON.parse(String(fetchMock.lastOptions(cardUrl)?.body)) as Record<string, unknown>
    expect({ start: body.datbeg, end: body.datend }).toEqual({ start: '2026-10-01', end: '2026-10-16' })
  })

  it('fetches current lifecycle representations for an older upper bound', async () => {
    fetchMock.postOnce(cardUrl, { body: get(empty, 'response') })
    await expect(fetchTransactions(state, card, new Date('2026-09-01T00:00:00+06:00'), new Date('2026-09-30T23:59:59+06:00'))).resolves.toEqual([])
    const body = JSON.parse(String(fetchMock.lastOptions(cardUrl)?.body)) as Record<string, unknown>
    expect(body.datend).toBe('2026-10-16')
  })

  it('preserves supported historical account-only imports beyond six months', async () => {
    const params: FetchParams = { accountId: 1009, source: 'account' }
    fetchMock.postOnce(accountUrl, { body: get(accountEmpty, 'response') })
    await expect(fetchTransactions(state, params, new Date('2023-10-14T00:00:00+06:00'))).resolves.toEqual([])
    const body = JSON.parse(String(fetchMock.lastOptions(accountUrl)?.body)) as Record<string, unknown>
    expect({ start: body.datbeg, end: body.datend }).toEqual({ start: '2023-10-13', end: '2026-10-16' })
  })
})

it('keeps a bank rejection of an otherwise supported interval reportable', async () => {
  fetchMock.postOnce(cardUrl, { body: limit })
  const promise = fetchTransactions(state, card, new Date('2026-05-16T00:00:00+06:00'))
  await expect(promise).rejects.toBeInstanceOf(Error)
  await expect(promise).rejects.not.toBeInstanceOf(ZPAPIError)
})
