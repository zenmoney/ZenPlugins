import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts autopayment', () => {
    expect(convertTransaction({
      id: '11714346560',
      ufsId: null,
      state: 'FINANCIAL',
      date: '20.01.2019T07:03:36',
      from: 'Николай Кредитка 4854 63** **** 2200',
      to: 'Автоплатеж',
      description: 'Оплата товаров и услуг',
      operationAmount: { amount: '-15.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardPayment',
      imageId: { staticImage: { url: null } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-01-20T07:03:36+03:00'),
      movements: [
        {
          id: '11714346560',
          account: { id: 'account' },
          invoice: null,
          sum: -15,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Автоплатеж'
    })
  })
})
