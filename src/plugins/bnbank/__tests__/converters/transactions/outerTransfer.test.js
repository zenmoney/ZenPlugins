import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        accountNumber: '2000000000000000',
        operationPlace: 'POPOLNENIE KARTY ',
        merchantId: '6012',
        transactionAuthCode: '756342',
        operationDate: 1634108020000,
        transactionAmount: 200,
        transactionCurrency: '933',
        operationAmount: 200,
        operationCurrency: '933',
        operationSign: '1',
        operationType: 6,
        cardPAN: '450000******0000'
      },
      {
        hold: false,
        date: new Date('2021-10-13T06:53:40.000Z'),
        movements: [
          {
            id: '756342',
            account: { id: '2000000000000000' },
            sum: 200,
            fee: 0,
            invoice: null
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'BYN',
              syncIds: null,
              type: 'ccard'
            },
            sum: -200,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      }
    ],
    [
      {
        operationSign: '1',
        operationId: '000000000002',
        accountNumber: '2000000000000000',
        transactionAmount: 415,
        transactionCurrency: '840',
        operationAmount: -1199.35,
        operationCurrency: '933',
        operationName: 'MOBILE APP\nMCC 6537, Поступление P2P перевода',
        transType: 'TO',
        operationDetail: {
          source: '5*** **** **** 6953',
          authCode: '577114',
          mccCode: '6537 - Денежные переводы P2P',
          paymentDate: 1763130787000,
          operationDescription: 'Поступление P2P перевода',
          status: 'PROCESSING',
          terminalLocation: 'ALMATY',
          operationName: 'MOBILE APP\nMCC 6537, Поступление P2P перевода'
        }
      },
      {
        hold: false,
        date: new Date('2025-11-14T17:33:07.000+03:00'),
        movements: [
          {
            id: null,
            account: { id: '2000000000000000' },
            invoice: {
              sum: 415,
              instrument: 'USD'
            },
            sum: 1199.35,
            fee: 0
          },
          {
            id: null,
            account: {
              company: null,
              instrument: 'USD',
              syncIds: null,
              type: 'ccard'
            },
            sum: -415,
            fee: 0,
            invoice: null
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('convert into income transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, [
      {
        id: '2000000000000000',
        instrument: 'BYN',
        syncID: ['2000000000000000']
      }
    ])).toEqual(transaction)
  })
})
