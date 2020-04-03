import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts outcome without original amount', () => {
    expect(convertTransaction({
      __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
      id: 'lsyXReLOPRlo8b1v3j9+H8nbGZU=;opaNx0RWQga2pEAClrWBZaDMByU=',
      details: 'Card Year 2',
      isHold: true,
      statusName: 'В обработке',
      transactionAmountInAccountCurrency:
        {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: -150,
          currency:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              currencyCode: 'RUR',
              name: 'Рубль России',
              displaySymbol: '₽'
            }
        },
      debet: '',
      transactionDate: new Date('Tue May 07 2019 07:57:58 GMT+0700 (ICT)'),
      processedDate: null,
      transactionAmount:
        {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 0,
          currency:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              currencyCode: null,
              name: null,
              displaySymbol: null
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
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      comment: null,
      date: new Date('2019-05-07T00:57:58.000Z'),
      hold: true,
      merchant: {
        city: null,
        country: null,
        location: null,
        mcc: null,
        title: 'Card Year 2'
      },
      movements: [
        {
          account: {
            id: 'account'
          },
          fee: 0,
          id: 'opaNx0RWQga2pEAClrWBZaDMByU=',
          invoice: null,
          sum: -150
        }
      ]
    })
  })
})
