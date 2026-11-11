import { convertArchiveAccounts } from './archiveAccounts'
import { convertModernAccounts, convertModernTransactions } from './modernConverters'
import { JsonObject } from './modernValidation'
import { Transaction } from '../../types/zenmoney'
import get from '../../types/get'

const current: JsonObject = jest.requireActual('./modern-fixtures/archive/current.json')
const products: { body: JsonObject } = jest.requireActual('./modern-fixtures/archive/products.json')
const operations: JsonObject[] = jest.requireActual('./modern-fixtures/archive/operations.json')
const requisitesResponses: Array<{ request: { id: number }, response: { body: JsonObject } }> = jest.requireActual('./modern-fixtures/archive/requisites.json')
const expected: unknown[] = jest.requireActual('./modern-fixtures/archive/expected-transactions.json')
const requisites = new Map(requisitesResponses.map(item => [String(item.request.id), item.response.body]))
const graph = convertArchiveAccounts(convertModernAccounts(current), products.body, operations, requisites)
const from = new Date('2000-01-01T00:00:00+03:00')

// TRANSFER-001/004, AMOUNT-001/002, MERCHANT-003: complete real bank records
// and independently calculated ledgers, including the original review cases.
describe('observed external transfer counterparties', () => {
  it.each(['ExtCardTransferIn', 'RurPayment', 'P2PSBPInTransfer', 'UfsOutTransfer', 'UfsTransferBankPartnerPhone', 'UfsTransferAccount', 'UfsTransferRusCard'])('preserves both sides and known counterparty data for %s', form => {
    const raw = operations.find(row => row.form === form && get(row, 'state.category') === 'executed')
    if (raw == null) throw new Error('Missing observed external transfer')
    const golden = expected.find(row => get(row, 'movements.0.id') === raw.uohId)
    const converted = convertModernTransactions([raw], graph, from)
    expect(JSON.parse(JSON.stringify(converted))).toEqual([golden])
    expect(converted[0].movements).toHaveLength(2)
    expect(converted[0].movements[1]?.id).toBeNull()
    expect(convertModernTransactions([raw], graph, from)).toEqual(converted)
    const accountId = String(get(raw, 'billingAmount.id') ?? String(get(raw, 'fromResource.id')).replace(/^[^:]+:/, ''))
    expect(convertModernTransactions([raw], graph, from, null, id => id === graph.byBankId.get(accountId)?.id)).toEqual([])
  })

  it('preserves a card-transfer fee through the mobile adapter without charging the external side', () => {
    const { toZenMoneyTransaction }: { toZenMoneyTransaction: (transaction: Transaction, accounts: Record<string, unknown>) => unknown } = jest.requireActual('../../common/converters')
    const raw = operations.find(row => row.uohId === '0003_9000000000000000090')
    if (raw == null) throw new Error('Missing observed fee transfer')
    const [transaction] = convertModernTransactions([raw], graph, from)
    expect(toZenMoneyTransaction(transaction, Object.fromEntries(graph.accounts.map(a => [a.id, a])))).toEqual({
      date: new Date('2026-05-09T17:59:57Z'),
      hold: false,
      comment: 'Наааааа еа юааааа паааа а уааааа иааа',
      payee: '•• 4046',
      outcome: 330,
      outcomeAccount: 'sber:9000000000000048',
      outcomeBankID: '0003_9000000000000000090',
      income: 300,
      incomeAccount: 'ccard#RUB#4046',
      incomeBankID: null,
      mcc: null
    })
  })

  it.each(['ExtCardTransferOut', 'UfsP2PSBPOutTransfer'])('keeps the known local operation when %s supplies no counterparty resource', form => {
    const raw = operations.find(row => row.form === form && get(row, 'state.category') === 'executed' && row.toResource == null)
    if (raw == null) throw new Error('Missing observed operation without a resource')
    const golden = expected.find(row => get(row, 'movements.0.id') === raw.uohId)
    const converted = convertModernTransactions([raw], graph, from)
    expect(JSON.parse(JSON.stringify(converted))).toEqual([golden])
    expect(converted[0].movements).toHaveLength(1)
  })
})
