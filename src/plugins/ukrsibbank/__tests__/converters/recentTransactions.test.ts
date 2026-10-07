import { adjustTransactions, mergeTransfersHandler } from '../../../../common/transactionGroupHandler'
import { ExtendedTransaction } from '../../../../types/zenmoney'
const { convertAccounts, convertTransaction, mergeCurrencyExchanges }: { convertAccounts: (raw: unknown) => Array<{ account: unknown }>, convertTransaction: (raw: unknown, plans: unknown) => ExtendedTransaction, mergeCurrencyExchanges: typeof mergeTransfersHandler } = jest.requireActual('../../converters')
const fixtures: { products: unknown, transactions: Array<{ id: string }> } = jest.requireActual('./recentTransactions.json')

const plans = convertAccounts(fixtures.products)
const uah = '80000000001'
const usd = '80000000002'
const outId = '520431051E6546D0024DAE39FF357FCB'
const inId = '80000000013'
function converted (id: string): ExtendedTransaction {
  return convertTransaction(fixtures.transactions.find(transaction => transaction.id === id), plans)
}
function adjust (transactions: ExtendedTransaction[]): ExtendedTransaction[] {
  return adjustTransactions({ transactions, groupHandlers: [mergeCurrencyExchanges, mergeTransfersHandler] })
}
const expense = { id: outId, account: { id: uah }, sum: -19276.9, fee: 0, invoice: null }
const income = { id: inId, account: { id: usd }, sum: 430, fee: 0, invoice: null }
const expectedOut = {
  date: new Date(1789455075199),
  hold: false,
  movements: [expense, { id: `${outId}:${usd}`, account: { id: usd }, sum: 430, fee: 0, invoice: { sum: 19276.9, instrument: 'UAH' } }],
  merchant: null,
  comment: null,
  groupKeys: ['ukrsib:fx:reference:800000001', 'ukrsib:fallback:2026-09-15:UAH:19276.9']
}

// AMOUNT-001, TRANSFER-001/004: complete responses from mail_inbound 155413, build 167.
describe('UKRSIB observed currency exchanges and account graph', () => {
  it('converts both balances and every card history source from the complete graph', () => {
    expect(plans).toEqual([
      { account: { id: uah, type: 'ccard', title: 'ЗП De Luxe картковий', instrument: 'UAH', syncIds: ['UA263510058000000000000000001', '535432****8003', '535129****8004'], balance: 3112.93, savings: false, archived: false }, fetchParams: { productIds: [uah], cardIds: ['80000000005', '80000000006'] } },
      { account: { id: usd, type: 'ccard', title: 'ЗП De Luxe картковий', instrument: 'USD', syncIds: ['UA963510058000000000000000002', '535432****8001', '535129****8002'], balance: 22800, savings: false, archived: false }, fetchParams: { productIds: [usd], cardIds: ['80000000003', '80000000004'] } }
    ])
  })
  it('uses the source amount in the matching currency, not a nested account balance', () => {
    expect(converted(outId)).toEqual(expectedOut)
    expect(converted(inId)).toEqual({
      date: new Date(1789455075199),
      hold: false,
      movements: [income, { id: `${inId}:${uah}`, account: { id: uah }, sum: -19276.9, fee: 0, invoice: { sum: -430, instrument: 'USD' } }],
      merchant: null,
      comment: null,
      groupKeys: ['ukrsib:fx:reference:800000001', 'ukrsib:fallback:2026-09-15:USD:430']
    })
  })
  it.each([false, true])('removes mirrored FX duplication, reversed input: %s', reverse => {
    const transactions = [converted(outId), converted(inId)]
    if (reverse) transactions.reverse()
    expect(adjust(transactions)).toEqual([{ date: new Date(1789455075199), hold: false, movements: [expense, income], merchant: null, comment: null }])
  })
  it('retains the explicitly completed FX movements when only one mirrored record is available', () => {
    const { groupKeys, ...expected } = expectedOut
    expect(adjust([converted(outId)])).toEqual([expected])
  })
  it.each([
    ['80000000008', 1789541756000, -7, 'Комісія за переказ грошових коштів на картковий рахунок через MasterCard\\Visa UKRSIBOnline'],
    ['80000000011', 1790676023000, 38990.61, 'Заробітна плата та аванси від ТОВ "ПРИКЛАД-СЕРВІС УКРАЇНА"']
  ] as const)('retains the complete fee or income result %s', (id, time, sum, comment) => {
    expect(converted(id)).toEqual({ date: new Date(time), hold: false, movements: [{ id, account: { id: uah }, sum, fee: 0, invoice: null }], merchant: null, comment })
  })
})

// ACCOUNT-002, TRANSFER-004: the complete original records contain duplicated nested technical IDs.
it('resolves the observed FX counterpart by its unique IBAN instead of silently omitting the exchange', () => {
  const fixture: { products: unknown, transactions: unknown[] } = jest.requireActual('./duplicatedAccountId.json')
  const sourcePlans = convertAccounts(fixture.products)
  const transactions = fixture.transactions.map(raw => convertTransaction(raw, sourcePlans))
  expect(transactions[0]).toEqual({
    date: new Date(1789455080000),
    hold: false,
    movements: [
      { id: 'F4C62C2694EA7868DA68278FE7B0D942', account: { id: uah }, sum: -19276.9, fee: 0, invoice: null },
      { id: `F4C62C2694EA7868DA68278FE7B0D942:${usd}`, account: { id: usd }, sum: 430, fee: 0, invoice: { sum: 19276.9, instrument: 'UAH' } }
    ],
    merchant: null,
    comment: null,
    groupKeys: ['ukrsib:fx:reference:800000001', 'ukrsib:fallback:2026-09-15:UAH:19276.9']
  })
  expect(adjust(transactions)).toEqual([{
    date: new Date(1789455080000),
    hold: false,
    movements: [
      { id: 'F4C62C2694EA7868DA68278FE7B0D942', account: { id: uah }, sum: -19276.9, fee: 0, invoice: null },
      { id: '26BAC23EB5A2CB8AB83250934D9AC576', account: { id: usd }, sum: 430, fee: 0, invoice: null }
    ],
    merchant: null,
    comment: null
  }])
})
