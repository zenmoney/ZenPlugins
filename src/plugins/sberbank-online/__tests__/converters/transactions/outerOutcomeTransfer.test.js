import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts outer outcome transfer with commission', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'true',
      date: '09.01.2019T15:23:10',
      description: 'Перевод на карту в другом банке',
      form: 'RurPayment',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '11363529083',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '-100.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'EXECUTED',
      templatable: 'true',
      to: '**** 2272',
      type: 'payment',
      ufsId: null,
      details: {
        admissionDate: {
          changed: 'false',
          dateType: { value: '09.01.2019' },
          editable: 'false',
          name: 'admissionDate',
          required: 'true',
          title: 'Плановая дата исполнения',
          type: 'date',
          visible: 'true'
        },
        buyAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: {
            value: '100'
          },
          name: 'buyAmount',
          required: 'true',
          title: 'Сумма зачисления',
          type: 'money',
          visible: 'true'
        },
        commission: {
          amount: '30.00',
          currency: { code: 'RUB', name: 'руб.' }
        },
        documentDate: {
          changed: 'false',
          dateType: { value: '09.01.2019' },
          editable: 'false',
          name: 'documentDate',
          required: 'true',
          title: 'Дата документа',
          type: 'date',
          visible: 'true'
        },
        documentNumber: {
          changed: 'false',
          editable: 'false',
          integerType: { value: '898796' },
          name: 'documentNumber',
          required: 'true',
          title: 'Номер документа',
          type: 'integer',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
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
        isFundPayment: {
          booleanType: { value: 'false' },
          changed: 'false',
          editable: 'false',
          name: 'isFundPayment',
          required: 'false',
          title: 'Является ли перевод оплатой сбора средств',
          type: 'boolean',
          visible: 'false'
        },
        receiverAccount: {
          changed: 'false',
          editable: 'false',
          name: 'receiverAccount',
          required: 'true',
          stringType: { value: '**** 2272' },
          title: 'Номер счета/карты получателя',
          type: 'string',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-01-09T15:23:10+03:00'),
      movements: [
        {
          id: '11363529083',
          account: { id: 'account' },
          invoice: null,
          sum: -100,
          fee: -30
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: null,
            syncIds: ['2272']
          },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outcome outer transfer to Sberbank client', () => {
    expect(convertTransaction({
      autopayable: 'true',
      copyable: 'true',
      date: '19.12.2018T17:27:04',
      description: 'Перевод клиенту Сбербанка',
      form: 'RurPayment',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '10778953787',
      imageId: { staticImage: {} },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-40000.00', currency: { code: 'RUB', name: 'руб.' } },
      state: 'EXECUTED',
      templatable: 'true',
      to: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.                                                        5184 27** **** 1478',
      type: 'payment',
      ufsId: null,
      details: {
        admissionDate: {
          changed: 'false',
          dateType: { value: '19.12.2018' },
          editable: 'false',
          name: 'admissionDate',
          required: 'true',
          title: 'Плановая дата исполнения',
          type: 'date',
          visible: 'true'
        },
        buyAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: null,
          name: 'buyAmount',
          required: 'true',
          title: 'Сумма зачисления',
          type: 'money',
          visible: 'false'
        },
        commission: { amount: '0.00', currency: { code: 'RUB', name: 'руб.' } },
        documentDate: {
          changed: 'false',
          dateType: { value: '19.12.2018' },
          editable: 'false',
          name: 'documentDate',
          required: 'true',
          title: 'Дата документа',
          type: 'date',
          visible: 'true'
        },
        documentNumber: {
          changed: 'false',
          editable: 'false',
          integerType: { value: '90672' },
          name: 'documentNumber',
          required: 'true',
          title: 'Номер документа',
          type: 'integer',
          visible: 'true'
        },
        fromResource: {
          changed: 'false',
          editable: 'false',
          name: 'fromResource',
          required: 'false',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:51833625',
                selected: 'true',
                displayedValue: '5298 26** **** 3389 [MasterCard Mass]',
                currency: 'RUB'
              }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        isFundPayment: {
          booleanType: { value: 'false' },
          changed: 'false',
          editable: 'false',
          name: 'isFundPayment',
          required: 'false',
          title: 'Является ли перевод оплатой сбора средств',
          type: 'boolean',
          visible: 'false'
        },
        messageToReceiverStatus: {
          changed: 'false',
          editable: 'false',
          name: 'messageToReceiverStatus',
          required: 'false',
          stringType: { value: 'сообщение отправлено' },
          title: 'Статус SMS-сообщения',
          type: 'string',
          visible: 'true'
        },
        receiverAccount: {
          changed: 'false',
          editable: 'false',
          name: 'receiverAccount',
          required: 'true',
          stringType: { value: '5184 27** **** 1478' },
          title: 'Номер счета/карты получателя',
          type: 'string',
          visible: 'true'
        },
        receiverName: {
          changed: 'false',
          editable: 'false',
          name: 'receiverName',
          required: 'true',
          stringType: { value: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.' },
          title: 'ФИО получателя',
          type: 'string',
          visible: 'true'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: { value: '40000.00' },
          name: 'sellAmount',
          required: 'true',
          title: 'Сумма в валюте списания',
          type: 'money',
          visible: 'true'
        },
        sellCurrency: {
          changed: 'false',
          editable: 'false',
          name: 'sellAmountCurrency',
          required: 'true',
          stringType: { value: 'RUB' },
          title: 'Валюта списания',
          type: 'string',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-19T17:27:04+03:00'),
      movements: [
        {
          id: '10778953787',
          account: { id: 'account' },
          invoice: null,
          sum: -40000,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: {
              id: '4624'
            },
            syncIds: ['1478']
          },
          invoice: null,
          sum: 40000,
          fee: 0
        }
      ],
      merchant: {
        title: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.',
        city: null,
        country: null,
        mcc: null,
        location: null
      },
      comment: null
    })

    expect(convertTransaction({
      id: '16482158030',
      ufsId: null,
      state: 'EXECUTED',
      date: '11.06.2019T15:00:51',
      from: 'Visa Classic 4276 62** **** 3232',
      to: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.                                                        6390 02** **** **23 93',
      description: 'Перевод клиенту Сбербанка',
      operationAmount: { amount: '-700.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'true',
      copyable: 'true',
      templatable: 'true',
      autopayable: 'true',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'RurPayment',
      imageId: { staticImage: { url: null } },
      details: {
        documentNumber:
          {
            name: 'documentNumber',
            title: 'Номер документа',
            type: 'integer',
            required: 'true',
            editable: 'false',
            visible: 'true',
            integerType: { value: '526817' },
            changed: 'false'
          },
        documentDate:
          {
            name: 'documentDate',
            title: 'Дата документа',
            type: 'date',
            required: 'true',
            editable: 'false',
            visible: 'true',
            dateType: { value: '11.06.2019' },
            changed: 'false'
          },
        isFundPayment:
          {
            name: 'isFundPayment',
            title: 'Является ли перевод оплатой сбора средств',
            type: 'boolean',
            required: 'false',
            editable: 'false',
            visible: 'false',
            booleanType: { value: 'false' },
            changed: 'false'
          },
        receiverAccount:
          {
            name: 'receiverAccount',
            title: 'Номер счета/карты получателя',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: '6390 02** **** **23 93' },
            changed: 'false'
          },
        receiverPhone:
          {
            name: 'externalPhoneNumber',
            title: 'Номер телефона получателя',
            type: 'integer',
            required: 'true',
            editable: 'false',
            visible: 'true',
            integerType: { value: '9122222222' },
            changed: 'false'
          },
        receiverName:
          {
            name: 'receiverName',
            title: 'ФИО получателя',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.' },
            changed: 'false'
          },
        fromResource:
          {
            name: 'fromResource',
            title: 'Счет списания',
            type: 'resource',
            required: 'false',
            editable: 'false',
            visible: 'true',
            resourceType:
              {
                availableValues:
                  {
                    valueItem:
                      {
                        value: 'card:636085621',
                        selected: 'true',
                        displayedValue: '4276 62** **** 3232 [Visa Classic]',
                        currency: 'RUB'
                      }
                  }
              },
            changed: 'false'
          },
        sellAmount:
          {
            name: 'sellAmount',
            title: 'Сумма в валюте списания',
            type: 'money',
            required: 'true',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '700.00' },
            changed: 'false'
          },
        sellCurrency:
          {
            name: 'sellAmountCurrency',
            title: 'Валюта списания',
            type: 'string',
            required: 'true',
            editable: 'false',
            visible: 'true',
            stringType: { value: 'RUB' },
            changed: 'false'
          },
        buyAmount:
          {
            name: 'buyAmount',
            title: 'Сумма зачисления',
            type: 'money',
            required: 'true',
            editable: 'false',
            visible: 'false',
            moneyType: null,
            changed: 'false'
          },
        commission: { amount: '7.00', currency: { code: 'RUB', name: 'руб.' } },
        admissionDate:
          {
            name: 'admissionDate',
            title: 'Плановая дата исполнения',
            type: 'date',
            required: 'true',
            editable: 'false',
            visible: 'true',
            dateType: { value: '11.06.2019' },
            changed: 'false'
          },
        messageToReceiverStatus:
          {
            name: 'messageToReceiverStatus',
            title: 'Статус SMS-сообщения',
            type: 'string',
            required: 'false',
            editable: 'false',
            visible: 'true',
            stringType: { value: 'сообщение будет отправлено' },
            changed: 'false'
          }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-06-11T15:00:51+03:00'),
      movements: [
        {
          id: '16482158030',
          account: { id: 'account' },
          invoice: null,
          sum: -700,
          fee: -7
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: {
              id: '4624'
            },
            syncIds: ['2393']
          },
          invoice: null,
          sum: 700,
          fee: 0
        }
      ],
      merchant: {
        title: 'НИКОЛАЙ НИКОЛАЕВИЧ Н.',
        city: null,
        country: null,
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('converts outer outcome transfer to known bank but account syncId is absent', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '23.01.2019T15:05:34',
      description: 'Прочие списания',
      form: 'ExtCardOtherOut',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '11771931545',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/11ffac45-05f8-4dbd-b7e0-983ffda0bb72.png' } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-100.00', currency: { code: 'RUB', name: 'руб.' } },
      state: 'AUTHORIZATION',
      templatable: 'false',
      to: 'Тинькофф Банк',
      type: 'payment',
      ufsId: null,
      details: {
        amount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '100' },
          name: 'amount',
          required: 'false',
          title: 'Сумма в валюте счета',
          type: 'money',
          visible: 'false'
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
          stringType: { value: 'Тинькофф Банк' },
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
                value: 'card:51833625',
                selected: 'true',
                displayedValue: '5298 26** **** 3389 [MasterCard Mass]',
                currency: 'RUB'
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
          stringType: { value: '23.01.2019 15:05:34' },
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
          stringType: { value: 'TINKOFF BANK CARD2CARD   MOSCOW       RUS' },
          title: 'Информация о платеже',
          type: 'string',
          visible: 'true'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          isSum: 'false',
          moneyType: { value: '100' },
          name: 'sellAmount',
          required: 'false',
          title: 'Сумма списания',
          type: 'money',
          visible: 'true'
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: true,
      date: new Date('2019-01-23T15:05:34+03:00'),
      movements: [
        {
          id: '11771931545',
          account: { id: 'account' },
          invoice: null,
          sum: -100,
          fee: 0
        },
        {
          id: null,
          account: {
            type: 'ccard',
            instrument: 'RUB',
            company: { id: '4902' },
            syncIds: null
          },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts outer outcome transfer to known bank with certain syncId', () => {
    expect(convertTransaction({
      id: '12081077506',
      ufsId: null,
      state: 'EXECUTED',
      date: '04.02.2019T10:05:27',
      from: 'MasterCard Mass 5469 75** **** 2363',
      to: 'Пополнение кошелька в Яндекс.Деньгах 30233810100001170180',
      description: 'Оплата услуг Интернет-магазинов',
      operationAmount: { amount: '-100.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'servicePayment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExternalProviderPayment',
      imageId: { staticImage: { url: null } },
      details: {
        documentNumber: {
          name: 'documentNumber',
          title: 'Номер документа',
          type: 'integer',
          required: 'false',
          editable: 'false',
          visible: 'true',
          integerType: {
            value: '85334'
          },
          changed: 'false'
        },
        receiverName: {
          name: 'receiverName',
          title: 'Получатель',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: {
            value: 'Пополнение кошелька в Яндекс.Деньгах'
          },
          changed: 'false'
        },
        fromResource: {
          name: 'fromResource',
          title: 'Оплата с',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:98043945',
                selected: 'true',
                displayedValue: '5469 75** **** 2363 [MasterCard Mass]',
                currency: 'RUB'
              }
            }
          },
          changed: 'false'
        },
        amount: {
          name: 'amount',
          title: 'Сумма',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: {
            value: '100.00'
          },
          changed: 'false'
        },
        currency: {
          name: 'currency',
          title: 'Валюта',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: {
            value: 'RUB'
          },
          changed: 'false'
        },
        recIdentifier: {
          name: 'RecIdentifier',
          title: 'Номер заказа',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: {
            value: '118197841'
          },
          changed: 'false'
        },
        itemList: {
          item: {
            name: 'Пополнение кошелька в Яндекс.Деньгах',
            description: 'Яндекс.Деньги',
            count: '1',
            price: {
              amount: '100',
              currency: {
                code: 'RUB',
                name: 'руб.'
              }
            }
          }
        }
      }
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2019-02-04T10:05:27+03:00'),
      movements: [
        {
          id: '12081077506',
          account: { id: 'account' },
          invoice: null,
          sum: -100,
          fee: 0
        },
        {
          id: null,
          account: {
            type: null,
            instrument: 'RUB',
            company: { id: '15420' },
            syncIds: ['0180']
          },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
