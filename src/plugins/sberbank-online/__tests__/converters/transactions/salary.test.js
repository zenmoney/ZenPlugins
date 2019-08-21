import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts salary', () => {
    expect(convertTransaction({
      id: '15680377888',
      ufsId: null,
      state: 'FINANCIAL',
      date: '20.05.2019T06:30:05',
      to: 'Зачисление зарплаты',
      description: 'Прочие поступления',
      operationAmount: { amount: '15812.50', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardOtherIn',
      imageId: { staticImage: { url: null } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-05-20T06:30:05+03:00'),
      movements: [
        {
          id: '15680377888',
          account: { id: 'account' },
          invoice: null,
          sum: 15812.50,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Зачисление зарплаты'
    })
  })
})
