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
        eventId: '1000000000000002',
        contractId: '1000003',
        contractCurrency: '933',
        cardPAN: '411111******2222',
        cardExpiryDate: null,
        cardId: '100000004',
        eventDate: 1583945093000,
        processingDate: 1583960400000,
        transactionType: -1,
        transactionCode: '205',
        transactionName: 'Идентификация кошелька "Яндекс.Деньги" в системе Сбербанк Онлайн с использованием БПК 1000003A003XX3',
        operationCode: null,
        merchantId: '0802082',
        merchantName: 'SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 0.01,
        transactionCurrency: '933',
        accountSum: 0.01,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '100000000024',
        authorizationCode: '100023',
        eventStatus: 1,
        mccCode: '4900',
        errorDescription: null,
        souServiceCode: 1380,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000066',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: false,
        date: new Date(1583945093000),
        movements: [
          {
            id: '1000000000000002',
            account: { id: 'account' },
            invoice: null,
            sum: -0.01,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Идентификация кошелька "Яндекс.Деньги" в системе Сбербанк Онлайн с использованием БПК 1000003A003XX3'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '100000067',
        contractId: '1000003',
        contractCurrency: null,
        cardPAN: '411111******2222',
        cardExpiryDate: null,
        cardId: '100000004',
        eventDate: 1583939768000,
        processingDate: null,
        transactionType: -1,
        transactionCode: '1380',
        transactionName: 'Идентификация кошелька "Яндекс.Деньги" в системе Сбербанк Онлайн с использованием БПК 1000003A003XX3',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 0.01,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000025',
        authorizationCode: '100013',
        eventStatus: -1,
        mccCode: null,
        errorDescription: 'Сервер авторизации: KAPTA OGRANICENA',
        souServiceCode: 1380,
        souServiceType: null,
        souServiceName: null,
        souRnnCode: null,
        souAuthorizationCode: null,
        souTransactionSum: null,
        souTransactionCurrency: null,
        souEventId: '100000067',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      null
    ],
    [
      {
        sourceSystem: 1,
        eventId: '1000000000000003',
        contractId: '1000003',
        contractCurrency: '933',
        cardPAN: '411111******2222',
        cardExpiryDate: null,
        cardId: '100000004',
        eventDate: 1583874000000,
        processingDate: 1584133200000,
        transactionType: -1,
        transactionCode: '205',
        transactionName: 'Покупка YM.SERVICES',
        operationCode: null,
        merchantId: '000729920831955',
        merchantName: 'YM.SERVICES',
        merchantPlace: 'MONEY.YANDEX.',
        transactionSum: 1.01,
        transactionCurrency: '643',
        accountSum: 0.02,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: null,
        authorizationCode: '100024',
        eventStatus: 1,
        mccCode: '7299',
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
        date: new Date(1583874000000),
        movements: [
          {
            id: '1000000000000003',
            account: { id: 'account' },
            invoice: {
              instrument: 'RUB',
              sum: -1.01
            },
            sum: -0.02,
            fee: 0
          }
        ],
        merchant: {
          title: 'YM.SERVICES',
          city: null,
          country: null,
          location: null,
          mcc: 7299
        },
        comment: null
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '100000000000000000001',
        contractId: '1000003',
        contractCurrency: null,
        cardPAN: '411111******2222',
        cardExpiryDate: null,
        cardId: '100000004',
        eventDate: 1587983710000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'BLR;Belarus Терминал: 83119177 RRN:100000000026 AuthCode:100025',
        operationCode: null,
        merchantId: '82119100',
        merchantName: null,
        merchantPlace: 'BLR;Belarus',
        transactionSum: -1.5,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000026',
        authorizationCode: '100025',
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
        date: new Date(1587983710000),
        movements: [
          {
            id: '100000000000000000001',
            account: { id: 'account' },
            invoice: null,
            sum: -1.5,
            fee: 0
          }
        ],
        merchant: {
          title: 'Терминал: 83119177',
          location: null,
          mcc: null,
          country: 'Belarus',
          city: null
        },
        comment: null
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '1000000000000000000004',
        contractId: '1000033',
        contractCurrency: null,
        cardPAN: '555555******3535',
        cardExpiryDate: null,
        cardId: '100000068',
        eventDate: 1588096169000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'BLR;Belarus Терминал: WWL90020 RRN:100000000027 AuthCode:100026',
        operationCode: null,
        merchantId: '0802082',
        merchantName: null,
        merchantPlace: 'BLR;Belarus',
        transactionSum: -50,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000027',
        authorizationCode: '100026',
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
        date: new Date(1588096169000),
        movements: [
          {
            id: '1000000000000000000004',
            account: { id: 'account' },
            invoice: null,
            sum: -50,
            fee: 0
          }
        ],
        merchant: {
          title: 'Терминал: WWL90020',
          location: null,
          mcc: null,
          country: 'Belarus',
          city: null
        },
        comment: null
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '1000000000000000000005',
        contractId: '1000033',
        contractCurrency: null,
        cardPAN: '555555******3535',
        cardExpiryDate: null,
        cardId: '100000068',
        eventDate: 1587977742000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'BLR;Belarus Терминал: 703626 RRN:100000000028 AuthCode:100027',
        operationCode: null,
        merchantId: '703626',
        merchantName: null,
        merchantPlace: 'BLR;Belarus',
        transactionSum: -22,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '100000000028',
        authorizationCode: '100027',
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
        date: new Date(1587977742000),
        movements: [
          {
            id: '1000000000000000000005',
            account: { id: 'account' },
            invoice: null,
            sum: -22,
            fee: 0
          }
        ],
        merchant: {
          title: 'Терминал: 703626',
          location: null,
          mcc: null,
          country: 'Belarus',
          city: null
        },
        comment: null
      }
    ],
    [
      {
        sourceSystem: 1,
        eventId: '100000069',
        contractId: '1000040',
        contractCurrency: '933',
        cardPAN: '555555******3636',
        cardExpiryDate: null,
        cardId: '100000070',
        eventDate: 1598116791000,
        processingDate: 1598130000000,
        transactionType: -1,
        transactionCode: '32X',
        transactionName: 'Плата за просмотр баланса ASB BELARUSBANK BR.519 AT',
        operationCode: null,
        merchantId: 'ATM12798',
        merchantName: 'ASB BELARUSBANK BR.519 AT',
        merchantPlace: 'MINSK',
        transactionSum: 0.5,
        transactionCurrency: '933',
        accountSum: 0.5,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '100000000029',
        authorizationCode: '100013',
        eventStatus: 1,
        mccCode: '000',
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
        date: new Date(1598116791000),
        movements: [
          {
            id: '100000069',
            account: { id: 'account' },
            invoice: null,
            sum: -0.5,
            fee: 0
          }
        ],
        merchant: {
          title: 'ASB BELARUSBANK BR.519 AT',
          location: null,
          mcc: null,
          country: null,
          city: null
        },
        comment: 'Плата за просмотр баланса ASB BELARUSBANK BR.519 AT'
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '100000000000000000002',
        contractId: '1000041',
        contractCurrency: null,
        cardPAN: '555555******3737',
        cardExpiryDate: null,
        cardId: '100000071',
        eventDate: 1616051324000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'GOOGLE* GILRAEN LTD > Mountain View USA Терминал: null RRN:100000000030 AuthCode:100028',
        operationCode: null,
        merchantId: '527021000211518',
        merchantName: null,
        merchantPlace: 'GOOGLE* GILRAEN LTD > Mountain View USA',
        transactionSum: -2.17,
        transactionCurrency: '840',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '840',
        rnnCode: '100000000030',
        authorizationCode: '100028',
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
        date: new Date(1616051324000),
        movements: [
          {
            id: '100000000000000000002',
            account: { id: 'account' },
            invoice: {
              instrument: 'USD',
              sum: -2.17
            },
            sum: null,
            fee: 0
          }
        ],
        merchant: {
          title: 'GOOGLE* GILRAEN LTD',
          location: null,
          mcc: null,
          country: 'USA',
          city: 'Mountain View'
        },
        comment: null
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '1000000000000000000006',
        contractId: '1000041',
        contractCurrency: null,
        cardPAN: '555555******3737',
        cardExpiryDate: null,
        cardId: '100000071',
        eventDate: 1616416678000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'NETFLIX.COM > 866-579-7172 NLD Терминал: 00241776 RRN:100000000031 AuthCode:100029',
        operationCode: null,
        merchantId: '241776000557165',
        merchantName: null,
        merchantPlace: 'NETFLIX.COM > 866-579-7172 NLD',
        transactionSum: -12.08,
        transactionCurrency: '840',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '840',
        rnnCode: '100000000031',
        authorizationCode: '100029',
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
        date: new Date(1616416678000),
        movements: [
          {
            id: '1000000000000000000006',
            account: { id: 'account' },
            invoice: {
              instrument: 'USD',
              sum: -12.08
            },
            sum: null,
            fee: 0
          }
        ],
        merchant: {
          title: 'NETFLIX.COM',
          location: null,
          mcc: null,
          country: 'NLD',
          city: '866-579-7172'
        },
        comment: null
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '1000000000000000000007',
        contractId: '1000042',
        contractCurrency: null,
        cardPAN: '555555******3838',
        cardExpiryDate: null,
        cardId: '1000000012',
        eventDate: 1616519584000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'Torgovyy obekt DUBAI > Minsk BLR Терминал: SBO84221 RRN:100000000032 AuthCode:100030',
        operationCode: null,
        merchantId: '0812838',
        merchantName: null,
        merchantPlace: 'Torgovyy obekt DUBAI > Minsk BLR',
        transactionSum: -15.44,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '100000000032',
        authorizationCode: '100030',
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
        date: new Date(1616519584000),
        movements: [
          {
            id: '1000000000000000000007',
            account: { id: 'account' },
            invoice: null,
            sum: -15.44,
            fee: 0
          }
        ],
        merchant: {
          title: 'Torgovyy obekt DUBAI',
          location: null,
          mcc: null,
          country: 'BLR',
          city: 'Minsk'
        },
        comment: null
      }
    ],
    [
      {
        sourceSystem: 1,
        eventId: '1000000013',
        contractId: '1000043',
        contractCurrency: '933',
        cardPAN: '466666******3939',
        cardExpiryDate: null,
        cardId: '1000000014',
        eventDate: 1635800400000,
        processingDate: 1635973200000,
        transactionType: -1,
        transactionCode: '205',
        transactionName: 'Покупка AIRCOMPANY ARMENIA',
        operationCode: null,
        merchantId: '19002576',
        merchantName: 'AIRCOMPANY ARMENIA',
        merchantPlace: 'YEREVAN',
        transactionSum: 205611,
        transactionCurrency: '51',
        accountSum: 1089.76,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '100000000033',
        authorizationCode: '100031',
        eventStatus: 1,
        mccCode: '4722',
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
        date: new Date(1635800400000), // Tue Nov 02 2021 00:00:00 GMT+0300 (MSK),
        movements:
          [
            {
              id: '1000000013',
              account: { id: 'account' },
              invoice: { instrument: 'AMD', sum: -205611 },
              sum: -1089.76,
              fee: 0
            }
          ],
        merchant:
          {
            title: 'AIRCOMPANY ARMENIA',
            city: null,
            country: null,
            location: null,
            mcc: 4722
          },
        comment: null
      }
    ]
  ])('converts outcome transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
