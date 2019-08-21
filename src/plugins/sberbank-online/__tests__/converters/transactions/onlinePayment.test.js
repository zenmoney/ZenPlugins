import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts online payment', () => {
    expect(convertTransaction({
      autopayable: 'true',
      copyable: 'true',
      date: '24.12.2018T16:10:18',
      description: 'Оплата услуг',
      form: 'RurPayJurSB',
      from: 'Visa Gold 4281 01** **** 5370',
      id: '10936646113',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'true',
      isMobilePayment: 'false',
      operationAmount: { amount: '-192.67', currency: { code: 'RUB', name: 'руб.' } },
      state: 'EXECUTED',
      templatable: 'true',
      to: 'Газпром межрегионгаз Санкт-Петербург                                                                        40702810055230176256',
      type: 'servicePayment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-24T16:10:18+03:00'),
      movements: [
        {
          id: '10936646113',
          account: { id: 'account' },
          invoice: null,
          sum: -192.67,
          fee: 0
        }
      ],
      merchant: {
        title: 'Газпром межрегионгаз Санкт-Петербург',
        city: null,
        country: null,
        mcc: null,
        location: null
      },
      comment: null
    })
  })
})
