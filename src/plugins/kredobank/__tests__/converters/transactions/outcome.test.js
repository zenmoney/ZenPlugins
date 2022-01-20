import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '220119_034704_3390106',
        externalId: '3390106',
        destination: {
          accountNumber: 'UA7232536503245432542352345',
          bankId: '325365',
          taxId: '09807862',
          name: 'АТ "КРЕДОБАНК"',
          currency: '980'
        },
        amountInCents: 330201,
        currency: 'UAH',
        localAmountInCents: 330201,
        operationDate: 1642550400000,
        finalizationDate: 1642556824000,
        description: 'Сума 119.00 USD Дата.01132022 080818,Код   Повернення по операції в торг. ПОС-і S06E3D30\\EPS\\TURKISH AIRLI\\658952510,№'
      },
      {
        hold: false,
        date: new Date('2022-01-19T00:00:00.000Z'),
        movements: [
          {
            id: '220119_034704_3390106',
            account: {
              id: '5243525243'
            },
            sum: 3302.01,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'Сума 119.00 USD Дата.01132022 080818,Код   Повернення по операції в торг. ПОС-і S06E3D30\\EPS\\TURKISH AIRLI\\658952510,№',
          mcc: null,
          location: null
        },
        comment: null
      }
    ],
    [
      {
        id: '220119_153143_3569150',
        externalId: '3569150',
        source: {
          accountNumber: 'UA7232536503245432542352345',
          bankId: '325365',
          taxId: '09807862',
          name: 'АТ "КРЕДОБАНК"',
          currency: '980'
        },
        amountInCents: -1000000,
        currency: 'UAH',
        localAmountInCents: -1000000,
        operationDate: 1642550400000,
        finalizationDate: 1642599103000,
        description: 'Сума 10000.00 UAH Дата.01162022 185654,Код  Операція в торговому POS-терміналі 31001445\\EPD\\SWG 2\\TE1445,№'
      },
      {
        hold: false,
        date: new Date('2022-01-19T00:00:00.000Z'),
        movements: [
          {
            id: '220119_153143_3569150',
            account: {
              id: '5243525243'
            },
            sum: -10000,
            fee: 0,
            invoice: null
          }
        ],
        merchant: {
          fullTitle: 'Сума 10000.00 UAH Дата.01162022 185654,Код  Операція в торговому POS-терміналі 31001445\\EPD\\SWG 2\\TE1445,№',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    const account = {
      available: 46879.37,
      balance: 46879.37,
      id: '5243525243',
      instrument: 'UAH',
      syncIds: [
        '5243525243'
      ],
      title: 'Рахунок - 5243525243',
      type: 'card',
      iban: 'UA7232536503245432542352345',
      bankType: 'card'
    }
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
