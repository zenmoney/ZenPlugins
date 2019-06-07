import { convertTransaction, getId, GRAMS_IN_OZ } from '../../../converters'

describe('convertTransaction', () => {
  it('converts metal transfer', () => {
    const account = { id: 'account', instrument: 'RUB' }
    const metal = { id: 'metal', instrument: 'XAG' }
    const accountsById = {}
    accountsById[getId('RUB', '533669******5489')] = account
    accountsById[getId('ima', '500180198')] = metal

    expect(convertTransaction({
      id: '2811727974',
      ufsId: null,
      state: 'EXECUTED',
      date: '06.03.2019T18:32:02',
      from: 'Обезлич. мет. счета (серебро) 20309099952090454301',
      to: 'MasterCard Mass 5336 69** **** 5489',
      description: 'Покупка/продажа металла',
      operationAmount: { amount: '1.00', currency: { code: 'A99', name: 'г' } },
      isMobilePayment: 'true',
      copyable: 'true',
      templatable: 'true',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'IMAPayment',
      imageId: { staticImage: { url: null } },
      details: {
        documentNumber: {
          name: 'documentNumber',
          title: 'Номер документа',
          type: 'integer',
          required: 'false',
          editable: 'false',
          visible: 'true',
          integerType: { value: '277074' },
          changed: 'false'
        },
        documentDate: {
          name: 'documentDate',
          title: 'Дата документа',
          type: 'date',
          required: 'false',
          editable: 'false',
          visible: 'true',
          dateType: { value: '06.03.2019' },
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
                value: 'im-account:500180198',
                selected: 'true',
                displayedValue: '0454301 [Обезлич. мет. счета (серебро)]',
                currency: 'A99'
              }
            }
          },
          changed: 'false'
        },
        toResource: {
          name: 'toResource',
          title: 'Ресурс зачисления',
          type: 'resource',
          required: 'true',
          editable: 'false',
          visible: 'true',
          resourceType: {
            availableValues: {
              valueItem: {
                value: 'card:595266168',
                selected: 'true',
                displayedValue: '5336 69** **** 5489 [MasterCard Mass]',
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
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '31.55' },
          changed: 'false'
        },
        sellAmount: {
          name: 'sellAmount',
          title: 'Сумма списания',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '1.00' },
          changed: 'false'
        },
        course: {
          name: 'course',
          title: 'Льготный курс продажи',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '31.5500' },
          changed: 'false'
        },
        standartCourse: {
          name: 'standartCourse',
          title: 'Обычный курс продажи',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '30.2900' },
          changed: 'false'
        },
        gain: {
          name: 'gain',
          title: 'Моя выгода',
          type: 'money',
          required: 'false',
          editable: 'false',
          visible: 'true',
          moneyType: { value: '1.26' },
          changed: 'false'
        }
      }
    }, account, accountsById, {})).toEqual({
      hold: false,
      date: new Date('2019-03-06T18:32:02+03:00'),
      movements: [
        {
          id: '2811727974',
          account: { id: 'metal' },
          invoice: null,
          sum: -1 / GRAMS_IN_OZ,
          fee: 0
        },
        {
          id: '2811727974',
          account: { id: 'account' },
          invoice: { sum: 1 / GRAMS_IN_OZ, instrument: 'XAG' },
          sum: 31.55,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
