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
    ]
  ])('converts intcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
