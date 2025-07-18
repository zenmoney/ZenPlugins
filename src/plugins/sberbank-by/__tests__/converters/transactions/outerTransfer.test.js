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
        eventId: '326776225',
        contractId: '7443073',
        contractCurrency: null,
        cardPAN: '449655******4664',
        cardExpiryDate: null,
        cardId: '712203896',
        eventDate: 1579184312000,
        processingDate: null,
        transactionType: 0,
        transactionCode: '656',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 547087******0521',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 32,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '122282653135',
        authorizationCode: '568851',
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
        souEventId: '326776225',
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
            id: '326776225',
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
              syncIds: ['0521']
            },
            invoice: null,
            sum: 32,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 547087******0521'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '343436884',
        contractId: '6106312',
        contractCurrency: null,
        cardPAN: '543553******6029',
        cardExpiryDate: null,
        cardId: '436148424',
        eventDate: 1588096168000,
        processingDate: null,
        transactionType: -1,
        transactionCode: '4408561',
        transactionName: 'Пополнение вклада 218271833',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 50,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '011993113038',
        authorizationCode: '539370',
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
        souEventId: '343436884',
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
            id: '343436884',
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
        comment: 'Пополнение вклада 218271833'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '330271258',
        contractId: '7461149',
        contractCurrency: null,
        cardPAN: '449655******6105',
        cardExpiryDate: null,
        cardId: '732299433',
        eventDate: 1581261100000,
        processingDate: null,
        transactionType: 0,
        transactionCode: '656',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 535104******7634',
        operationCode: null,
        merchantId: null,
        merchantName: null,
        merchantPlace: null,
        transactionSum: 507.5,
        transactionCurrency: '978',
        accountSum: null,
        commissionSum: null,
        commissionCurrency: null,
        rnnCode: '122340440776',
        authorizationCode: '356489',
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
        souEventId: '330271258',
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
            id: '330271258',
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
              syncIds: ['7634']
            },
            invoice: null,
            sum: 507.5,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 535104******7634'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '73652236',
        contractId: '7213990',
        contractCurrency: '840',
        cardPAN: '449655******3315',
        cardExpiryDate: null,
        cardId: '656646861',
        eventDate: 1593711351000,
        processingDate: 1593723600000,
        transactionType: -1,
        transactionCode: '205',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 449655******6523',
        operationCode: null,
        merchantId: '0822061',
        merchantName: 'USL 369 SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 102,
        transactionCurrency: '978',
        accountSum: 42.59,
        commissionSum: null,
        commissionCurrency: '840',
        rnnCode: '018483518316',
        authorizationCode: '256709',
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
        souEventId: '353431327',
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
            id: '73652236',
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
              syncIds: ['6523']
            },
            invoice: null,
            sum: 102,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 449655******6523'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '86441347',
        contractId: '5468414',
        contractCurrency: '933',
        cardPAN: '449655******1474',
        cardExpiryDate: null,
        cardId: '693126322',
        eventDate: 1594814489000,
        processingDate: 1594846800000,
        transactionType: 1,
        transactionCode: '206',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 449655******1474',
        operationCode: null,
        merchantId: '0822061',
        merchantName: 'USL 369 SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 110,
        transactionCurrency: '933',
        accountSum: 110,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '019783890623',
        authorizationCode: '509500',
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
        souEventId: '355079860',
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
            id: '86441347',
            account: { id: 'account' },
            invoice: null,
            sum: 110,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['1474']
            },
            invoice: null,
            sum: -110,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 449655******1474'
      }
    ],
    [
      {
        sourceSystem: 3,
        eventId: '73503202',
        contractId: '6648369',
        contractCurrency: '933',
        cardPAN: '449655******8859',
        cardExpiryDate: null,
        cardId: '525792235',
        eventDate: 1593982800000,
        processingDate: 1593723600000,
        transactionType: 1,
        transactionCode: '225',
        transactionName: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 543553******6492',
        operationCode: null,
        merchantId: '0822061',
        merchantName: 'USL 369 SOU BPS-Sberbank',
        merchantPlace: 'Minsk',
        transactionSum: 79,
        transactionCurrency: '933',
        accountSum: 79,
        commissionSum: null,
        commissionCurrency: '933',
        rnnCode: '018483499227',
        authorizationCode: '278205',
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
        souEventId: '353412335',
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
            id: '73503202',
            account: { id: 'account' },
            invoice: null,
            sum: 79,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['6492']
            },
            invoice: null,
            sum: -79,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Перевод BYN на "чужие" карты в пределах БПС-Сбербанка 543553******6492'
      }
    ],
    [
      {
        sourceSystem: 4,
        eventId: '66254730000108283831953',
        contractId: '5449238',
        contractCurrency: null,
        cardPAN: '543553******0710',
        cardExpiryDate: null,
        cardId: '1030186865',
        eventDate: 1616508629000,
        processingDate: null,
        transactionType: null,
        transactionCode: '01000P',
        transactionName: 'P2P SOU BPS-Sberbank > Minsk BLR Терминал: W2P90020 RRN:108283831953 AuthCode:662547',
        operationCode: null,
        merchantId: '0822061',
        merchantName: null,
        merchantPlace: 'P2P SOU BPS-Sberbank > Minsk BLR',
        transactionSum: 300,
        transactionCurrency: '933',
        accountSum: null,
        commissionSum: 0,
        commissionCurrency: '933',
        rnnCode: '108283831953',
        authorizationCode: '662547',
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
            id: '66254730000108283831953',
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
