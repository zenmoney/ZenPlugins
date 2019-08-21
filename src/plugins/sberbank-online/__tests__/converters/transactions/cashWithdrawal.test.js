import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts cash withdrawal', () => {
    expect(convertTransaction({
      id: '11128289282',
      ufsId: null,
      state: 'FINANCIAL',
      date: '10.01.2019T20:18:16',
      from: 'Visa Classic 4276 52** **** 4451',
      to: 'Банкомат Сбербанка',
      description: 'Выдача наличных',
      operationAmount: { amount: '-200.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardCashOut',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' } }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-01-10T20:18:16+03:00'),
      movements: [
        {
          id: '11128289282',
          account: { id: 'account' },
          invoice: null,
          sum: -200,
          fee: 0
        },
        {
          id: null,
          account: {
            type: 'cash',
            instrument: 'RUB',
            company: null,
            syncIds: null
          },
          invoice: null,
          sum: 200,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
