import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'Зачисление заработной платы',
        transactionDate: 1625825520000,
        operationDate: 1625825520000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 752.5,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 2,
        clientName: 'Николаев Николай Николаевич',
        salaryOrganizationUNP: '810000679',
        salaryOrganizationName: '"ВЕЗА-Г" ИНОСТРАННОЕ ПРОИЗВОДСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ',
        operationClosingBalance: 752.5,
        operationCode: 2
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-07-09T10:12:00.000Z'),
        movements: [
          {
            id: '00993d2d0f727cb2b4d367210ef19ddf',
            account: { id: '5020028311' },
            invoice: null,
            sum: 752.5,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: '"ВЕЗА-Г" ИНОСТРАННОЕ ПРОИЗВОДСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ',
          mcc: null,
          location: null
        },
        comment: 'Зачисление заработной платы'
      }
    ],
    [
      {
        operationName: 'Перевод средств(прочие)',
        transactionDate: 1627993020000,
        operationDate: 1627993020000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 146.61,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 2,
        clientName: 'Николаев Николай Николаевич',
        salaryOrganizationUNP: '810000679',
        salaryOrganizationName: '"ВЕЗА-Г" ИНОСТРАННОЕ ПРОИЗВОДСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ',
        operationClosingBalance: 146.83,
        operationCode: 2
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-08-03T12:17:00.000Z'),
        movements: [
          {
            id: '3bfbeb7ea7378e240a585e466c8cd5fa',
            account: { id: '5020028311' },
            invoice: null,
            sum: 146.61,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: '"ВЕЗА-Г" ИНОСТРАННОЕ ПРОИЗВОДСТВЕННОЕ УНИТАРНОЕ ПРЕДПРИЯТИЕ',
          mcc: null,
          location: null
        },
        comment: 'Перевод средств(прочие)'
      }
    ],
    [
      {
        operationName: 'On-line пополнение договора(счета) другим лицом с карты Банка',
        transactionDate: 1610304900000,
        operationDate: 1610304900000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 100,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 2,
        clientName: 'Николаев Николай Николаевич',
        operationClosingBalance: 2967.3,
        operationCode: 2
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-01-10T18:55:00.000Z'),
        movements: [
          {
            id: '4b9a987748e7724ba4797dfccfcdb407',
            account: { id: '5020028311' },
            invoice: null,
            sum: 100,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Николаев Николай Николаевич',
          mcc: null,
          location: null
        },
        comment: 'On-line пополнение договора(счета) другим лицом с карты Банка'
      }
    ],
    [
      {
        operationName: 'Процент от суммы оплаты товаров (работ, услуг) при использовании банковских платежных карточек для оплаты товаров (работ, услуг) согласно Тарифам комиссионного вознаграждения (ставок платы за осуществление банковских и иных операций) Банка Дабрабыт',
        transactionDate: 1633508760000,
        operationDate: 1633508760000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 17.03,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 33,
        operationClosingBalance: 3261.58,
        operationCode: 91
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-10-06T08:26:00.000Z'),
        movements: [
          {
            id: '20acd2c6859262f47c012eb1b771d898',
            account: { id: '5020028311' },
            invoice: null,
            sum: 17.03,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Процент от суммы оплаты товаров (работ, услуг) при использовании банковских платежных карточек для оплаты товаров (работ, услуг) согласно Тарифам комиссионного вознаграждения (ставок платы за осуществление банковских и иных операций) Банка Дабрабыт'
      }
    ],
    [
      {
        operationName: 'Капитализация (%% тек.периода ко вкладу)',
        transactionDate: 1633018800000,
        operationDate: 1633018800000,
        transactionAmount: 0,
        transactionCurrency: 'BYN',
        operationAmount: 1.04,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 19,
        clientName: 'Николаев Николай Николаевич',
        operationClosingBalance: 192.81,
        operationCode: 999
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-09-30T16:20:00.000Z'),
        movements: [
          {
            id: '4e209b9c3daa3bff92b73b9776b55a57',
            account: { id: '5020028311' },
            invoice: null,
            sum: 1.04,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Капитализация (%% тек.периода ко вкладу)'
      }
    ],
    [
      {
        operationName: 'Возврат (refund)',
        operationPlace: 'KORONAPAY2CARD WA',
        merchantId: '0523I052312',
        transactionAuthCode: '252891',
        transactionDate: 1626346740000,
        operationDate: 1626210000000,
        mcc: '6012',
        transactionAmount: 1284,
        transactionCurrency: 'BYN',
        operationAmount: 1284,
        operationCurrency: 'BYN',
        operationSign: '1',
        actionGroup: 1802,
        operationClosingBalance: 1386.49,
        cardPAN: '4214879003476083',
        operationCode: 2
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-07-13T21:00:00.000Z'),
        movements: [
          {
            id: '252891',
            account: { id: '5020028311' },
            invoice: null,
            sum: 1284,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'KORONAPAY2CARD WA',
          mcc: 6012,
          location: null
        },
        comment: 'Возврат (refund)'
      }
    ]
  ])('converts income transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
