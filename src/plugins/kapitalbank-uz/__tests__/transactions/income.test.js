import {
  convertUzcardCardTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        hpan: '860049***3871',
        utime: 1594792387000,
        udate: 1594792387000,
        terminal: '91100024',
        resp: '-1',
        city: '-',
        reqamt: '2 000 000,00',
        merchant: '90490007772',
        merchantName: 'YASHNABADSKIY FILIAL OAKB',
        reversal: false,
        street: 'Toshkent shahri, Yashnobod tuma',
        credit: true,
        transType: '760',
        utrnno: 8991874667,
        actamt: 200000000
      },
      {
        date: new Date('2020-07-15T05:53:07.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'YASHNABADSKIY FILIAL OAKB',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '8991874667',
            account: { id: 'card' },
            invoice: null,
            sum: 2000000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        hpan: '860049***0108',
        utime: 1635502337000,
        udate: 1635502337000,
        terminal: '92407043',
        resp: '-1',
        city: 'YAKKASAROY TUMANI',
        reqamt: '33 000,00',
        merchant: '90486601',
        merchantName: 'INSPIRED MCHJ QK',
        reversal: true,
        street: 'YAKKASAROY TUMANI BOBUR 22 A',
        credit: false,
        transType: '683',
        utrnno: 12765532109,
        actamt: 3300000
      },
      {
        comment: null,
        date: new Date('2021-10-29T10:12:17.000Z'),
        hold: false,
        merchant:
          {
            country: null,
            city: 'YAKKASAROY TUMANI',
            title: 'INSPIRED MCHJ QK',
            mcc: null,
            location: null
          },
        movements:
          [
            {
              id: '12765532109',
              account: { id: 'card' },
              invoice: null,
              sum: 33000,
              fee: 0
            }
          ]
      }
    ]
  ])('converts income UZS', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertUzcardCardTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
