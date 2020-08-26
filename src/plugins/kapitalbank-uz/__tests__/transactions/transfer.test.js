import {
  convertUzcardCardTransaction,
  convertHumoCardTransaction,
  convertVisaCardTransaction
} from '../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        hpan: '626247***4287',
        utime: 1594710157000,
        udate: 1594710157000,
        terminal: '97006284',
        resp: '-1',
        city: 'Toshkent',
        reqamt: '15 000,00',
        merchant: '903122724',
        merchantName: 'P2P ALOQAMOBILE 2 HUMO 0',
        reversal: false,
        street: 'tinchlik kfi iyk ota 19',
        credit: false,
        transType: '683',
        utrnno: 8986298065,
        actamt: 1500000
      },
      {
        date: new Date('2020-07-14T07:02:37.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: 'Toshkent',
          title: 'P2P ALOQAMOBILE 2 HUMO 0',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '8986298065',
            account: { id: 'card' },
            invoice: null,
            sum: -15000.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'UZS',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 15000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        hpan: '860013***4287',
        utime: 1580539103000,
        udate: 1580539103000,
        terminal: '92000056',
        resp: '-1',
        city: '',
        reqamt: '248 506,00',
        merchant: '901324875',
        merchantName: 'CLICK P2P  888',
        reversal: false,
        street: 'Toshkent shakhar Nukus kuchasi',
        credit: true,
        transType: '760',
        utrnno: 8080582889,
        actamt: 24850600
      },
      {
        date: new Date('2020-02-01T06:38:23.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'CLICK P2P  888',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: '8080582889',
            account: { id: 'card' },
            invoice: null,
            sum: 248506.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'UZS',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -248506.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to card UZS', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertUzcardCardTransaction(card, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        transDate: 1593696095000,
        amount: '5.00',
        merchantName: 'АКБ "Капиталбанк"',
        transType: 'Пополнение карты',
        fee: '0.00',
        currency: { name: 'USD', scale: 2 },
        approvalCode: '000000',
        back: true,
        transCode: '110',
        reversed: false,
        transAmount: '5.00',
        transCurrency: 'USD',
        conversionRate: '1'
      },
      {
        date: new Date('2020-07-02T13:21:35.000Z'),
        hold: false,
        comment: 'Пополнение карты',
        merchant: null,
        movements: [
          {
            id: null,
            account: { id: 'card' },
            invoice: null,
            sum: 5.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'USD',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -5.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        transDate: 1593696106000,
        amount: '19.99',
        merchantName: 'АКБ "Капиталбанк"',
        transType: 'Получение средств (P2P)',
        fee: '0.00',
        currency: { name: 'USD', scale: 2 },
        approvalCode: '000000',
        back: true,
        transCode: '11M',
        reversed: false,
        transAmount: '19.99',
        transCurrency: 'USD',
        conversionRate: '1'
      },
      {
        date: new Date('2020-07-02T13:21:46.000Z'),
        hold: false,
        comment: 'Получение средств (P2P)',
        merchant: null,
        movements: [
          {
            id: null,
            account: { id: 'card' },
            invoice: null,
            sum: 19.99,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'USD',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -19.99,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to card VISA', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'USD' }
    expect(convertVisaCardTransaction(card, rawTransaction)).toEqual(transaction)
  })

  it.each([
    [
      {
        transDate: 1594710160000,
        amount: '15 000,00',
        merchantName: 'POPOL P2P ALQ UZCARD 2 HUMO',
        transType: 'Входящий перевод',
        fee: '0,00',
        currency: { name: 'UZS', scale: 2 },
        reversed: false
      },
      {
        date: new Date('2020-07-14T07:02:40.000Z'),
        hold: false,
        comment: 'Входящий перевод',
        merchant: {
          country: null,
          city: null,
          title: 'POPOL P2P ALQ UZCARD 2 HUMO',
          mcc: null,
          location: null
        },
        movements: [
          {
            id: null,
            account: { id: 'card' },
            invoice: null,
            sum: 15000.00,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'card',
              instrument: 'UZS',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -15000.00,
            fee: 0
          }
        ]
      }
    ]
  ])('converts transfer to card HUMO', (rawTransaction, transaction) => {
    const card = { id: 'card', instrument: 'UZS' }
    expect(convertHumoCardTransaction(card, rawTransaction)).toEqual(transaction)
  })
})
