import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts outer transfer', () => {
    const apiTransactions = [
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'CXAc+GD6zNl7ei3O0vxsjgsxFEc=;AbWNJmYgHIWnc2kdSZxH1hZiUVQ=',
        details: 'На карту Сбербанк *1116',
        isHold: false,
        statusName: 'Исполнено',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -1050,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        debet: '',
        transactionDate: new Date('Sun May 19 2019 19:22:53 GMT+0300 (MSK)'),
        processedDate: new Date('Sun May 19 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -1050,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        feeAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 0,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        order:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.OrderMto',
            id: '999236252',
            orderId: 999236252,
            description: 'На карту Сбербанк *1116',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Sun May 19 2019 19:22:50 GMT+0300 (MSK)'),
            completionDate: new Date('Sun May 19 2019 19:22:58 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 1000,
                currency:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                    currencyCode: 'RUR',
                    name: 'Рубль России',
                    displaySymbol: '₽'
                  }
              },
            operationInfo:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.operation.OperationInfoMto',
                id: '3518',
                enabled: true,
                name: 'Перевод со своей карты на карту другого банка',
                shortName: 'Card2Card со своей карты на ка',
                description: 'Осуществляйте переводы между своими картами, на карты ВТБ других клиентов, на карты других банков РФ (для этого введите полный номер карты получателя в поле "Карты зачисления"). Перевод осуществляется в рублях.  При проведении перевода между картами ВТБ в разных валютах конвертация будет проведена по курсу ВТБ для карт, установленному на момент проведения операции.\r\n[br][b]Обратите внимание:[/b] при переводе с кредитных карт дополнительно взимается комиссия согласно [url="https://www.vtb24.ru/service/transfers/number/?NoMobileRedirect=true"]тарифам[/url] банка.',
                placeholder: null,
                sortOrder: 0,
                categoryId: '58'
              },
            status: null
          },
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      },
      {
        __type: 'ru.vtb24.mobilebanking.protocol.statement.CardTransactionMto',
        id: 'CXAc+GD6zNl7ei3O0vxsjgsxFEc=;8D/KYAENDq7MoTmKhWYufMNUiNA=',
        details: 'На карту  *4848',
        isHold: false,
        statusName: 'Исполнено',
        transactionAmountInAccountCurrency:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: -0.3,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'EUR',
                name: 'Евро',
                displaySymbol: '€'
              }
          },
        debet: '',
        transactionDate: new Date('Fri May 17 2019 13:28:32 GMT+0300 (MSK)'),
        processedDate: new Date('Fri May 17 2019 00:00:00 GMT+0300 (MSK)'),
        transactionAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 21.06,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'RUR',
                name: 'Рубль России',
                displaySymbol: '₽'
              }
          },
        feeAmount:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
            sum: 0,
            currency:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                currencyCode: 'EUR',
                name: 'Евро',
                displaySymbol: '€'
              }
          },
        order:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.OrderMto',
            id: '996335727',
            orderId: 996335727,
            description: 'На карту  *4848',
            pending: false,
            ignoreLimits: false,
            canBeExecuted: true,
            statusName: null,
            creationDate: new Date('Fri May 17 2019 13:28:29 GMT+0300 (MSK)'),
            completionDate: new Date('Fri May 17 2019 13:28:37 GMT+0300 (MSK)'),
            amount:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.AmountMto',
                sum: 5000,
                currency:
                  {
                    __type: 'ru.vtb24.mobilebanking.protocol.CurrencyMto',
                    currencyCode: 'RUR',
                    name: 'Рубль России',
                    displaySymbol: '₽'
                  }
              },
            operationInfo:
              {
                __type: 'ru.vtb24.mobilebanking.protocol.operation.OperationInfoMto',
                id: '3518',
                enabled: true,
                name: 'Перевод со своей карты на карту другого банка',
                shortName: 'Card2Card со своей карты на ка',
                description: 'Осуществляйте переводы между своими картами, на карты ВТБ других клиентов, на карты других банков РФ (для этого введите полный номер карты получателя в поле "Карты зачисления"). Перевод осуществляется в рублях.  При проведении перевода между картами ВТБ в разных валютах конвертация будет проведена по курсу ВТБ для карт, установленному на момент проведения операции.\r\n[br][b]Обратите внимание:[/b] при переводе с кредитных карт дополнительно взимается комиссия согласно [url="https://www.vtb24.ru/service/transfers/number/?NoMobileRedirect=true"]тарифам[/url] банка.',
                placeholder: null,
                sortOrder: 0,
                categoryId: '58'
              },
            status: null
          },
        status:
          {
            __type: 'ru.vtb24.mobilebanking.protocol.StatusMto',
            id: 'SUCCESS'
          }
      }
    ]

    const expectedTransactions = [
      {
        comment: null,
        date: new Date('2019-05-19T16:22:53.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: 'AbWNJmYgHIWnc2kdSZxH1hZiUVQ=',
            account: { id: 'account' },
            invoice: null,
            sum: -1050,
            fee: 0
          },
          {
            account: {
              type: 'ccard',
              instrument: 'RUB',
              company: { id: '4624' },
              syncIds: ['1116']
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 1050
          }
        ]
      },
      {
        comment: null,
        date: new Date('2019-05-17T10:28:32.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            id: '8D/KYAENDq7MoTmKhWYufMNUiNA=',
            account: { id: 'account' },
            invoice: {
              instrument: 'EUR',
              sum: -0.3
            },
            sum: -21.06,
            fee: 0
          },
          {
            account: {
              type: 'ccard',
              instrument: 'EUR',
              company: null,
              syncIds: ['4848']
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 0.3
          }
        ]
      }
    ]

    const account = { id: 'account', instrument: 'RUB' }

    expect(apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, account))).toEqual(expectedTransactions)
  })
})
