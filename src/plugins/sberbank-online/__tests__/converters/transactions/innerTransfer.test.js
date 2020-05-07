import { convertTransaction, getId } from '../../../converters'

describe('convertTransaction', () => {
  it('converts inner transfer', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '51833625')] = account
    accountsById[getId('RUB', '428101******5370')] = { id: 'account2', instrument: 'RUB' }

    expect(convertTransaction({
      autopayable: 'true',
      copyable: 'true',
      date: '19.12.2018T17:26:24',
      description: 'Перевод между своими счетами',
      form: 'InternalPayment',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '10778929144',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-3710.81', currency: { code: 'RUB', name: 'руб.' } },
      state: 'EXECUTED',
      templatable: 'true',
      to: 'Visa Gold 4281 01** **** 5370',
      type: 'payment',
      ufsId: null,
      details: {
        fromResource: {
          changed: 'false',
          editable: 'false',
          name: 'fromResource',
          required: 'false',
          resourceType: {
            availableValues: {
              valueItem: { value: 'card:51833625', selected: 'true', displayedValue: '5298 26** **** 3389 [MasterCard Mass]', currency: 'RUB' }
            }
          },
          title: 'Счет списания',
          type: 'resource',
          visible: 'true'
        },
        sellAmount: {
          changed: 'false',
          editable: 'false',
          moneyType: { value: '3710.81' },
          name: 'sellAmount',
          required: 'false',
          title: 'Сумма списания',
          type: 'money',
          visible: 'true'
        },
        toResource: {
          changed: 'false',
          editable: 'false',
          name: 'toResource',
          required: 'false',
          resourceType: {
            availableValues: {
              valueItem: { value: 'card:69474436', selected: 'true', displayedValue: '4281 01** **** 5370 [Visa Gold]', currency: 'RUB' }
            }
          },
          title: 'Ресурс зачисления',
          type: 'resource',
          visible: 'true'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2018-12-19T17:26:24+03:00'),
      movements: [
        {
          id: '10778929144',
          account: { id: 'account' },
          invoice: null,
          sum: -3710.81,
          fee: 0
        },
        {
          id: '10778929144',
          account: { id: 'account2' },
          invoice: null,
          sum: 3710.81,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts inner transfer with ambiguous type', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '47407397')] = account
    accountsById[getId('card', '84375705')] = { id: 'account2', instrument: 'RUB' }

    expect(convertTransaction({
      id: '12401471400',
      ufsId: null,
      state: 'FINANCIAL',
      date: '15.02.2019T12:02:31',
      from: 'MasterCard Mass 5469 55** **** 2222',
      to: 'Сбербанк',
      description: 'Перевод',
      operationAmount: { amount: '-11324.90', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardTransferOut',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos/6f904da7-1663-4e68-801f-fe288c3283f6.png' } },
      details: {
        description: {
          name: 'description',
          title: 'Описание',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'Сбербанк' },
          changed: 'false'
        },
        toResource: {
          name: 'toResource',
          title: 'Счет зачисления',
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
                      value: 'card:84375705',
                      selected: 'true',
                      displayedValue: '4279 01** **** 3333 [Visa Gold]',
                      currency: 'RUB'
                    }
                }
            },
          changed: 'false'
        },
        fromResource: {
          name: 'fromResource',
          title: 'Счет списания',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType:
            {
              availableValues:
                {
                  valueItem:
                    {
                      value: 'card:47407397',
                      selected: 'true',
                      displayedValue: '5469 55** **** 2222 [MasterCard Mass]',
                      currency: 'RUB'
                    }
                }
            },
          changed: 'false'
        },
        sellAmount: {
          name: 'sellAmount',
          title: 'Сумма списания',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '11324.9', currency: { code: 'RUB' } },
          changed: 'false'
        },
        amount: {
          name: 'amount',
          title: 'Сумма в валюте счета',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'false',
          moneyType: { value: '11324.9', currency: { code: 'RUB' } },
          changed: 'false'
        },
        commission: {
          name: 'commission',
          title: 'Комиссия',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'false',
          moneyType: null,
          changed: 'false'
        },
        operationDate: {
          name: 'operationDate',
          title: 'Дата и время совершения операции',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: '15.02.2019 12:02:31' },
          changed: 'false'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-02-15T12:02:31+03:00'),
      movements: [
        {
          id: '12401471400',
          account: { id: 'account' },
          invoice: null,
          sum: -11324.9,
          fee: 0
        },
        {
          id: '12401471400',
          account: { id: 'account2' },
          invoice: null,
          sum: 11324.9,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts inner currency transfer', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '599624168')] = account
    accountsById[getId('account', '578020177')] = { id: 'account2', instrument: 'USD' }

    expect(convertTransaction({
      id: '12476663813',
      ufsId: null,
      state: 'EXECUTED',
      date: '18.02.2019T11:07:00',
      from: 'Visa Classic Molodejka 4276 26** **** 1888',
      to: 'Пополняй ОнЛ@йн 1г - 2г (вал.) 42306840426000103281',
      description: 'Перевод между своими счетами',
      operationAmount: { amount: '-336.10', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'true',
      copyable: 'true',
      templatable: 'true',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'InternalPayment',
      imageId: { staticImage: { url: null } },
      details: {
        fromResource: {
          name: 'fromResource',
          title: 'Счет списания',
          type: 'resource',
          required: 'false',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:599624168',
                selected: 'true',
                displayedValue: '4276 26** **** 1888 [Visa Classic Molodejka]',
                currency: 'RUB'
              }
            }
          },
          changed: 'false'
        },
        toResource: {
          name: 'toResource',
          title: 'Ресурс зачисления',
          type: 'resource',
          required: 'false',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'account:578020177',
                selected: 'true',
                displayedValue: '423 06 840 4 26000103281 [Пополняй ОнЛ@йн 1г - 2г (вал.)]',
                currency: 'USD'
              }
            }
          },
          changed: 'false'
        },
        course: {
          name: 'course',
          title: 'Курс конверсии',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '67.2200' },
          changed: 'false'
        },
        buyAmount: {
          name: 'buyAmount',
          title: 'Сумма зачисления',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '5.00' },
          changed: 'false'
        },
        sellAmount: {
          name: 'sellAmount',
          title: 'Сумма списания',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '336.10' },
          changed: 'false'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-02-18T11:07:00+03:00'),
      movements: [
        {
          id: '12476663813',
          account: { id: 'account' },
          invoice: { sum: -5, instrument: 'USD' },
          sum: -336.10,
          fee: 0
        },
        {
          id: '12476663813',
          account: { id: 'account2' },
          invoice: null,
          sum: 5,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts card to deposit transfer', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '599624168')] = account
    accountsById[getId('account', '578020177')] = { id: 'account2', instrument: 'USD' }

    expect(convertTransaction({
      id: '12487593206',
      ufsId: null,
      state: 'FINANCIAL',
      date: '18.02.2019T00:00:00',
      to: 'Универсальный                    42307810655076721341',
      description: 'Входящий перевод на вклад/счет',
      operationAmount: { amount: '500.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtDepositTransferIn',
      imageId: { staticImage: { url: null } }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-02-18T00:00:00+03:00'),
      movements: [
        {
          id: '12487593206',
          account: { id: 'account' },
          invoice: null,
          sum: 500,
          fee: 0
        }
      ],
      merchant: null,
      comment: null,
      groupKeys: ['2019-02-17_RUB_500']
    })
  })

  it('converts transfer without sell amount', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('RUB', '42303810855860470084')] = account
    accountsById[getId('RUB', '427644******3483')] = { id: 'account2', instrument: 'RUB' }

    expect(convertTransaction({
      id: '10950380712',
      ufsId: null,
      state: 'EXECUTED',
      date: '05.01.2019T08:23:19',
      from: 'Управляй ОнЛ@йн 3м - 6м (руб.) 42303810855860470084',
      to: 'Visa Classic 4276 44** **** 3483',
      description: 'Перевод между своими счетами',
      operationAmount: { amount: '-15300.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'true',
      copyable: 'true',
      templatable: 'true',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'InternalPayment',
      imageId: { staticImage: { url: null } },
      details: {
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
                        value: 'account:573768749',
                        selected: 'true',
                        displayedValue: '423 03 810 8 55860470084 [Управляй ОнЛ@йн 3м - 6м (руб.)]',
                        currency: 'RUB'
                      }
                  }
              },
            changed: 'false'
          },
        toResource:
          {
            name: 'toResource',
            title: 'Ресурс зачисления',
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
                        value: 'card:581110669',
                        selected: 'true',
                        displayedValue: '4276 44** **** 3483 [Visa Classic]',
                        currency: 'RUB'
                      }
                  }
              },
            changed: 'false'
          },
        buyAmount:
          {
            name: 'buyAmount',
            title: 'Сумма зачисления',
            type: 'money',
            required: 'false',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '15300.00' },
            changed: 'false'
          }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-01-05T08:23:19+03:00'),
      movements: [
        {
          id: '10950380712',
          account: { id: 'account' },
          invoice: null,
          sum: -15300.00,
          fee: 0
        },
        {
          id: '10950380712',
          account: { id: 'account2' },
          invoice: null,
          sum: 15300.00,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts card to loan transfer', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '546955******0923')] = account
    accountsById[getId('card', '15798011')] = account

    expect(convertTransaction({
      id: '18234833056',
      ufsId: null,
      state: 'FINANCIAL',
      date: '27.08.2019T09:03:13',
      from: 'MasterCard Mass 5469 55** **** 0923',
      to: 'Сбербанк',
      description: 'Погашение кредита',
      operationAmount: { amount: '-10000.00', currency: { code: 'RUB', name: 'руб.' } },
      isMobilePayment: 'false',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'ExtCardLoanPayment',
      imageId: { staticImage: { url: 'https://pfm-stat.online.sberbank.ru/PFM/logos3/6f904da7-1663-4e68-801f-fe288c3283f7.png' } },
      nationalAmount: { amount: '-10000.00', currency: { code: 'RUB', name: 'руб.' } },
      details: {
        description:
          {
            name: 'description',
            title: 'Описание',
            type: 'string',
            required: 'false',
            editable: 'false',
            visible: 'true',
            stringType: { value: 'Сбербанк' },
            changed: 'false'
          },
        fromResource:
          {
            name: 'fromResource',
            title: 'Ресурс списания',
            type: 'resource',
            required: 'true',
            editable: 'false',
            visible: 'true',
            resourceType:
              {
                availableValues:
                  {
                    valueItem:
                      {
                        value: 'card:15798011',
                        selected: 'true',
                        displayedValue: '5469 55** **** 0923 [MasterCard Mass]',
                        currency: 'RUB'
                      }
                  }
              },
            changed: 'false'
          },
        amount:
          {
            name: 'amount',
            title: 'Сумма в валюте счета',
            type: 'money',
            required: 'false',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '10000', currency: { code: 'RUB' } },
            changed: 'false'
          },
        operationDate:
          {
            name: 'operationDate',
            title: 'Дата и время совершения операции',
            type: 'string',
            required: 'false',
            editable: 'false',
            visible: 'true',
            stringType: { value: '27.08.2019 09:03:13' },
            changed: 'false'
          }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-08-27T09:03:13+03:00'),
      movements: [
        {
          id: '18234833056',
          account: { id: 'account' },
          invoice: null,
          sum: -10000,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Погашение кредита'
    })
  })

  it('converts inner transfer to Kopilka', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '51833625')] = account
    accountsById[getId('RUB', '428101******5370')] = { id: 'account2', instrument: 'RUB' }

    expect(convertTransaction({
      autopayable: 'true',
      copyable: 'true',
      date: '28.04.2020T17:17:50',
      description: 'Перевод',
      form: 'ExtCardTransferOut',
      from: 'MasterCard Mass 5298 26** **** 3389',
      id: '25306477802',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: { amount: '-100.55', currency: { code: 'RUB', name: 'руб.' } },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'Сервис Копилка',
      type: 'payment',
      ufsId: null,
      details: {}
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2020-04-28T17:17:50+03:00'),
      movements: [
        {
          id: '25306477802',
          account: { id: 'account' },
          invoice: null,
          sum: -100.55,
          fee: 0
        }
      ],
      groupKeys: ['2020-04-28_RUB_100.55'],
      merchant: null,
      comment: null
    })
  })
})
