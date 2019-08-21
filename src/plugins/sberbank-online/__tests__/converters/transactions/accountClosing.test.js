import { convertTransaction, getId } from '../../../converters'

describe('convertTransaction', () => {
  it('converts account closing', () => {
    const card = { id: 'card', instrument: 'RUB' }
    const accountsById = {}
    accountsById[getId('card', '510166099')] = card
    accountsById[getId('RUB', '639002********2392')] = card

    expect(convertTransaction({
      id: '13565249247',
      ufsId: null,
      state: 'EXECUTED',
      date: '20.03.2019T23:44:20',
      from: 'До востребов. 42301840655405351384',
      to: 'Maestro                                                        6390 02** **** **23 92',
      description: 'Закрытие вклада',
      operationAmount: { amount: '3.47', currency: { code: 'USD', name: '$' } },
      isMobilePayment: 'true',
      copyable: 'false',
      templatable: 'false',
      autopayable: 'false',
      type: 'payment',
      invoiceSubscriptionSupported: 'false',
      invoiceReminderSupported: 'false',
      form: 'AccountClosingPayment',
      imageId: {
        staticImage: { url: null }
      },
      details: {
        documentNumber:
          {
            name: 'documentNumber',
            title: 'Номер документа',
            type: 'integer',
            required: 'true',
            editable: 'false',
            visible: 'true',
            integerType: { value: '619089' },
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
            dateType: { value: '20.03.2019' },
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
                        value: 'account:504061946',
                        selected: 'true',
                        displayedValue: '423 01 840 6 55405351384 [До востребов.]',
                        currency: 'USD'
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
                        value: 'card:510166099',
                        selected: 'true',
                        displayedValue: '6390 02** **** **23 92 [Maestro]',
                        currency: 'RUB'
                      }
                  }
              },
            changed: 'false'
          },
        course:
          {
            name: 'course',
            title: 'Курс конверсии',
            type: 'money',
            required: 'false',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '62.6600' },
            changed: 'false'
          },
        closingDate:
          {
            name: 'closingDate',
            title: 'Дата закрытия',
            type: 'date',
            required: 'true',
            editable: 'false',
            visible: 'true',
            dateType: { value: '20.03.2019' },
            changed: 'false'
          },
        chargeOffAmount:
          {
            name: 'amount',
            title: 'Сумма списания',
            type: 'money',
            required: 'true',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '3.47' },
            changed: 'false'
          },
        destinationAmount:
          {
            name: 'destinationAmount',
            title: 'Сумма зачисления',
            type: 'money',
            required: 'true',
            editable: 'false',
            visible: 'true',
            moneyType: { value: '217.43' },
            changed: 'false'
          }
      }
    }, card, accountsById)).toEqual({
      hold: false,
      date: new Date('2019-03-20T23:44:20+03:00'),
      movements: [
        {
          id: '13565249247',
          account: {
            type: null,
            instrument: 'USD',
            syncIds: ['1384'],
            company: { id: '4624' }
          },
          invoice: null,
          sum: -3.47,
          fee: 0
        },
        {
          id: '13565249247',
          account: { id: 'card' },
          invoice: { sum: 3.47, instrument: 'USD' },
          sum: 217.43,
          fee: 0
        }
      ],
      merchant: null,
      comment: null
    })
  })
})
