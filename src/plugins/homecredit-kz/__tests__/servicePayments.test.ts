import { parseStatementText } from '../parser'
import { convertPdfStatementTransaction } from '../converters/transactions'
import { AccountType } from '../../../types/zenmoney'
import { ConvertedAccount } from '../models'

// mail_inbound 159722, homecredit-kz 17, extracted PDF text. Customer data is
// replaced for master; all statement lines, amounts and operation types remain.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fixture = require('../__fixtures__/service-payments-159722.json') as { text: string }

it('imports the recorded in-app service payments (AMOUNT-001, COMMENT-001)', () => {
  const { header, transactions } = parseStatementText(fixture.text, 'statement')
  expect(header).toEqual({
    iban: 'KZ00886D224300000001',
    cardLast4: '1234',
    statementDateIso: '2026-10-13T00:00:00.000',
    balance: 2602.57,
    locale: 'ru',
    statementKind: 'card'
  })
  const payments = transactions.filter(transaction => transaction.operation === 'Платежи за услуги в приложении')
  expect(payments).toEqual([
    ['АЛСЕКО 9000001', '5 523,22', '276,00'],
    ['АЛСЕКО 300000001', '16 659,27', '833,00'],
    ['Казахтелеком по номеру договора', '1 300,00', '13,00'],
    ['Казахтелеком - по номеру телефона', '1 300,00', '13,00'],
    ['АЛСЕКО 9000002', '3 168,68', '158,00']
  ].map(([reference, amount, bonus]) => ({
    hold: false,
    date: '2026-09-17T00:00:00.000',
    originalAmount: null,
    amount: `- ${amount} ₸`,
    description: `${reference} — Платежи за услуги в приложении`,
    statementUid: 'statement',
    operation: 'Платежи за услуги в приложении',
    originString: `2026-09-17T00:00:00.000\n${reference}\nПлатежи за услуги в приложении\n- ${amount} ₸ + ${bonus} Б`
  })))
  const account: ConvertedAccount = { account: { id: header.iban, type: AccountType.ccard, title: 'Карта', instrument: 'KZT', syncIds: [header.iban], balance: header.balance }, date: new Date(header.statementDateIso) }
  expect(payments.map(transaction => convertPdfStatementTransaction(transaction, account))).toEqual([
    ['АЛСЕКО 9000001', -5523.22], ['АЛСЕКО 300000001', -16659.27],
    ['Казахтелеком по номеру договора', -1300], ['Казахтелеком - по номеру телефона', -1300], ['АЛСЕКО 9000002', -3168.68]
  ].map(([reference, sum]) => ({
    statementUid: 'statement',
    transaction: {
      date: new Date('2026-09-17T00:00:00.000'),
      hold: false,
      comment: null,
      merchant: { fullTitle: String(reference), mcc: null, location: null },
      movements: [{ id: null, account: { id: header.iban }, invoice: null, sum, fee: 0 }]
    }
  })))
})
