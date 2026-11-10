import { AccountType } from '../../../../types/zenmoney'
import { convertPdfStatementTransaction } from '../../converters/transactions'
import { ConvertedAccount } from '../../models'

it('represents the recorded ATM withdrawal as a transfer to cash', () => {
  // mail_inbound 205919, build 24: complete parsed record from the statement retained in refunds.test.ts.
  // TRANSFER-001, AMOUNT-001: the printed debit funds the opposite cash movement.
  const raw = {
    hold: false,
    date: '2026-07-30T00:00:00.000',
    originalAmount: null,
    amount: '- 10 000,00 ₸',
    description: 'Банкомат Home Credit Bank — Снятия, комиссии и другое',
    statementUid: 'statement',
    originString: '2026-07-30T00:00:00.000\nБанкомат Home Credit Bank\nСнятия, комиссии и другое\n- 10 000,00 ₸',
    operation: 'Снятия, комиссии и другое'
  }
  const account: ConvertedAccount = {
    account: {
      id: 'KZ00886D224601000001',
      type: AccountType.ccard,
      instrument: 'KZT',
      title: 'Home Credit *1234',
      balance: 304.67,
      syncIds: ['KZ00886D224601000001']
    },
    date: new Date('2026-11-08T00:00:00.000')
  }
  expect(convertPdfStatementTransaction(raw, account)).toEqual({
    statementUid: 'statement',
    transaction: {
      date: new Date('2026-07-30T00:00:00.000'),
      hold: false,
      comment: null,
      merchant: { title: 'Home Credit Bank', city: null, country: null, mcc: null, location: null },
      movements: [
        { id: null, account: { id: 'KZ00886D224601000001' }, invoice: null, sum: -10000, fee: 0 },
        { id: null, account: { type: AccountType.cash, instrument: 'KZT', company: null, syncIds: null }, invoice: null, sum: 10000, fee: 0 }
      ]
    }
  })
})
