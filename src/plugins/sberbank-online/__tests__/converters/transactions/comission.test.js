import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts commission', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '19.12.2018T00:00:00',
      description: 'Комиссии',
      form: 'TakingMeans',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '10790859369',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-60.00', currency: { code: 'RUB', name: 'руб.' } },
      state: 'FINANCIAL',
      templatable: 'false',
      type: 'payment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-19T00:00:00+03:00'),
      movements: [
        {
          id: '10790859369',
          account: { id: 'account' },
          invoice: null,
          sum: -60,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Комиссии'
    })
  })
})
