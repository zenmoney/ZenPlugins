import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'RUB'
  }
  it.each([
    [
      {
        sourceSystem: 1,
        eventId: '1000000000000001',
        contractId: '1000029',
        contractCurrency: '643',
        cardPAN: '411111******1616',
        cardExpiryDate: null,
        cardId: '100000045',
        eventDate: 1587502800000,
        processingDate: 1587762000000,
        transactionType: -1,
        transactionCode: '207',
        transactionName: 'Снятие наличности ATMALF GR106 KUPALY',
        operationCode: null,
        merchantId: '000027090106',
        merchantName: 'ATMALF GR106 KUPALY',
        merchantPlace: 'GRODNO',
        transactionSum: 10,
        transactionCurrency: '933',
        accountSum: 315.46,
        commissionSum: 12.62,
        commissionCurrency: '643',
        rnnCode: null,
        authorizationCode: '100001',
        eventStatus: 1,
        mccCode: '6011',
        errorDescription: null,
        souServiceCode: null,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: null,
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: false,
        date: new Date(1587502800000),
        movements: [
          {
            id: '1000000000000001',
            account: { id: 'account' },
            invoice: {
              sum: -10,
              instrument: 'BYN'
            },
            sum: -315.46,
            fee: -12.62
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 10,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Снятие наличности ATMALF GR106 KUPALY'
      }
    ]
  ])('converts cash transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })

  const bynAccount = {
    id: 'account',
    instrument: 'BYN'
  }
  it.each([
    [
      {
        sourceSystem: 1,
        eventId: '100000046',
        contractId: '1000030',
        contractCurrency: '933',
        cardPAN: '411111******1717',
        cardExpiryDate: null,
        cardId: '100000047',
        eventDate: 1603470741000,
        processingDate: 1603486800000,
        transactionType: 1,
        transactionCode: '227',
        transactionName: 'Снятие наличности отозвана TORGOVY KOMPLEKS BR.612 ATM',
        operationCode: null,
        merchantId: '0015214',
        merchantName: 'TORGOVY KOMPLEKS BR.612 ATM',
        merchantPlace: 'ZHODINO',
        transactionSum: 100,
        transactionCurrency: '933',
        accountSum: 100,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '100000000001',
        authorizationCode: '100002',
        eventStatus: 1,
        mccCode: '6011',
        errorDescription: null,
        souServiceCode: null,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: null,
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: false,
        date: new Date(1603470741000),
        movements: [
          {
            id: '100000046',
            account: { id: 'account' },
            invoice: null,
            sum: 100,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -100,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Снятие наличности отозвана TORGOVY KOMPLEKS BR.612 ATM'
      }
    ]
  ])('converts cash transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, bynAccount)).toEqual(transaction)
  })
})
