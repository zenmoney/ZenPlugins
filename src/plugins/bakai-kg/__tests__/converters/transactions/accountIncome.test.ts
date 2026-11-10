import { convertTransaction } from '../../../converters'
import { AccountOrCard, AccountType } from '../../../../../types/zenmoney'

it('retains the confirmed FX credit without inventing the unobserved EUR debit', () => {
  // mail_inbound 201131, build 8, account.history response 6: complete source record.
  // Personal names/account identifiers replaced for master; recorded sums and purposes preserved.
  const record = {
    id: 4,
    date: '2026-10-30 12:22:47',
    correspondent: 'Иванов Иван Иванович',
    corraccount: '1240180000000001',
    purpose: 'Конвертация клиента Иванов Иван Иванович. Покупка 1000.45 KGS  на 10.24 EUR (курс: 97.700000)',
    balance: 1945.95,
    currency: 'KGS',
    operation_amount: 1000.45,
    operation_currency: 'KGS',
    location: null
  }
  const account: AccountOrCard = { id: 'checking', type: AccountType.checking, title: 'KGS account', instrument: 'KGS', balance: 945.95, syncIds: ['1240180000000001'] }
  expect(convertTransaction(record, account)).toEqual({
    date: new Date('2026-10-30T12:22:47+06:00'),
    hold: null,
    movements: [{ id: null, account: { id: 'checking' }, invoice: null, sum: 1000.45, fee: 0 }],
    merchant: null,
    comment: 'Конвертация клиента Иванов Иван Иванович. Покупка 1000.45 KGS  на 10.24 EUR (курс: 97.700000)'
  })
})
