import { convertModernAccounts, convertModernTransactions, convertOperationAmounts, getRequiredOperationDetails } from './modernConverters'
import { JsonObject } from './modernValidation'
import { Transaction, AccountOrCard } from '../../types/zenmoney'

const { toZenMoneyTransaction }: { toZenMoneyTransaction: (transaction: Transaction, accounts: Record<string, AccountOrCard>) => unknown } = jest.requireActual('../../common/converters')

const model: JsonObject = jest.requireActual('./modern-fixtures/fee-fx/accounts.json')
const fees: JsonObject[] = jest.requireActual('./modern-fixtures/fee-fx/fees.json')
const knownFees: JsonObject[] = jest.requireActual('./modern-fixtures/fee-fx/known-account-fees.json')
const balancePairs: Array<{ previous: { billingAmount: { amount: number } }, charged: JsonObject & { billingAmount: { amount: number } } }> = jest.requireActual('./modern-fixtures/fee-fx/balance-pairs.json')
const transfer: JsonObject = jest.requireActual('./modern-fixtures/fee-fx/transfer.json')
const detailResponse: { body: JsonObject } = jest.requireActual('./modern-fixtures/fee-fx/transfer-details.json')
const expectedFees: unknown[] = jest.requireActual('./modern-fixtures/fee-fx/expected-transactions.json')
const expectedAccounts: unknown[] = jest.requireActual('./modern-fixtures/fee-fx/expected-accounts.json')
const fromDate = new Date('2023-10-26T21:00:00Z')
const transferId = '4a86af5d-6113-4b9f-92a4-b7fbba02acf4'
const details = new Map([[transferId, detailResponse.body]])

// Complete real source objects, including canceled operations and a separately
// booked service charge. Provenance explains the balance reconciliation and gaps.
describe('observed Sberbank commissions', () => {
  it('keeps principal and additional charge distinct across all six observed forms, including RUR aliases', () => {
    expect(fees.map(raw => convertOperationAmounts(raw, 'RUB'))).toEqual([
      { sum: -252, fee: -50, invoice: null },
      { sum: -800, fee: -12, invoice: null },
      { sum: -10500, fee: -210, invoice: null },
      { sum: -300, fee: -30, invoice: null },
      { sum: -5000, fee: -62.5, invoice: null },
      { sum: -15000, fee: -23.05, invoice: null },
      { sum: -50, fee: -0.75, invoice: null },
      { sum: -30000, fee: -1.5, invoice: null },
      { sum: -2500, fee: -12.5, invoice: null },
      { sum: -2000, fee: -40, invoice: null },
      { sum: -240, fee: -2.4, invoice: null },
      { sum: -100, fee: -50, invoice: null }
    ])
  })

  it('reconciles total account impact against independent adjacent balances, including old incomplete national totals', () => {
    for (const pair of balancePairs) {
      const movement = convertOperationAmounts(pair.charged, 'RUB')
      expect(Number(((movement.sum ?? NaN) + movement.fee).toFixed(2))).toBe(Number((pair.charged.billingAmount.amount - pair.previous.billingAmount.amount).toFixed(2)))
    }
  })

  it('converts real fees on currently fetched accounts, excludes cancellations and keeps a standalone charge exactly once', () => {
    const graph = convertModernAccounts(model)
    expect(graph.accounts).toEqual(expectedAccounts)
    const result = convertModernTransactions(knownFees, graph, fromDate)
    expect(JSON.parse(JSON.stringify(result))).toEqual(expectedFees)
    expect(result.length).toBe(knownFees.filter(raw => (raw.state as JsonObject).category === 'executed').length)
    const standalone = knownFees[knownFees.length - 1]
    const movement = result.flatMap(t => t.movements).filter(m => m.id === standalone.uohId)
    expect(movement).toHaveLength(1)
    expect(movement[0]).toMatchObject({ sum: -99, fee: 0, invoice: null })
    for (const raw of knownFees.filter(raw => raw !== standalone && (raw.state as JsonObject).category === 'executed')) {
      const operation = raw.operationAmount as { amount: number }
      const fee = raw.commission as { amount: number }
      expect(result.flatMap(t => t.movements).find(m => m.id === raw.uohId)).toMatchObject({ sum: operation.amount, fee: -fee.amount, invoice: null })
    }
    expect(convertModernTransactions(knownFees, graph, fromDate)).toEqual(result)
  })
})

describe('observed USD to RUB transfer', () => {
  it('fetches details only for the relevant non-skipped transfer', () => {
    const graph = convertModernAccounts(model)
    expect(getRequiredOperationDetails([transfer, ...knownFees], graph, fromDate)).toEqual([transferId])
    expect(getRequiredOperationDetails([transfer], graph, new Date('2026-01-01'))).toEqual([])
    expect(getRequiredOperationDetails([transfer], graph, fromDate, null, () => true)).toEqual([])
  })

  it('uses both bank-confirmed amounts and references the absent historical account without inventing its balance', () => {
    const graph = convertModernAccounts(model)
    const result = convertModernTransactions([transfer], graph, fromDate, null, undefined, details)
    expect(result).toEqual([{
      date: new Date('2025-04-28T15:44:27Z'),
      hold: false,
      merchant: null,
      comment: null,
      movements: [
        { id: null, account: { type: null, instrument: 'USD', company: { id: '4624' }, syncIds: ['1021'] }, sum: -10, invoice: null, fee: 0 },
        { id: `${transferId}:in`, account: { id: 'sber:9000000000000027' }, sum: 778, invoice: { sum: 10, instrument: 'USD' }, fee: 0 }
      ]
    }])
    expect(convertModernTransactions([transfer], graph, fromDate, null, undefined, details)).toEqual(result)
    expect(convertModernTransactions([transfer], graph, fromDate, null, () => true, details)).toEqual([])
  })

  it('fails without confirmed credit details instead of estimating an exchange rate or using the zero balance', () => {
    expect(() => convertModernTransactions([transfer], convertModernAccounts(model), fromDate)).toThrow('confirmed operation details')
  })

  it('preserves both amounts through the mobile legacy adapter', () => {
    const graph = convertModernAccounts(model)
    const [transaction] = convertModernTransactions([transfer], graph, fromDate, null, undefined, details)
    expect(toZenMoneyTransaction(transaction, Object.fromEntries(graph.accounts.map(a => [a.id, a])))).toEqual({
      date: new Date('2025-04-28T15:44:27Z'),
      hold: false,
      comment: null,
      outcome: 10,
      outcomeAccount: 'ccard#USD#1021',
      outcomeBankID: null,
      income: 778,
      incomeAccount: 'sber:9000000000000027',
      incomeBankID: `${transferId}:in`,
      opIncome: 10,
      opIncomeInstrument: 'USD'
    })
  })
})
