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
        eventId: 'incoming-p2p-event',
        contractId: 'account-contract',
        contractCurrency: '933',
        cardPAN: '111111******2222',
        cardExpiryDate: null,
        cardId: 'card-id',
        eventDate: 1778918001000,
        processingDate: 1778965200000,
        transactionType: 1,
        transactionCode: '206',
        transactionName: 'Зачисление по услуге Перевод BYN на "чужие" карты в пределах Сбер Банка 111111******2222',
        operationCode: null,
        merchantId: '0822061',
        merchantName: 'P2P SOU Sber Bank',
        merchantPlace: 'Minsk',
        transactionSum: 30.0,
        transactionCurrency: '933',
        accountSum: 30.0,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '600000000001',
        authorizationCode: '111111',
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
        souEventId: 'incoming-sou-event',
        qrPaymentId: null,
        fileId: null,
        printDocs: null,
        payAvailable: false
      },
      {
        hold: false,
        date: new Date(1778918001000),
        movements: [
          {
            id: 'incoming-p2p-event',
            account: { id: 'account' },
            invoice: null,
            sum: 30.0,
            fee: 0
          }
        ],
        merchant: {
          title: 'P2P SOU Sber Bank',
          city: null,
          country: null,
          location: null,
          mcc: 6012
        },
        comment: 'Зачисление по услуге Перевод BYN на "чужие" карты в пределах Сбер Банка 111111******2222'
      }
    ],
    [
      {
        sourceSystem: 2,
        eventId: '1842095258',
        contractId: '8013742',
        contractCurrency: '933',
        cardPAN: '',
        cardExpiryDate: null,
        cardId: null,
        eventDate: 1583940248000,
        processingDate: 1583874000000,
        transactionType: 1,
        transactionCode: '113',
        transactionName: 'Зачисление других сумм Открытое акционерное общество "БПС-Сбербанк УНП 100219673"',
        operationCode: '2',
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 2.0,
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
        date: new Date(1583940248000),
        movements: [
          {
            id: '1842095258',
            account: { id: 'account' },
            invoice: null,
            sum: 2.0,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Зачисление других сумм Открытое акционерное общество "БПС-Сбербанк УНП 100219673"'
      }
    ],
    [
      {
        sourceSystem: 2,
        eventId: '1870017757',
        contractId: '6106312',
        contractCurrency: '933',
        cardPAN: '',
        cardExpiryDate: null,
        cardId: null,
        eventDate: 1587715482000,
        processingDate: 1587675600000,
        transactionType: 1,
        transactionCode: '113',
        transactionName: 'Зачисление выплат, входящих в ФЗП ТРАНСПОРТНОЕ РЕСПУБЛИКАНСКОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ "ГОМЕЛЬСКОЕ ОТДЕЛЕНИЕ БЕЛОРУССКОЙ ЖЕЛЕЗНОЙ ДОРОГИ" УНП 400052406',
        operationCode: '2',
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 419.61,
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
        date: new Date(1587715482000),
        movements: [
          {
            id: '1870017757',
            account: { id: 'account' },
            invoice: null,
            sum: 419.61,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Зачисление выплат, входящих в ФЗП ТРАНСПОРТНОЕ РЕСПУБЛИКАНСКОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ "ГОМЕЛЬСКОЕ ОТДЕЛЕНИЕ БЕЛОРУССКОЙ ЖЕЛЕЗНОЙ ДОРОГИ" УНП 400052406'
      }
    ],
    [
      {
        sourceSystem: 2,
        eventId: '1872122531',
        contractId: '7321475',
        contractCurrency: '933',
        cardPAN: '',
        cardExpiryDate: null,
        cardId: null,
        eventDate: 1588211234000,
        processingDate: 1588194000000,
        transactionType: 0,
        transactionCode: '1001',
        transactionName: 'Капитализация по До востребования',
        operationCode: '1001',
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 0,
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
      null
    ],
    [
      {
        sourceSystem: 1,
        eventId: '51493927',
        contractId: '5364992',
        contractCurrency: '933',
        cardPAN: '543553******5216',
        cardExpiryDate: null,
        cardId: '974159866',
        eventDate: 1592031834000,
        processingDate: 1591995600000,
        transactionType: -1,
        transactionCode: '12P',
        transactionName: 'null Плата null за nullсмену PIN-кода null',
        operationCode: null,
        merchantId: 'PINSETUP',
        merchantName: null,
        merchantPlace: null,
        transactionSum: 2.5,
        transactionCurrency: '933',
        accountSum: 2.5,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '000051493927',
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
        date: new Date(1592031834000),
        movements: [
          {
            id: '51493927',
            account: { id: 'account' },
            invoice: null,
            sum: -2.5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Плата за смену PIN-кода'
      }
    ]
  ])('converts income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
