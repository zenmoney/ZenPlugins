import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
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
      },
      {
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
      }
    ],
    [
      {
        id: '21247800193',
        ufsId: null,
        state: 'FINANCIAL',
        date: '25.10.2019T17:19:05',
        from: 'Visa Classic 4276 55** **** 0924',
        to: 'ATM TINKOFF 001218       Visa Direct  RUS',
        description: 'Перевод',
        operationAmount: { amount: '-16200.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'false',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'payment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'ExtCardTransferOut',
        imageId: { staticImage: { url: null } },
        nationalAmount: { amount: '-16200.00', currency: { code: 'RUB', name: 'руб.' } },
        classificationCode: '6012'
      },
      {
        hold: false,
        date: new Date('2019-10-25T17:19:05+03:00'),
        movements: [
          {
            id: '21247800193',
            account: { id: 'account' },
            invoice: null,
            sum: -16200,
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
            sum: 16200,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })

  it('converts strange cash deposit as cash withdrawal', () => {
    expect(convertTransaction({
      id: '24246343616',
      ufsId: null,
      state: 'FINANCIAL',
      date: '06.02.2020T21:27:29',
      from: 'Visa Classic 4276 13** **** 3486',
      to: 'Спартак',
      description: 'Внесение наличных',
      operationAmount: { amount: '-450.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardCashIn',
      nationalAmount: { amount: '-450.00', currency: { code: 'RUB', name: 'руб.' } },
      creationChannel: 'external',
      classificationCode: '7832'
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2020-02-06T21:27:29+03:00'),
      movements: [
        {
          id: '24246343616',
          account: { id: 'account' },
          invoice: null,
          sum: -450,
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
          sum: 450,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
