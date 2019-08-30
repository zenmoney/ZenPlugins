import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '18100715028',
        ufsId: null,
        state: 'FINANCIAL',
        date: '23.08.2019T12:44:38',
        from: 'Electron 4276 86** **** 0923',
        to: 'MYASNOY RYAD             TYUMEN       RUS',
        description: 'Оплата товаров и услуг',
        operationAmount: { amount: '-641.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardPayment',
        imageId: { staticImage: { url: null } },
        nationalAmount: { amount: '-641.00', currency: { code: 'RUB', name: 'руб.' } }
      },
      {
        hold: false,
        date: new Date('2019-08-23T12:44:38+03:00'),
        movements: [
          {
            id: '18100715028',
            account: { id: 'account' },
            invoice: null,
            sum: -641,
            fee: 0
          }
        ],
        merchant: {
          title: 'MYASNOY RYAD',
          city: 'TYUMEN',
          country: 'RUS',
          mcc: null,
          location: null
        },
        comment: null
      }
    ]
  ])('converts outcome', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
