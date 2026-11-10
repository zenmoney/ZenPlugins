import { convertTransaction } from '../../../converters'
import { AccountOrCard, AccountType } from '../../../../../types/zenmoney'

it('keeps a separately posted account fee distinct from the running balance', () => {
  // mail_inbound 201131, build 8, account.history response 6: complete source record.
  // Personal names/account identifiers replaced for master; recorded sums and purposes preserved.
  const record = {
    id: 5,
    date: '2026-10-30 12:25:48',
    correspondent: 'Токмокский филиал ОАО "Бакай банк"',
    corraccount: '6060300000000001',
    purpose: 'Комиссия за ведение счета Иванов Иван Иванович Ип за Сентябрь и Октябрь 2026г',
    balance: 945.95,
    currency: 'KGS',
    operation_amount: -1000,
    operation_currency: 'KGS',
    location: null
  }
  const account: AccountOrCard = { id: 'checking', type: AccountType.checking, title: 'KGS account', instrument: 'KGS', balance: 945.95, syncIds: ['1240180000000001'] }
  expect(convertTransaction(record, account)).toEqual({
    date: new Date('2026-10-30T12:25:48+06:00'),
    hold: null,
    movements: [{ id: null, account: { id: 'checking' }, invoice: null, sum: -1000, fee: 0 }],
    merchant: { title: 'Токмокский филиал ОАО "Бакай банк"', city: null, country: null, mcc: null, location: null },
    comment: 'Комиссия за ведение счета Иванов Иван Иванович Ип за Сентябрь и Октябрь 2026г'
  })
})
