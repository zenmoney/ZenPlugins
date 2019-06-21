import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts cash deposit', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: '1syn9khH7VlbaWzXE5Th4QrVD7U=;pi0ji/AW6gm+MBSPtKv7UjSd91s=',
        details: 'Внесение наличных через банкомат',
        isHold: true,
        statusName: 'В обработке',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 5000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '',
        transactionDate: new Date('Fri Jun 21 2019 12:19:18 GMT+0300 (MSK)'),
        processedDate: null,
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 5000,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        feeAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 0,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        order: null,
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'IN_PROGRESS'
          }
      }
    ]

    const account = {
      id: 'account',
      instrument: 'RUB'
    }

    const expectedTransactions = [
      {
        comment: null,
        date: new Date('2019-06-21T12:19:18+03:00'),
        hold: true,
        merchant: null,
        movements: [
          {
            id: 'pi0ji/AW6gm+MBSPtKv7UjSd91s=',
            account: { id: 'account' },
            invoice: null,
            sum: 5000,
            fee: 0
          },
          {
            id: null,
            account: { type: 'cash', instrument: 'RUB', syncIds: null, company: null },
            invoice: null,
            sum: -5000,
            fee: 0
          }
        ]
      }
    ]

    expect(apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, account))).toEqual(expectedTransactions)
  })
})
