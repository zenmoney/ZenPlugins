import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts insurance payment', () => {
    expect(convertTransaction({
      id: '0',
      ufsId: '00GF_0000000000000212601',
      state: 'EXECUTED',
      date: '05.06.2019T18:49:13',
      from: 'MasterCard 5469 38** **** 4921',
      to: 'ООО СК «Сбербанк страхование»',
      description: 'Страховой полис',
      operationAmount: { amount: '-6685.85', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'ufsPayment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'UfsInsurancePolicy',
      imageId: { staticImage: { url: null } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-06-05T18:49:13+03:00'),
      movements: [
        {
          id: null,
          account: { id: 'account' },
          invoice: null,
          sum: -6685.85,
          fee: 0
        }
      ],
      merchant: {
        country: null,
        city: null,
        title: 'ООО СК «Сбербанк страхование»',
        mcc: null,
        location: null
      },
      comment: null
    })
  })
})
