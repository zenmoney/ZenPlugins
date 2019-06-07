import { convertTransaction, getId } from '../../../converters'

describe('convertTransaction', () => {
  it('converts deposit capitalization', () => {
    expect(convertTransaction({
      autopayable: 'false',
      copyable: 'false',
      date: '31.12.2018T00:00:00',
      description: 'Капитализация по вкладу/счету',
      form: 'ExtDepositCapitalization',
      id: '6742338167',
      imageId: { staticImage: { url: null } },
      invoiceReminderSupported: 'false',
      invoiceSubscriptionSupported: 'false',
      isMobilePayment: 'false',
      operationAmount: {
        amount: '10.00',
        currency: { code: 'RUB', name: 'руб.' }
      },
      state: 'FINANCIAL',
      templatable: 'false',
      to: 'До востребования (руб)                    42301810755244611128',
      type: 'payment',
      ufsId: null
    }, { id: 'account', instrument: 'RUB' })).toEqual({
      hold: false,
      date: new Date('2018-12-31T00:00:00+03:00'),
      movements: [
        {
          id: '6742338167',
          account: { id: 'account' },
          invoice: null,
          sum: 10,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Капитализация по вкладу/счету'
    })
  })

  it('converts deposit opening', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const deposit = { id: 'deposit', instrument: 'USD' }
    const accountsById = {}
    accountsById[getId('RUB', '427662******7016')] = account
    accountsById[getId('USD', '42303840862000235746')] = deposit

    expect(convertTransaction({
      id: '11260699079',
      ufsId: null,
      state: 'EXECUTED',
      date: '14.01.2019T18:09:14',
      from: 'Visa Classic 4276 62** **** 7016',
      to: 'Пополняй ОнЛ@йн                                                                        42303840862000235746',
      description: 'Открытие вклада',
      operationAmount: { amount: '100.00', currency: { code: 'USD', name: '$' } },
      isMobilePayment: 'true',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'AccountOpeningClaim',
      imageId: { staticImage: { url: null } },
      details: {
        depositSubType: {
          name: 'depositSubType',
          title: 'Подвид вклада',
          type: 'integer',
          required: 'true',
          editable: 'false',
          visible: 'false',
          integerType: { value: '25' },
          changed: 'false'
        },
        documentNumber: {
          name: 'documentNumber',
          title: 'Номер документа',
          type: 'integer',
          required: 'true',
          editable: 'false',
          visible: 'true',
          integerType: { value: '75177' },
          changed: 'false'
        },
        documentDate: {
          name: 'documentDate',
          title: 'Дата документа',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '14.01.2019' },
          changed: 'false'
        },
        depositName: {
          name: 'depositName',
          title: 'Открыть вклад',
          type: 'string',
          required: 'true',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'Пополняй ОнЛ@йн' },
          changed: 'false'
        },
        openDate: {
          name: 'openDate',
          title: 'Дата открытия',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '14.01.2019' },
          changed: 'false'
        },
        closingDate: {
          name: 'closingDate',
          title: 'Дата закрытия',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '14.04.2019' },
          changed: 'false'
        },
        toResourceCurrency: {
          name: 'toResourceCurrency',
          title: 'Валюта',
          type: 'string',
          required: 'true',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'USD' },
          changed: 'false'
        },
        needInitialFee: {
          name: 'needInitialFee',
          title: 'Требуется начальный взнос',
          type: 'boolean',
          required: 'true',
          editable: 'false',
          visible: 'false',
          booleanType: { value: 'true' },
          changed: 'false'
        },
        withMinimumBalance: {
          name: 'withMinimumBalance',
          title: 'Есть ли у вклада неснижаемый остаток',
          type: 'boolean',
          required: 'true',
          editable: 'false',
          visible: 'false',
          booleanType: { value: 'false' },
          changed: 'false'
        },
        minDepositBalance: {
          name: 'minDepositBalance',
          title: 'Неснижаемый остаток',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'false',
          moneyType: { value: '100.00' },
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
                      value: 'card:604504131',
                      selected: 'true',
                      displayedValue: '4276 62** **** 7016 [Visa Classic]',
                      currency: 'RUB'
                    }
                }
            },
          changed: 'false'
        },
        buyAmount: {
          name: 'buyAmount',
          title: 'Сумма зачисления',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '100.00' },
          changed: 'false'
        },
        course: {
          name: 'course',
          title: 'Курс конверсии',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '68.2500' },
          changed: 'false'
        },
        sellAmount: {
          name: 'sellAmount',
          title: 'Сумма списания',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '6825.00' },
          changed: 'false'
        },
        exactAmount: {
          name: 'exactAmount',
          title: 'Признак, обозначающий какое из полей суммы заполнил пользователь',
          type: 'string',
          required: 'true',
          editable: 'false',
          visible: 'false',
          stringType: { value: 'destination-field-exact' },
          changed: 'false'
        },
        interestRate: {
          name: 'interestRate',
          title: 'Процентная ставка',
          type: 'number',
          required: 'true',
          editable: 'false',
          visible: 'true',
          numberType: { value: '0.4' },
          changed: 'false'
        },
        minAdditionalFee: {
          name: 'minAdditionalFee',
          title: 'Минимальный размер дополнительного взноса',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'false',
          moneyType: { value: '100' },
          changed: 'false'
        },
        percentTransferSource: {
          name: 'percentTransferSourceRadio',
          title: 'Вариант перечисления процентов',
          type: 'string',
          required: 'false',
          editable: 'false',
          visible: 'true',
          stringType: { value: 'card' },
          changed: 'false'
        },
        percentTransferCardSource: {
          name: 'percentTransferCardSource',
          title: 'Номер карты для перечисления процентов',
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
                      value: 'card:604504131',
                      selected: 'true',
                      displayedValue: '4276 62** **** 7016'
                    }
                }
            },
          changed: 'false'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-01-14T18:09:14+03:00'),
      movements: [
        {
          id: '11260699079',
          account: { id: 'account' },
          invoice: { sum: -100, instrument: 'USD' },
          sum: -6825,
          fee: 0
        },
        {
          id: '11260699079',
          account: { id: 'deposit' },
          invoice: null,
          sum: 100,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })

  it('converts deposit closing', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const deposit = { id: 'deposit', instrument: 'USD' }
    const accountsById = {}
    accountsById[getId('RUB', '427638******4123')] = account
    accountsById[getId('USD', '40817840438118500942')] = deposit

    expect(convertTransaction({
      id: '11528807128',
      ufsId: null,
      state: 'EXECUTED',
      date: '15.01.2019T10:23:30',
      from: 'Сберегательный счет 40817840438118500942',
      to: 'Аэрофлот бонус                                                        4276 38** **** 4123',
      description: 'Закрытие вклада',
      operationAmount: { amount: '-0.01', currency: { code: 'USD', name: '$' } },
      isMobilePayment: 'true',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'AccountClosingPayment',
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
            integerType: { value: '856081' },
            changed: 'false'
          },
        documentDate: {
          name: 'documentDate',
          title: 'Дата документа',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '15.01.2019' },
          changed: 'false'
        },
        fromResource: {
          name: 'fromResource',
          title: 'Ресурс списания',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'account:44049077',
                selected: 'true',
                displayedValue: '408 17 840 4 38118500942 [Сберегательный счет]',
                currency: 'USD'
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
                value: 'card:85779615',
                selected: 'true',
                displayedValue: '4276 38** **** 4123 [Аэрофлот бонус]',
                currency: 'RUB'
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
          moneyType: { value: '66.0700' },
          changed: 'false'
        },
        closingDate: {
          name: 'closingDate',
          title: 'Дата закрытия',
          type: 'date',
          required: 'true',
          editable: 'false',
          visible: 'true',
          dateType: { value: '15.01.2019' },
          changed: 'false'
        },
        chargeOffAmount: {
          name: 'amount',
          title: 'Сумма списания',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '0.01' },
          changed: 'false'
        },
        destinationAmount: {
          name: 'destinationAmount',
          title: 'Сумма зачисления',
          type: 'money',
          required: 'true',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '0.66' },
          changed: 'false'
        }
      }
    }, account, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-01-15T10:23:30+03:00'),
      movements: [
        {
          id: '11528807128',
          account: { id: 'deposit' },
          invoice: null,
          sum: -0.01,
          fee: 0
        },
        {
          id: '11528807128',
          account: { id: 'account' },
          invoice: { sum: 0.01, instrument: 'USD' },
          sum: 0.66,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
