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
        eventId: '100000072',
        contractId: '1000044',
        contractCurrency: null,
        cardPAN: '411111******4040',
        cardExpiryDate: null,
        cardId: '100000073',
        eventDate: 1579184312000,
        processingDate: null,
        transactionType: 0,
        transactionCode: '656',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 544444******4141',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 32,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000034',
        authorizationCode: '100032',
        eventStatus: 0,
        mccCode: null,
        errorDescription: null,
        souServiceCode: 656,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000072',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: true,
        date: new Date(1579184312000),
        movements: [
          {
            id: '100000072',
            account: { id: 'account' },
            invoice: null,
            sum: -32,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['4141']
            },
            invoice: null,
            sum: 32,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 544444******4141'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '100000074',
        contractId: '1000033',
        contractCurrency: null,
        cardPAN: '555555******3535',
        cardExpiryDate: null,
        cardId: '100000068',
        eventDate: 1588096168000,
        processingDate: null,
        transactionType: -1,
        transactionCode: '4408561',
        transactionName: 'Пополнение вклада 100000083',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 50,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000035',
        authorizationCode: '100026',
        eventStatus: 0,
        mccCode: null,
        errorDescription: null,
        souServiceCode: 4408561,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000074',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: true
      },
      {
        hold: true,
        date: new Date(1588096168000),
        movements: [
          {
            id: '100000074',
            account: { id: 'account' },
            invoice: null,
            sum: -50,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'checking',
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 50,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Пополнение вклада 100000083'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '100000075',
        contractId: '1000045',
        contractCurrency: null,
        cardPAN: '411111******4242',
        cardExpiryDate: null,
        cardId: '100000076',
        eventDate: 1581261100000,
        processingDate: null,
        transactionType: 0,
        transactionCode: '656',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 533333******4343',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 507.5,
        transactionCurrency: '978',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000036',
        authorizationCode: '100033',
        eventStatus: 0,
        mccCode: null,
        errorDescription: null,
        souServiceCode: 656,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000075',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: true,
        date: new Date(1581261100000),
        movements: [
          {
            id: '100000075',
            account: { id: 'account' },
            invoice: {
              instrument: 'EUR',
              sum: -507.5
            },
            sum: null,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'EUR',
              company: null,
              syncIds: ['4343']
            },
            invoice: null,
            sum: 507.5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 533333******4343'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '10000006',
        contractId: '1000046',
        contractCurrency: '840',
        cardPAN: '411111******4545',
        cardExpiryDate: null,
        cardId: '100000077',
        eventDate: 1593711351000,
        processingDate: 1593723600000,
        transactionType: -1,
        transactionCode: '205',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 411111******4646',
        operationCode: null,
        merchantId: '0822061',
        merchantName: 'USL 369 SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 102,
        transactionCurrency: '978',
        accountSum: 42.59,
        commissionSum: null,
        commissionCurrency: '840',
        rnnCode: '100000000037',
        authorizationCode: '100034',
        eventStatus: 1,
        mccCode: '6012',
        errorDescription: null,
        souServiceCode: 656,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000078',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: false,
        date: new Date(1593711351000),
        movements: [
          {
            id: '10000006',
            account: { id: 'account' },
            invoice: {
              instrument: 'EUR',
              sum: -102
            },
            sum: -42.59,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'EUR',
              company: null,
              syncIds: ['4646']
            },
            invoice: null,
            sum: 102,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 411111******4646'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '10000007',
        contractId: '1000047',
        contractCurrency: '933',
        cardPAN: '411111******4747',
        cardExpiryDate: null,
        cardId: '100000079',
        eventDate: 1594814489000,
        processingDate: 1594846800000,
        transactionType: 1,
        transactionCode: '206',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 411111******4747',
        operationCode: null,
        merchantId: '0822061',
        merchantName: 'USL 369 SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 110,
        transactionCurrency: '933',
        accountSum: 110,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '100000000038',
        authorizationCode: '100035',
        eventStatus: 1,
        mccCode: '6012',
        errorDescription: null,
        souServiceCode: 1423,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000080',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: false,
        date: new Date(1594814489000),
        movements: [
          {
            id: '10000007',
            account: { id: 'account' },
            invoice: null,
            sum: 110,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 411111******4747'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '10000008',
        contractId: '1000048',
        contractCurrency: '933',
        cardPAN: '411111******4848',
        cardExpiryDate: null,
        cardId: '100000081',
        eventDate: 1593982800000,
        processingDate: 1593723600000,
        transactionType: 1,
        transactionCode: '225',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 555555******4949',
        operationCode: null,
        merchantId: '0822061',
        merchantName: 'USL 369 SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 79,
        transactionCurrency: '933',
        accountSum: 79,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '100000000039',
        authorizationCode: '100036',
        eventStatus: 1,
        mccCode: '6012',
        errorDescription: null,
        souServiceCode: 1423,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000082',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: false,
        date: new Date(1593982800000),
        movements: [
          {
            id: '10000008',
            account: { id: 'account' },
            invoice: null,
            sum: 79,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 555555******4949'
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '10000000000000000000001',
        contractId: '1000042',
        contractCurrency: null,
        cardPAN: '555555******3838',
        cardExpiryDate: null,
        cardId: '1000000012',
        eventDate: 1616508629000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000P',
        transactionName: 'P2P SOU BPS-Sberbank > Minsk BLR Терминал: W2P90020 RRN:100000000040 AuthCode:100037',
        operationCode: null,
        merchantId: '0822061',
        merchantName: null,
        merchantPlace: 'P2P SOU BPS-Sberbank > Minsk BLR',
        transactionSum: 300,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '100000000040',
        authorizationCode: '100037',
        eventStatus: 0,
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
        hold: true,
        date: new Date(1616508629000),
        movements: [
          {
            id: '10000000000000000000001',
            account: { id: 'account' },
            invoice: null,
            sum: -300,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 300,
            fee: 0
          }
        ],
        merchant: {
          title: 'P2P SOU BPS-Sberbank',
          location: null,
          mcc: null,
          country: 'BLR',
          city: 'Minsk'
        },
        comment: null
      }
    ]
  ])('converts outer transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
