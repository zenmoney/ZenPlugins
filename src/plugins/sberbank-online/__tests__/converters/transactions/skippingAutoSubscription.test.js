import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: '23297095932',
        ufsId: null,
        state: 'EXECUTED',
        date: '15.02.2020T07:42:45',
        from: 'Visa Gold 4279 01** **** 2983',
        to: 'TELE2 40911810649000013385',
        description: 'Отмена исполнения автоплатежа',
        operationAmount: { amount: '-340.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'true',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'servicePayment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'AcceptAutoSubscriptionExecuteClaim',
        nationalAmount: { amount: '-340.00', currency: { code: 'RUB', name: 'руб.' } },
        creationChannel: 'mobile'
      },
      null
    ],
    [
      {
        id: '24872053320',
        ufsId: null,
        state: 'EXECUTED',
        date: '10.04.2020T11:42:29',
        from: 'Visa Classic 4276 55** **** 3580',
        to: 'УК Содружество-Авангард',
        description: 'Создание автоплатежа: ЖКУ А.ЧЕРОКОВА 18/3',
        operationAmount: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
        isMobilePayment: 'true',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'servicePayment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'CreateAutoSubscriptionPayment',
        nationalAmount: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
        creationChannel: 'mobile',
        commission: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } }
      },
      null
    ],
    [
      {
        id: '24063767016',
        ufsId: null,
        state: 'EXECUTED',
        date: '11.03.2020T15:53:11',
        from: 'Visa Classic 4276 55** **** 3580',
        to: 'ГУП ВЦКП &#034;ЖИЛИЩНОЕ ХОЗЯЙСТВО&#034;                                                                        40602810800000000028',
        description: 'Редактирование автоплатежа',
        isMobilePayment: 'true',
        copyable: 'false',
        templatable: 'false',
        autopayable: 'false',
        type: 'servicePayment',
        invoiceSubscriptionSupported: 'false',
        invoiceReminderSupported: 'false',
        form: 'EditAutoSubscriptionPayment',
        creationChannel: 'mobile'
      },
      null
    ]
  ])('skipping edit AutoSubscription transactions', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toEqual(transaction)
  })
})
