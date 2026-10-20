import fetchMock from 'fetch-mock'
import { Api } from './api'
import { recordedCards, recordedPayments } from './__fixtures__/recordedPayments'

const base = 'https://mobile.bsb.by/api/v1/'
beforeEach(() => {
  // [model] Only the local device and authorization secret are modeled.
  global.ZenMoney = { getData: jest.fn(() => ({ androidId: 'model-device' })) } as unknown as typeof ZenMoney
})
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

it('masks recorded owner names in actual network logs while preserving amounts and matching fields (LOG-001)', async () => {
  const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
  const api = new Api({ username: 'model-user', password: 'model-password' })
  Object.defineProperty(api, '_session', { value: { accessToken: 'model-access-secret' } })
  const payments = recordedPayments.filter(payment => payment.cardId === 100003)
  fetchMock.getOnce(base + 'card-management/cards/actual?with-tokenized=false&with-hidden=false', { status: 200, body: recordedCards })
  fetchMock.postOnce(base + 'payment-management/payments/search', {
    status: 200,
    headers: { 'Set-Cookie': 'model-cookie-secret' },
    body: { leftPage: 0, totalPage: 1, currentPage: 1, totalElements: 3, payments }
  })
  await expect(api.fetchCards()).resolves.toEqual(recordedCards)
  await expect(api.fetchTransactions(100003, new Date('2026-10-09T00:00:00Z'), new Date('2026-10-13T09:00:00Z'))).resolves.toEqual(payments)
  const output = JSON.stringify(debug.mock.calls)
  expect(output).not.toContain('TEST USER')
  expect(output).not.toContain('model-access-secret')
  expect(output).not.toContain('model-cookie-secret')
  const response = debug.mock.calls.find(([label, value]) => label === 'response' && value.body?.payments !== undefined)?.[1]
  expect(response.body).toEqual({
    leftPage: 0,
    totalPage: 1,
    currentPage: 1,
    totalElements: 3,
    payments: [
      { ...payments[0], last4namePayer: '1003, <redacted>', target: '1001, <redacted>' },
      { ...payments[1], last4namePayer: '1003, <redacted>' },
      { ...payments[2], last4namePayer: '1003, <redacted>', target: '1001, <redacted>' }
    ]
  })
})
