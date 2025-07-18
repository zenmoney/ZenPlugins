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
        eventId: '2004250790079371',
        contractId: '7987935',
        contractCurrency: '643',
        cardPAN: '449655******4870',
        cardExpiryDate: null,
        cardId: '781375964',
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
        authorizationCode: '085116',
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
            id: '2004250790079371',
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
        eventId: '191915455',
        contractId: '7431439',
        contractCurrency: '933',
        cardPAN: '449655******7688',
        cardExpiryDate: null,
        cardId: '722444271',
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
        rnnCode: '029716362517',
        authorizationCode: '194081',
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
            id: '191915455',
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
