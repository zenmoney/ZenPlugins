import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts outer income transfer', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '28.12.2018T17:01:17',
      description: 'Входящий перевод',
      form: 'ExtCardTransferIn',
      from: '5291 67** **** 2272',
      id: '11091826845',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/11ffac45-05f8-4dbd-b7e0-983ffda0bb72.png' } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '700.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'Тинькофф Банк',
      type: 'payment',
      ufsId: null,
      details: {
        amount: {
          changed: 'false',
          editable: 'false',
          moneyType: {
            currency: { code: 'RUB' },
            value: '700'
          },
          name: 'amount',
          required: 'false',
          title: 'Сумма в валюте счета',
          type: 'money',
          visible: 'false'
        },
        buyAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: {
            currency: { code: 'RUB' },
            value: '700'
          },
          name: 'buyAmount',
          required: 'false',
          title: 'Сумма зачисления',
          type: 'money',
          visible: 'true'
        },
        description: {
          changed: 'false',
          editable: 'false',
          name: 'description',
          required: 'false',
          stringType: { value: 'Тинькофф Банк' },
          title: 'Описание',
          type: 'string',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          name: 'fromResource',
          required: 'true',
          stringType: { value: '**** 2272' },
          title: 'Счет списания',
          type: 'string',
          visible: 'true'
        },
        operationDate: {
          changed: 'false',
          editable: 'false',
          name: 'operationDate',
          required: 'false',
          stringType: { value: '28.12.2018 17:01:17' },
          title: 'Дата и время совершения операции',
          type: 'string',
          visible: 'true'
        },
        toResource: {
          changed: 'false',
          editable: 'false',
          name: 'toResource',
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
          title: 'Счет зачисления',
          type: 'resource',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-28T17:01:17+03:00'),
      movements: [
        {
          id: '11091826845',
          account: { id: 'account' },
          invoice: null,
          sum: 700,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: { id: '4902' },
            syncIds: ['2272']
          },
          invoice: null,
          sum: -700,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outer income transfer with unknown sender bank', () => {
    expect(convertTransaction({
      id: '12087175649',
      ufsId: null,
      state: 'FINANCIAL',
      date: '04.02.2019T11:45:39',
      from: '2202 20** **** 0932',
      to: 'Сбербанк Онлайн',
      description: 'Входящий перевод',
      operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardTransferIn',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } },
      details: {
        description: {
          name: 'description',
          title: 'Описание',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'Сбербанк Онлайн' },
          changed: 'false'
        },
        toResource: {
          name: 'toResource',
          title: 'Счет зачисления',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:98043945',
                selected: 'true',
                displayedValue: '5469 75** **** 2343 [MasterCard Mass]',
                currency: 'RUB'
              }
            }
          },
          changed: 'false'
        },
        fromResource: {
          name: 'fromResource',
          title: 'Счет списания',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: '**** 0932' },
          changed: 'false'
        },
        buyAmount: {
          name: 'buyAmount',
          title: 'Сумма зачисления',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '500', currency: { code: 'RUB' } },
          changed: 'false'
        },
        amount: {
          name: 'amount',
          title: 'Сумма в валюте счета',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'false',
          moneyType: { value: '500', currency: { code: 'RUB' } },
          changed: 'false'
        },
        operationDate: {
          name: 'operationDate',
          title: 'Дата и время совершения операции',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: '04.02.2019 11:45:39' },
          changed: 'false'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-02-04T11:45:39+03:00'),
      movements: [
        {
          id: '12087175649',
          account: { id: 'account' },
          invoice: null,
          sum: 500,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: null,
            syncIds: ['0932']
          },
          invoice: null,
          sum: -500,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
