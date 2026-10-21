import fetchMock from 'fetch-mock'
import fixture from '../fixtures/accounts-171911.json'
import { getAccounts, getTransactions } from '../../api'
import get, { getArray, getString } from '../../../../types/get'

const base = 'https://online.zepterbank.by/ibanking'
const accountOne = '27c6a-lw_8lonS0iNzzjvjCyLSWFij0PLC3N9y10C3o'
const activeCard = 'GeB2uiRi01quBpNCyD-5vbIi4qDRx-s5Sf39rTJovhM'
const oldCard = 'TzrTK7MhU01n_t8c7Y4yPKiO0DEwD_J6e04YkfBIASU'
const sharedProduct = 'wdAr7qcPr70dg6Apmjjb1N7-Tzv2PuUf16g-hoUeRJU'
const expected = [
  {
    id: accountOne,
    title: 'Visa Classic "Карта плюс" BYN SV',
    balance: 205.47,
    instrument: 'BYN',
    syncIds: ['BY00ZEPT10000000000000000000', '1000000000000', '0001'],
    type: 'ccard',
    _meta: { cardTransactionsFetchId: accountOne, productStatementFetchId: '12ukr1N5wnBFFk0F-J0CpKf0qzzHafHosfHHU8I8ZuA' }
  },
  {
    id: activeCard,
    title: 'Visa Classic "Карта плюс" BYN SV',
    balance: 0,
    instrument: 'BYN',
    syncIds: ['BY00ZEPT10000000000000000001', '100000000001', '0002'],
    type: 'ccard',
    _meta: { cardTransactionsFetchId: activeCard, cardTransactionsFetchIds: [activeCard, oldCard], productStatementFetchId: sharedProduct }
  }
]

afterEach(() => { fetchMock.restore() })

it.each([false, true])('merges the complete recorded graph independently of card order: reversed=%s (ACCOUNT-001, ACCOUNT-002)', async reversed => {
  const products = get(fixture, 'response.products') as object
  const cards = getArray(products, 'cards')
  fetchMock.get(`${base}/products?refresh=true`, { products: { ...products, cards: reversed ? [...cards].reverse() : cards } })
  const accounts = await getAccounts({ sessionToken: 'model-session' })
  expect(accounts.sort((left, right) => left.id.localeCompare(right.id))).toEqual(expected)
})

it('loads both recorded card histories and the shared statement once (ACCOUNT-004)', async () => {
  fetchMock.get(`${base}/products?refresh=true`, { body: get(fixture, 'response') })
  // Both duplicate-card histories and their shared statement were empty in log 171911.
  fetchMock.post(`${base}/cards/history`, [])
  fetchMock.post(`${base}/products/statement`, {})
  const accounts = await getAccounts({ sessionToken: 'model-session' })
  expect(await getTransactions({ sessionToken: 'model-session', fromDate: new Date('2026-10-19T00:00:00+03:00'), toDate: new Date('2026-10-20T00:00:00+03:00') }, accounts[1])).toEqual([])
  expect(fetchMock.calls(`${base}/cards/history`).map(([, options]) => getString(JSON.parse(String(options?.body)), 'productId')).sort()).toEqual([activeCard, oldCard])
  expect(fetchMock.calls(`${base}/products/statement`)).toHaveLength(1)
})

it('[model] keeps a grouped card history transport failure reportable', async () => {
  // One necessary history source failing must reject the whole grouped account.
  const failure = new Error('model card history transport failure')
  fetchMock.get(`${base}/products?refresh=true`, { body: get(fixture, 'response') })
  fetchMock.post(`${base}/cards/history`, (_url: string, options: { body?: string }) => {
    if (get(JSON.parse(String(options.body)), 'productId') === oldCard) throw failure
    return []
  })
  fetchMock.post(`${base}/products/statement`, {})
  const accounts = await getAccounts({ sessionToken: 'model-session' })
  await expect(getTransactions({ sessionToken: 'model-session', fromDate: new Date('2026-10-19T00:00:00+03:00'), toDate: new Date('2026-10-20T00:00:00+03:00') }, accounts[1])).rejects.toBe(failure)
})
