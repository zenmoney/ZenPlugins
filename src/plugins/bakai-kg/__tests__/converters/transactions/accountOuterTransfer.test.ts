import { convertTransaction } from '../../../converters'
import { AccountOrCard, AccountType } from '../../../../../types/zenmoney'

it('preserves the recorded clearing transfer and its tax purpose', () => {
  // mail_inbound 201131, build 8, account.history response 6: complete source record.
  // Personal names/account identifiers replaced for master; recorded sums and purposes preserved.
  const record = {
    id: 2,
    date: '2026-10-28 10:00:34',
    correspondent: 'УГНС по г. Токмок',
    corraccount: '1241110000000001',
    purpose: 'Перевод клиринг,согл.п.п.10 от 2026.10.27, Оплата налога за Октябрь 2026,УГНС по г. Токмок',
    balance: 970.5,
    currency: 'KGS',
    operation_amount: -11022,
    operation_currency: 'KGS',
    location: null
  }
  const account: AccountOrCard = { id: 'checking', type: AccountType.checking, title: 'KGS account', instrument: 'KGS', balance: 945.95, syncIds: ['1240180000000001'] }
  expect(convertTransaction(record, account)).toEqual({
    date: new Date('2026-10-28T10:00:34+06:00'),
    hold: null,
    movements: [{ id: null, account: { id: 'checking' }, invoice: null, sum: -11022, fee: 0 }, { id: null, account: { type: null, instrument: 'KGS', company: null, syncIds: ['1241110000000001'] }, invoice: null, sum: 11022, fee: 0 }],
    merchant: { title: 'УГНС по г. Токмок', city: null, country: null, mcc: null, location: null },
    comment: 'Перевод клиринг,согл.п.п.10 от 2026.10.27, Оплата налога за Октябрь 2026,УГНС по г. Токмок'
  })
})
