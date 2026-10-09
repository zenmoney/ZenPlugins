import fetchMock from 'fetch-mock'
import { responses } from '../__fixtures__/blockedCard'
// @ts-expect-error The legacy JavaScript workflow has no declaration file.
import * as workflow from '../api'
// @ts-expect-error The legacy JavaScript converters have no declaration file.
import * as converters from '../converters'

const { fetchAccounts } = workflow as { fetchAccounts: (sid: string) => Promise<unknown[]> }
const { convertAccounts } = converters as { convertAccounts: (products: unknown[]) => unknown[] }

afterEach(() => { fetchMock.restore() })

// ACCOUNT-001/003: preserve the blocked card and its statement sources; use its linked balance.
it('converts the complete graph with a blocked card lacking its own balance', async () => {
  global.ZenMoney = { isAccountSkipped: () => false } as unknown as typeof ZenMoney
  let response = 0
  fetchMock.post('https://stb24.by/api/sou/admin/xml', () => ({
    status: 200,
    body: responses[response++]
  }))
  const products = await fetchAccounts('model-session')
  const expected = [
    {
      id: '71000001',
      transactionsAccId: '91135127-9974e8-ms-1728104-b735-getordering-1',
      latestTrID: '91135128-8d998b-ms-1728104-wsig-lasttrx-1',
      type: 'card',
      title: 'Платёжная карточка*1001',
      currencyCode: '933',
      cardNumber: '521000******1001',
      instrument: 'BYN',
      balance: 1.9,
      syncID: ['1001'],
      productId: '71000001-3bede2',
      productType: 'MS'
    },
    {
      id: '71000002',
      transactionsAccId: '91135129-0ba526-ms-1728296-b735-getordering-1',
      latestTrID: '91135130-742416-ms-1728296-wsig-lasttrx-1',
      type: 'card',
      title: 'Платёжная карточка*1002',
      currencyCode: '840',
      cardNumber: '521000******1002',
      instrument: 'USD',
      balance: 90,
      syncID: ['1002'],
      productId: '71000002-904c9e',
      productType: 'MS'
    },
    {
      id: '71000003',
      transactionsAccId: '91135131-7116fe-ms-1728264-b735-getordering-1',
      latestTrID: '91135132-d6d27d-ms-1728264-wsig-lasttrx-1',
      type: 'card',
      title: 'Платёжная карточка*1003',
      currencyCode: '933',
      cardNumber: '521000******1003',
      instrument: 'BYN',
      balance: 0,
      syncID: ['1003'],
      productId: '71000003-5f81a0',
      productType: 'MS'
    }
  ]
  expect(convertAccounts(products)).toEqual(expected)
  expect(convertAccounts([...products].reverse())).toEqual([...expected].reverse())
  expect(fetchMock.calls('https://stb24.by/api/sou/admin/xml')).toHaveLength(9)
})
