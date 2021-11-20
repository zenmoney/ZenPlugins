import { convertTransaction } from '../../../converters'

describe('processAccounts', () => {
  it.each([
    [
      {
        operationName: 'Перевод средств на карточку Банка, выпущенную другому клиенту',
        operationPlace: 'PEREVOD NA 421487******0738',
        merchantId: '340340822004',
        transactionAuthCode: '370464',
        transactionDate: 1623675300000,
        operationDate: 1623358800000,
        transactionAmount: 1200,
        transactionCurrency: 'BYN',
        operationAmount: 1200,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 1084.85,
        cardPAN: '5127227260553330',
        operationCode: 3
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-06-10T21:00:00.000Z'),
        movements: [
          {
            id: '370464',
            account: { id: '5020028311' },
            invoice: null,
            sum: -1200,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'BYN',
              company: null,
              syncIds: ['421487******0738']
            },
            invoice: null,
            sum: 1200,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'PEREVOD NA 421487******0738'
      }
    ],
    [
      {
        operationName: 'Перевод средств в устройствах и сервисах других банков ',
        operationPlace: 'ONLINER P2P',
        merchantId: '7O100000',
        transactionAuthCode: '172773',
        transactionDate: 1627647900000,
        operationDate: 1627419600000,
        transactionAmount: 28,
        transactionCurrency: 'BYN',
        operationAmount: 28,
        operationCurrency: 'BYN',
        operationSign: '-1',
        actionGroup: 1802,
        operationClosingBalance: 95.62,
        cardPAN: '5127227260553330',
        operationCode: 3
      },
      { id: '5020028311', type: 'ccard', instrument: 'BYN' },
      {
        hold: false,
        date: new Date('2021-07-27T21:00:00.000Z'),
        movements: [
          {
            id: '172773',
            account: { id: '5020028311' },
            invoice: null,
            sum: -28,
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
            sum: 28,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'ONLINER P2P'
      }
    ]
  ])('converts OuterOutcome transactions', (apiTransaction, account, transaction) => {
    expect(convertTransaction(apiTransaction, account)).toEqual(transaction)
  })
})
