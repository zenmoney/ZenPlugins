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
    ]
  ])('converts outcome UZS', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertUzcardCardTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
