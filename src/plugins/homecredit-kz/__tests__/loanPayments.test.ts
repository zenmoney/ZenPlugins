import { parseStatementText } from '../parser'
import { parseSinglePdfString } from '../api'
import { convertPdfStatementAccount } from '../converters/accounts'
import { convertPdfStatementTransaction } from '../converters/transactions'
import { AccountType } from '../../../types/zenmoney'

jest.mock('../api', () => ({ ...jest.requireActual('../api'), parsePdfStatements: jest.fn() }))
const api: typeof import('../api') = jest.requireMock('../api')
const { scrape }: typeof import('../index') = jest.requireActual('../index')
const { text } = jest.requireActual<{ text: string }>('../__fixtures__/loan-payments-184476.json')

const expectedAccount = {
  id: 'KZ00886D224300000001',
  balance: 952.6,
  instrument: 'KZT',
  syncIds: ['KZ00886D224300000001'],
  title: 'Home Credit *1234',
  type: AccountType.ccard
}
const payments: Array<[string, number, string?]> = [
  ['2026-10-16', -44299], ['2026-10-12', -9361], ['2026-10-01', -43738],
  ['2026-09-09', -9361], ['2026-09-09', -44299],
  ['2026-09-02', -74335.12, 'Полное досрочное погашение кредита'], ['2026-09-02', -43738],
  ['2026-08-18', -3831], ['2026-08-17', -44299], ['2026-07-16', -43738],
  ['2026-07-02', -44299], ['2026-07-02', -3831], ['2026-07-02', -43738],
  ['2026-06-06', -3831], ['2026-06-06', -44299], ['2026-06-02', -43738],
  ['2026-05-15', -44299], ['2026-05-08', -531875.3, 'Полное досрочное погашение кредита']
]
const expectedPayments = payments.map(([date, sum, comment]) => ({
  date: new Date(`${date}T00:00:00.000`),
  hold: false,
  merchant: null,
  comment: comment ?? 'Перевод на "Кредит наличными"',
  movements: [{ id: null, account: { id: expectedAccount.id }, invoice: null, sum, fee: 0 }]
}))

it('parses all 758 recorded operations and preserves all 18 loan payments', () => {
  // AMOUNT-001, TRANSFER-001, COMMENT-001: only the card debit is present;
  // retain its purpose without inventing a loan account or a merchant.
  const parsed = parseStatementText(text, 'statement')
  expect(parsed.header).toEqual({
    iban: expectedAccount.id,
    cardLast4: '1234',
    statementDateIso: '2026-10-28T00:00:00.000',
    balance: 952.6,
    locale: 'ru',
    statementKind: 'card'
  })
  expect(parsed.transactions).toHaveLength(758)
  const statement = parseSinglePdfString(text, 'statement')
  const account = convertPdfStatementAccount(statement.account)
  expect(account).toEqual({ account: expectedAccount, date: new Date('2026-10-28T00:00:00.000') })
  const loans = parsed.transactions.filter(transaction => transaction.operation === 'Платежи по кредиту')
  expect(loans.map(transaction => convertPdfStatementTransaction(transaction, account))).toEqual(
    expectedPayments.map(transaction => ({ statementUid: 'statement', transaction }))
  )
})

it.each([true, false])('imports the selected statement operation regardless of first-run dates (%s)', async isFirstRun => {
  // [model] File selection defines the interval; the observed record is unchanged.
  const statement = parseSinglePdfString(text, 'statement')
  const payment = statement.transactions.find(transaction => transaction.description?.endsWith(' — Платежи по кредиту') === true)
  expect(payment).toBeDefined()
  jest.mocked(api.parsePdfStatements).mockResolvedValue([{ ...statement, transactions: [payment as typeof statement.transactions[number]] }])
  Object.assign(global, {
    ZenMoney: {
      getData: jest.fn().mockReturnValue({ deviceId: 'model-device' }), setData: jest.fn(), saveData: jest.fn()
    }
  })
  await expect(scrape({ preferences: { startDate: '2026-10-25' }, fromDate: new Date('2026-10-25T00:00:00Z'), isFirstRun, isInBackground: false })).resolves.toEqual({
    accounts: [expectedAccount], transactions: [expectedPayments[0]]
  })
})
