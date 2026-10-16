import { BankCapture } from '../../../testModels'
import { AccountPlan } from '../../../models'
import { readFileSync } from 'fs'
import { join } from 'path'
import { convertAccounts } from '../../../converters'
import { AccountOrCard, AccountType } from '../../../../../types/zenmoney'

const capture: BankCapture = JSON.parse(readFileSync(join(__dirname, '../../fixtures/capture.json'), 'utf8'))
/** Compact independently expected account fields with narrow account kinds. */
type ExpectedAccount = readonly [
  suffix: string,
  type: AccountOrCard['type'],
  title: string,
  instrument: string,
  card: string | null,
  balance: number
]

const expectedAccounts: readonly ExpectedAccount[] = [
  ['0', AccountType.ccard, 'VISA_CLASSIC_DIGITAL AMD', 'AMD', '4083********0081', 16600.56],
  ['1', AccountType.ccard, 'VISA_CLASSIC_DIGITAL USD', 'USD', '4083********0082', 1672.71],
  ['2', AccountType.ccard, 'VISA_PLATINUM AMD', 'AMD', '4083********0083', 234435.42],
  ['3', AccountType.ccard, 'MC_GOLD AMD', 'AMD', '5483********0084', 4.2],
  ['4', AccountType.ccard, 'VISA_CLASSIC_DIGITAL EUR', 'EUR', '4083********0085', 0],
  ['5', AccountType.checking, 'CURRENT AMD', 'AMD', null, 4980000],
  ['6', AccountType.checking, 'CURRENT EUR', 'EUR', null, 0],
  ['7', AccountType.checking, 'CURRENT USD', 'USD', null, 0],
  ['8', AccountType.checking, 'CURRENT RUB', 'RUB', null, 0],
  ['9', AccountType.checking, 'SAVING AMD', 'AMD', null, 0.3]
]
const expected: AccountPlan = {
  accounts: [...expectedAccounts.map(([suffix, type, title, instrument, card, balance]): AccountOrCard => {
    const id = `157001000000000${String(suffix)}`
    return { id, type, title, instrument, syncIds: card === null ? [id] : [id, card], balance, ...(suffix === '9' ? { savings: true } : {}) }
  }), {
    id: 'deposit:1010756356',
    type: AccountType.deposit,
    title: 'AMERIA_DEPOSIT USD',
    instrument: 'USD',
    syncIds: ['NA100002'],
    balance: 24514.47,
    startDate: new Date('2025-05-29'),
    startBalance: 24000,
    capitalization: true,
    percent: 2.3,
    endDateOffsetInterval: 'day',
    endDateOffset: 552,
    payoffInterval: null,
    payoffStep: 0
  }],
  fetchParams: { source: 'history', deposits: [{ accountId: 'deposit:1010756356', productId: '1010756356' }] }
}

it('converts the complete graph using available own funds and full account numbers (ACCOUNT-001/002/003)', () => {
  expect(convertAccounts(capture.graph, capture.products)).toEqual(expected)
})

it('preserves identities and currencies with reversed graph order', () => {
  const graph = capture.graph
  expect(convertAccounts({ ...graph, accountsAndCards: [...graph.accountsAndCards].reverse() }, [...capture.products.slice(0, 9).reverse(), capture.products[9]])).toEqual(expected)
})
