import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts account replenishment', () => {
    expect(convertTransaction({
      id: '16538596390',
      ufsId: null,
      state: 'FINANCIAL',
      date: '31.05.2019T00:00:00',
      to: 'Сберегательный счет 40817840455860161023',
      description: 'Прочие зачисления на вклад/счет',
      operationAmount: { amount: '304.44', currency: { code: 'USD', name: '$' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtDepositOtherCredit',
      imageId: { staticImage: { url: null } }
    }, { id: 'account', instrument: 'USD' })).toEqual({
      hold: false,
      date: new Date('2019-05-31T00:00:00+03:00'),
      movements: [
        {
          id: '16538596390',
          account: { id: 'account' },
          invoice: null,
          sum: 304.44,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
