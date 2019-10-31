import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [

      {
        txnId: 14630639437,
        personId: 79166781234,
        date: '2019-01-05T16:18:15+03:00',
        errorCode: 0,
        error: null,
        status: 'SUCCESS',
        type: 'OUT',
        statusText: 'Success',
        trmTxnId: '14630639436',
        account: '+79166781234',
        sum: { amount: 483.07, currency: 643 },
        commission: { amount: 0, currency: 643 },
        total: { amount: 483.07, currency: 643 },
        provider: {
          id: 1099,
          shortName: 'QIWI Кошелек (конвертация)',
          longName: 'QIWI Кошелек (конвертация)',
          logoUrl: null,
          description: null,
          keys: null,
          siteUrl: null,
          extras: [
            { key: 'favorite_payment_disabled', value: 'true' },
            { key: 'regular_payment_disabled', value: 'true' }
          ]
        },
        source: {
          id: 7,
          shortName: 'QIWI Кошелек',
          longName: 'QIWI Кошелек',
          logoUrl: null,
          description: null,
          keys: 'мобильный кошелек, кошелек, перевести деньги, личный кабинет, отправить деньги, перевод между пользователями',
          siteUrl: null,
          extras: []
        },
        comment: 'Конвертация для проведения платежа 14630639437',
        currencyRate: 72.4231,
        paymentExtras: [],
        features: {
          chequeReady: true,
          bankDocumentReady: false,
          regularPaymentEnabled: false,
          bankDocumentAvailable: false,
          repeatPaymentEnabled: false,
          favoritePaymentEnabled: false,
          chatAvailable: false,
          greetingCardAttached: false
        },
        serviceExtras: {},
        view: { title: 'QIWI Кошелек (конвертация)', account: '+79166781234' }
      },
      {
        hold: false,
        date: new Date('2019-01-05T16:18:15+03:00'),
        movements: [
          {
            id: '14630639437',
            account: { id: 'account_643' },
            invoice: null,
            sum: -483.07,
            fee: 0
          }
        ],
        merchant: null,
        comment: null,
        groupKeys: [
          '14630639437'
        ]
      }
    ]
  ])('converts inner income transfer', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, 'account')).toEqual(transaction)
  })
})
