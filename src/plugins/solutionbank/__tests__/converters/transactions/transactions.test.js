import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: '00750933012345',
    type: 'card',
    title: 'Visa Virtual*111',
    instrument: 'BYN',
    balance: 99.9,
    syncID: [
      '1111'
    ]
  }

  it('easy transaction', () => {
    const transaction = convertTransaction({
      account_id: '00750933012345',
      currency: 'BYN',
      currencyCode: '933',
      date: new Date('2019-02-14T00:00:00+03:00'),
      merchant: 'BANK RESHENIE- OPLATA USLUG; MINSK;BY',
      operationName: 'Оплата товаров и услуг',
      sum: -1
    })

    expect(transaction).toEqual({
      hold: false,
      date: new Date('2019-02-14T00:00:00+03:00'),
      movements: [
        {
          id: null,
          account: { id: account.id },
          sum: -1,
          invoice: null,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
