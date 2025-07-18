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
        eventId: '340525766',
        contractId: '7658726',
        contractCurrency: null,
        cardPAN: '449655******0198',
        cardExpiryDate: null,
        cardId: '789249178',
        eventDate: 1586735622000,
        processingDate: null,
        transactionType: 1,
        transactionCode: '313',
        transactionName: 'Перевод BYN на свои карты 449655******0198',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 5.18,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '122497918000',
        authorizationCode: '133584',
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
        souEventId: '340525766',
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
            id: '340525766',
            account: { id: 'account' },
            invoice: null,
            sum: 5.18,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на свои карты 449655******0198',
        groupKeys: ['340525766']
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '340525746',
        contractId: '8006989',
        contractCurrency: null,
        cardPAN: '543553******6409',
        cardExpiryDate: null,
        cardId: '909696579',
        eventDate: 1586735202000,
        processingDate: null,
        transactionType: 1,
        transactionCode: '313',
        transactionName: 'Перевод BYN на свои карты 543553******6409',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 5,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '122497917431',
        authorizationCode: '134153',
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
        souEventId: '340525746',
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
            id: '340525746',
            account: { id: 'account' },
            invoice: null,
            sum: 5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на свои карты 543553******6409',
        groupKeys: ['340525746']
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '341551482',
        contractId: '8094341',
        contractCurrency: null,
        cardPAN: '449655******8075',
        cardExpiryDate: null,
        cardId: '940519949',
        eventDate: 1587136472000,
        processingDate: null,
        transactionType: 1,
        transactionCode: '220',
        transactionName: 'Перевод RUB на свои карты 449655******8075',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 100,
        transactionCurrency: '643',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '122510429622',
        authorizationCode: '621962',
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
        souEventId: '341551482',
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
            id: '341551482',
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
        comment: 'Перевод RUB на свои карты 449655******8075',
        groupKeys: ['341551482']
      }
    ],
    [
      {
        sourceSystem: 2,
        eventId: '2343225045',
        contractId: '7628284',
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
              id: '2343225045',
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
