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
        eventId: '2003110746247248',
        contractId: '8013742',
        contractCurrency: '933',
        cardPAN: '449655******3289',
        cardExpiryDate: null,
        cardId: '911702357',
        eventDate: 1583945093000,
        processingDate: 1583960400000,
        transactionType: -1,
        transactionCode: '205',
        transactionName: 'Идентификация кошелька "Яндекс.Деньги" в системе Сбербанк Онлайн с использованием БПК 3041291C031PB6',
        operationCode: null,
        merchantId: '0802082',
        merchantName: 'SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 0.01,
        transactionCurrency: '933',
        accountSum: 0.01,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '122422701320',
        authorizationCode: '350264',
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
        souEventId: '335575707',
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
            id: '2003110746247248',
            account: { id: 'account' },
            invoice: null,
            sum: -0.01,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Идентификация кошелька "Яндекс.Деньги" в системе Сбербанк Онлайн с использованием БПК 3041291C031PB6'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '335557495',
        contractId: '8013742',
        contractCurrency: null,
        cardPAN: '449655******3289',
        cardExpiryDate: null,
        cardId: '911702357',
        eventDate: 1583939768000,
        processingDate: null,
        transactionType: -1,
        transactionCode: '1380',
        transactionName: 'Идентификация кошелька "Яндекс.Деньги" в системе Сбербанк Онлайн с использованием БПК 3041291C031PB6',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 0.01,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '122422461060',
        authorizationCode: '000000',
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
        souEventId: '335557495',
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
        eventId: '2003140748960659',
        contractId: '8013742',
        contractCurrency: '933',
        cardPAN: '449655******3289',
        cardExpiryDate: null,
        cardId: '911702357',
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
        authorizationCode: '345346',
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
            id: '2003140748960659',
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
        eventId: '528021150011810088941',
        contractId: '8013742',
        contractCurrency: null,
        cardPAN: '449655******3289',
        cardExpiryDate: null,
        cardId: '911702357',
        eventDate: 1587983710000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'BLR;Belarus Терминал: 83119177 RRN:011810088941 AuthCode:528021',
        operationCode: null,
        merchantId: '82119100',
        merchantName: null,
        merchantPlace: 'BLR;Belarus',
        transactionSum: -1.5,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '011810088941',
        authorizationCode: '528021',
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
            id: '528021150011810088941',
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
        eventId: '5393705000011983302905',
        contractId: '6106312',
        contractCurrency: null,
        cardPAN: '543553******6029',
        cardExpiryDate: null,
        cardId: '436148424',
        eventDate: 1588096169000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'BLR;Belarus Терминал: WWL90020 RRN:011983302905 AuthCode:539370',
        operationCode: null,
        merchantId: '0802082',
        merchantName: null,
        merchantPlace: 'BLR;Belarus',
        transactionSum: -50,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '011983302905',
        authorizationCode: '539370',
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
            id: '5393705000011983302905',
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
        eventId: '5393672200000685757637',
        contractId: '6106312',
        contractCurrency: null,
        cardPAN: '543553******6029',
        cardExpiryDate: null,
        cardId: '436148424',
        eventDate: 1587977742000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'BLR;Belarus Терминал: 703626 RRN:000685757637 AuthCode:539367',
        operationCode: null,
        merchantId: '703626',
        merchantName: null,
        merchantPlace: 'BLR;Belarus',
        transactionSum: -22,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '000685757637',
        authorizationCode: '539367',
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
            id: '5393672200000685757637',
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
        eventId: '126644409',
        contractId: '7041733',
        contractCurrency: '933',
        cardPAN: '543553******4820',
        cardExpiryDate: null,
        cardId: '615457575',
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
        rnnCode: '000126644409',
        authorizationCode: '000000',
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
            id: '126644409',
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
        eventId: '333956217107709436574',
        contractId: '7825977',
        contractCurrency: null,
        cardPAN: '543553******8438',
        cardExpiryDate: null,
        cardId: '845220728',
        eventDate: 1616051324000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'GOOGLE* GILRAEN LTD > Mountain View USA Терминал: null RRN:107709436574 AuthCode:333956',
        operationCode: null,
        merchantId: '527021000211518',
        merchantName: null,
        merchantPlace: 'GOOGLE* GILRAEN LTD > Mountain View USA',
        transactionSum: -2.17,
        transactionCurrency: '840',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '840',
        rnnCode: '107709436574',
        authorizationCode: '333956',
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
            id: '333956217107709436574',
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
        eventId: '3339621208108165652718',
        contractId: '7825977',
        contractCurrency: null,
        cardPAN: '543553******8438',
        cardExpiryDate: null,
        cardId: '845220728',
        eventDate: 1616416678000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'NETFLIX.COM > 866-579-7172 NLD Терминал: 00241776 RRN:108165652718 AuthCode:333962',
        operationCode: null,
        merchantId: '241776000557165',
        merchantName: null,
        merchantPlace: 'NETFLIX.COM > 866-579-7172 NLD',
        transactionSum: -12.08,
        transactionCurrency: '840',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '840',
        rnnCode: '108165652718',
        authorizationCode: '333962',
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
            id: '3339621208108165652718',
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
        eventId: '6625491544108283871040',
        contractId: '5449238',
        contractCurrency: null,
        cardPAN: '543553******0710',
        cardExpiryDate: null,
        cardId: '1030186865',
        eventDate: 1616519584000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000R',
        transactionName: 'Torgovyy obekt DUBAI > Minsk BLR Терминал: SBO84221 RRN:108283871040 AuthCode:662549',
        operationCode: null,
        merchantId: '0812838',
        merchantName: null,
        merchantPlace: 'Torgovyy obekt DUBAI > Minsk BLR',
        transactionSum: -15.44,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '108283871040',
        authorizationCode: '662549',
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
            id: '6625491544108283871040',
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
        eventId: '2927027441',
        contractId: '7653839',
        contractCurrency: '933',
        cardPAN: '463903******7815',
        cardExpiryDate: null,
        cardId: '1251581036',
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
        rnnCode: '002927027441',
        authorizationCode: '977619',
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
              id: '2927027441',
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
