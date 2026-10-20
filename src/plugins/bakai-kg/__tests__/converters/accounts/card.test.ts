import { readFileSync } from 'fs'
import { join } from 'path'
import { getArray } from '../../../../../types/get'
import { convertAccounts } from '../../../converters'

const products: unknown = JSON.parse(readFileSync(join(__dirname, '../../fixtures/products.json'), 'utf8'))
const expected = [
  {
    account: { id: '1000', type: 'ccard', title: 'Тестовая карта A KGS', instrument: 'KGS', balance: 1306.68, syncIds: ['9000000000000001', '0000 **** **** 0002'] },
    fetchParams: { accountId: 1000, cardId: 1002 }
  },
  {
    account: { id: '1003', type: 'ccard', title: 'Тестовая карта B KGS', instrument: 'KGS', balance: 0, syncIds: ['9000000000000003', '0000 **** **** 0004'] },
    fetchParams: { accountId: 1003, cardId: 1005 }
  },
  {
    account: { id: '1006', type: 'ccard', title: 'Тестовая карта A USD', instrument: 'USD', balance: 9.11, syncIds: ['9000000000000005', '0000 **** **** 0006'] },
    fetchParams: { accountId: 1006, cardId: 1008 }
  },
  {
    account: { id: '1009', type: 'checking', title: 'Тестовый счёт KGS', instrument: 'KGS', balance: 1234.13, syncIds: ['9000000000000007', 'bakai-account:1009'] },
    fetchParams: { accountId: 1009, source: 'account' }
  },
  {
    account: { id: '1010', type: 'checking', title: 'Тестовый счёт EUR', instrument: 'EUR', balance: 0, syncIds: ['9000000000000007', 'bakai-account:1010'] },
    fetchParams: { accountId: 1010, source: 'account' }
  }
]

it('converts the full observed graph into three cards and two distinct currency accounts (ACCOUNT-001..004)', () => {
  expect(convertAccounts(getArray(products, 'list'))).toEqual(expected)
  expect(convertAccounts([...getArray(products, 'list')].reverse())).toEqual(expected)
})
