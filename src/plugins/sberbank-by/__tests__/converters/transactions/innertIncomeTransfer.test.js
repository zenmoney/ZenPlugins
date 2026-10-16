import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  const account = {
    id: 'account',
    instrument: 'BYN'
  }
  it.each([
    [
      {
        sourceSystem: 3,
        eventId: '100000057',
        contractId: '1000036',
        contractCurrency: null,
        cardPAN: '411111******2828',
        cardExpiryDate: null,
        cardId: '100000056',
        eventDate: 1586735622000,
        processingDate: null,
        transactionType: 1,
        transactionCode: '313',
        transactionName: 'Перевод BYN на свои карты 411111******2828',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 5.18,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000021',
        authorizationCode: '100020',
        eventStatus: 0,
        mccCode: null,
        errorDescription: null,
        souServiceCode: 313,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000057',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: true,
        date: new Date(1586735622000),
        movements: [
          {
            id: '100000057',
            account: { id: 'account' },
            invoice: null,
            sum: 5.18,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на свои карты 411111******2828',
        groupKeys: ['100000057']
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '100000055',
        contractId: '1000032',
        contractCurrency: null,
        cardPAN: '555555******2929',
        cardExpiryDate: null,
        cardId: '100000058',
        eventDate: 1586735202000,
        processingDate: null,
        transactionType: 1,
        transactionCode: '313',
        transactionName: 'Перевод BYN на свои карты 555555******2929',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 5,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000022',
        authorizationCode: '100021',
        eventStatus: 0,
        mccCode: null,
        errorDescription: null,
        souServiceCode: 313,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000055',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: true,
        date: new Date(1586735202000),
        movements: [
          {
            id: '100000055',
            account: { id: 'account' },
            invoice: null,
            sum: 5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на свои карты 555555******2929',
        groupKeys: ['100000055']
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '100000064',
        contractId: '1000038',
        contractCurrency: null,
        cardPAN: '411111******3434',
        cardExpiryDate: null,
        cardId: '100000065',
        eventDate: 1587136472000,
        processingDate: null,
        transactionType: 1,
        transactionCode: '220',
        transactionName: 'Перевод RUB на свои карты 411111******3434',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 100,
        transactionCurrency: '643',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000023',
        authorizationCode: '100022',
        eventStatus: 0,
        mccCode: null,
        errorDescription: null,
        souServiceCode: 220,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000064',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: true,
        date: new Date(1587136472000),
        movements: [
          {
            id: '100000064',
            account: { id: 'account' },
            invoice: {
              instrument: 'RUB',
              sum: 100
            },
            sum: null,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод RUB на свои карты 411111******3434',
        groupKeys: ['100000064']
      }
    ],
    [
      {
        sourceSystem: 2,
        eventId: '1000000011',
        contractId: '1000039',
        contractCurrency: '933',
        cardPAN: '',
        cardExpiryDate: null,
        cardId: null,
        eventDate: 1649830507000,
        processingDate: 1649797200000,
        transactionType: 1,
        transactionCode: '2',
        transactionName: 'Дополнительный взнос',
        operationCode: '2',
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 19.13,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: null,
        authorizationCode: null,
        eventStatus: 1,
        mccCode: null,
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
        date: new Date('2022-04-13T09:15:07+03:00'),
        movements:
          [
            {
              id: '1000000011',
              account: { id: 'account' },
              invoice: null,
              sum: 19.13,
              fee: 0
            }
          ],
        merchant: null,
        comment: 'Дополнительный взнос',
        groupKeys: ['2022-04-13_BYN_19.13']
      }
    ]
  ])('converts income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
