import { convertTransaction } from '../../../converters'
import { adjustTransactions } from '../../../../../common/transactionGroupHandler'
import { AccountOrCard, AccountType } from '../../../../../types/zenmoney'

it('groups the recorded card-to-account transfer using its movement amount', () => {
  // mail_inbound 201925, build 8, responses 2 and 7: complete matching source records.
  // AMOUNT-001, ID-001, TRANSFER-002: balance is the running ledger balance; id is a row ordinal.
  // Dates on the card side confirm the account timestamp's UTC+6 interpretation.
  const ledgerRecord = {
    id: 2,
    date: '2026-10-19 15:07:38',
    correspondent: 'Ivan Ivanov',
    corraccount: '1242080000000001',
    purpose: 'Перевод Сам себе',
    balance: 11000,
    currency: 'USD',
    operation_amount: 11000,
    operation_currency: 'USD',
    location: null
  }
  const cardRecord = {
    amount: -11000,
    currency: 'USD',
    date: '2026-10-19T15:07:38+06:00',
    date2: '2026-10-19T15:07:38+06:00',
    location: 'Online Bank CBS',
    operation_amount: -11000,
    operation_currency: 'USD',
    type: 'Списание со счета',
    type_code: 'OPTP0402',
    utrnno: '488020449',
    merchant_id: 'OB100001',
    balance: 1891.98,
    rrn: '000488020449',
    mcc: '6010',
    terminal_id: 'OB100001'
  }
  const accounts: AccountOrCard[] = [
    { id: 'account', type: AccountType.checking, title: 'USD account', instrument: 'USD', balance: 11000, syncIds: ['1242020000000001'] },
    { id: 'card', type: AccountType.ccard, title: 'Visa Gold USD', instrument: 'USD', balance: 667.88, syncIds: ['1242080000000001', '4578 **** **** 1234'] }
  ]
  const ledgerTransaction = convertTransaction(ledgerRecord, accounts[0], 0, accounts)
  const cardTransaction = convertTransaction(cardRecord, accounts[1], 0, accounts)
  expect(ledgerTransaction).toEqual({ date: new Date('2026-10-19T09:07:38.000Z'), hold: null, movements: [{ id: null, account: { id: 'account' }, invoice: null, sum: 11000, fee: 0 }], merchant: null, comment: 'Перевод Сам себе', groupKeys: ['bakai:USD:11000:29873347'] })
  expect(cardTransaction).toEqual({ date: new Date('2026-10-19T09:07:38.000Z'), hold: null, movements: [{ id: '488020449:debit', account: { id: 'card' }, invoice: null, sum: -11000, fee: 0 }], merchant: null, comment: null, groupKeys: ['bakai:USD:11000:29873347'] })
  expect(adjustTransactions({ transactions: [ledgerTransaction, cardTransaction] })).toEqual([{
    date: new Date('2026-10-19T09:07:38.000Z'),
    hold: null,
    merchant: null,
    comment: 'Перевод Сам себе',
    movements: [{ id: '488020449:debit', account: { id: 'card' }, invoice: null, sum: -11000, fee: 0 }, { id: null, account: { id: 'account' }, invoice: null, sum: 11000, fee: 0 }]
  }])
  // A skipped or missing counterpart never creates another internal movement.
  expect(adjustTransactions({ transactions: [ledgerTransaction] })).toEqual([{ date: new Date('2026-10-19T09:07:38.000Z'), hold: null, movements: [{ id: null, account: { id: 'account' }, invoice: null, sum: 11000, fee: 0 }], merchant: null, comment: 'Перевод Сам себе' }])
})

it('groups the recorded account-to-card transfer using its movement amount', () => {
  // mail_inbound 201925, build 8, responses 2 and 7: complete matching source records.
  // AMOUNT-001, ID-001, TRANSFER-002: balance is the running ledger balance; id is a row ordinal.
  // Dates on the card side confirm the account timestamp's UTC+6 interpretation.
  const ledgerRecord = {
    id: 1,
    date: '2026-10-19 14:56:11',
    correspondent: 'Ivan Ivanov',
    corraccount: '1242080000000001',
    purpose: 'Перевод Сам себе',
    balance: 0,
    currency: 'USD',
    operation_amount: -13259.52,
    operation_currency: 'USD',
    location: null
  }
  const cardRecord = {
    amount: 13259.52,
    currency: 'USD',
    date: '2026-10-19T14:56:11+06:00',
    date2: '2026-10-19T14:56:11+06:00',
    location: 'Online Bank CBS',
    operation_amount: 13259.52,
    operation_currency: 'USD',
    type: 'Пополнение счета',
    type_code: 'OPTP0422',
    utrnno: '488006555',
    merchant_id: 'OB100001',
    balance: 1891.98,
    rrn: '000488006555',
    mcc: '6010',
    terminal_id: 'OB100001'
  }
  const accounts: AccountOrCard[] = [
    { id: 'account', type: AccountType.checking, title: 'USD account', instrument: 'USD', balance: 11000, syncIds: ['1242020000000001'] },
    { id: 'card', type: AccountType.ccard, title: 'Visa Gold USD', instrument: 'USD', balance: 667.88, syncIds: ['1242080000000001', '4578 **** **** 1234'] }
  ]
  const ledgerTransaction = convertTransaction(ledgerRecord, accounts[0], 0, accounts)
  const cardTransaction = convertTransaction(cardRecord, accounts[1], 0, accounts)
  expect(ledgerTransaction).toEqual({ date: new Date('2026-10-19T08:56:11.000Z'), hold: null, movements: [{ id: null, account: { id: 'account' }, invoice: null, sum: -13259.52, fee: 0 }], merchant: null, comment: 'Перевод Сам себе', groupKeys: ['bakai:USD:13259.52:29873336'] })
  expect(cardTransaction).toEqual({ date: new Date('2026-10-19T08:56:11.000Z'), hold: null, movements: [{ id: '488006555:credit', account: { id: 'card' }, invoice: null, sum: 13259.52, fee: 0 }], merchant: null, comment: null, groupKeys: ['bakai:USD:13259.52:29873336'] })
  expect(adjustTransactions({ transactions: [ledgerTransaction, cardTransaction] })).toEqual([{
    date: new Date('2026-10-19T08:56:11.000Z'),
    hold: null,
    merchant: null,
    comment: 'Перевод Сам себе',
    movements: [{ id: null, account: { id: 'account' }, invoice: null, sum: -13259.52, fee: 0 }, { id: '488006555:credit', account: { id: 'card' }, invoice: null, sum: 13259.52, fee: 0 }]
  }])
  // A skipped or missing counterpart never creates another internal movement.
  expect(adjustTransactions({ transactions: [ledgerTransaction] })).toEqual([{ date: new Date('2026-10-19T08:56:11.000Z'), hold: null, movements: [{ id: null, account: { id: 'account' }, invoice: null, sum: -13259.52, fee: 0 }], merchant: null, comment: 'Перевод Сам себе' }])
})
