import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts accrued credit card interest', () => {
    expect(convertTransaction({
      __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
      id: 'vQ68G7c1+jz/4FHstuvffFUnGQo=;ZrRe1mEGxYH1V3sJCkPbgK2vim8=',
      details: 'Начисленные %',
      isHold: false,
      statusName: null,
      transactionAmountInAccountCurrency:
        {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: -300.1,
          currency:
            {
              __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
              currencyCode: 'RUR',
              name: 'Рубль России',
              displaySymbol: '₽'
            }
        },
      debet: '',
      transactionDate: new Date('Wed Jun 12 2019 13:11:18 GMT+0300 (MSK)'),
      processedDate: new Date('Wed Jun 12 2019 00:00:00 GMT+0300 (MSK)'),
      transactionAmount:
        {
          __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
          sum: 300.1,
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
          id: 'SUCCESS'
        }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      comment: 'Начисленные %',
      date: new Date('2019-06-12T10:11:18.000Z'),
      hold: false,
      merchant: null,
      movements: [
        {
          id: 'ZrRe1mEGxYH1V3sJCkPbgK2vim8=',
          account: { id: 'account' },
          invoice: null,
          sum: -300.1,
          fee: 0
        }
      ]
    })
  })
})
