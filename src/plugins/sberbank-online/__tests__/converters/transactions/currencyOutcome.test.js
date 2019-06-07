import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts currency transaction', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '28.12.2018T14:01:43',
      description: 'Прочие списания',
      form: 'ExtCardOtherOut',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '11091826112',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-5.00', currency: { code: 'EUR', name: '€' } },
      state: 'AUTHORIZATION',
      templatable: 'false',
      to: 'GO.SKYPE.COM/BILL',
      type: 'payment',
      ufsId: null,
      details: {
        amount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '414.05' },
          name: 'amount',
          required: 'false',
          title: 'Сумма в валюте счета',
          type: 'money',
          visible: 'true'
        },
        commission: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: null,
          name: 'commission',
          required: 'false',
          title: 'Комиссия',
          type: 'money',
          visible: 'false'
        },
        description: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'description',
          required: 'false',
          stringType: { value: 'GO.SKYPE.COM/BILL        LUXEMBOURG   LUX' },
          title: 'Описание',
          type: 'string',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'fromResource',
          required: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                currency: 'RUB',
                displayedValue: '5298 26** **** 3389 [MasterCard Mass]',
                selected: 'true',
                value: 'card:51833625'
              }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        nfc: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'nfc',
          required: 'false',
          stringType: null,
          title: 'Бесконтактная операция NFC',
          type: 'string',
          visible: 'false'
        },
        operationDate: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'operationDate',
          required: 'false',
          stringType: { value: '28.12.2018 14:01:43' },
          title: 'Дата и время совершения операции',
          type: 'string',
          visible: 'true'
        },
        paymentDetails: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          name: 'paymentDetails',
          required: 'false',
          stringType: null,
          title: 'Информация о платеже',
          type: 'string',
          visible: 'false'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '5' },
          name: 'sellAmount',
          required: 'false',
          title: 'Сумма списания',
          type: 'money',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: true,
      date: new Date('2018-12-28T14:01:43+03:00'),
      movements: [
        {
          id: '11091826112',
          account: { id: 'account' },
          invoice: {
            sum: -5,
            instrument: 'EUR'
          },
          sum: -414.05,
          fee: 0
        }
      ],
      merchant: {
        title: 'GO.SKYPE.COM/BILL',
        city: 'LUXEMBOURG',
        country: 'LUX',
        mcc: null,
        location: null
      },
      comment: null
    })
  })
})
