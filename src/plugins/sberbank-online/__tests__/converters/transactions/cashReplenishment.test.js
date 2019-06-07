import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts cash replenishment', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '19.12.2018T10:49:12',
      description: 'Внесение наличных',
      form: 'ExtCardCashIn',
      id: '10774664622',
      imageId: {
        staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/33355.jpg' }
      },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '41000.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'Банкомат Сбербанка',
      type: 'payment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-19T10:49:12+03:00'),
      movements: [
        {
          id: '10774664622',
          account: { id: 'account' },
          invoice: null,
          sum: 41000,
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
          sum: -41000,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
