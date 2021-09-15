import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info:
          {
            id: 1004416337,
            operationType: 'inpayment',
            skbPaymentOperationType: null,
            subType: null,
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/628293674v0',
            descriptions:
              {
                operationDescription: 'Тютюнник Александра Евгеньевна',
                productDescription: 'm i r',
                productType: 'На счет карты'
              },
            amounts:
              {
                amount: 50,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: null,
            category:
              {
                id: 394010366,
                internalCode: 'replenishment',
                name: 'Пополнения'
              },
            state: 'processed',
            dateCreated: '2021-04-22T16:23:14+05:00',
            payWallet: false,
            direction: 'credit',
            comment: 'Пополнение лицевого счета Виктория Владимировна М.',
            productAccount: '40817810811724094906',
            productCardId: null
          }
      },
      {
        '40817810811724094906': { id: 'account', instrument: 'RUB' }
      },
      {
        comment: null,
        date: new Date('2021-04-22T16:23:14+05:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Тютюнник Александра Евгеньевна'
        },
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '1004416337',
            invoice: null,
            sum: 50
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 939414508,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'cash-back',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009712v1',
            descriptions:
              {
                operationDescription: 'Выплата кэшбэка',
                productDescription: 'Счет Visa Classic',
                productType: 'На счет карты'
              },
            amounts:
              {
                amount: 86.71,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: null,
            category:
              {
                id: 394010366,
                internalCode: 'replenishment',
                name: 'Пополнения'
              },
            state: 'processed',
            dateCreated: '2021-01-15T00:31:19+05:00',
            payWallet: null,
            direction: 'credit',
            comment: null,
            productAccount: '40817810811724094906',
            productCardId: null
          }
      },
      {
        '40817810811724094906': { id: 'account', instrument: 'RUB' }
      },
      {
        comment: 'Выплата кэшбэка',
        date: new Date('2021-01-15T00:31:19+05:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '939414508',
            invoice: null,
            sum: 86.71
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1002403192,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'bonus',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009712v1',
            descriptions:
              {
                operationDescription: 'Компенсация бонусами',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'На счет карты'
              },
            amounts:
              {
                amount: 3000,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: null,
            category:
              {
                id: 394010366,
                internalCode: 'replenishment',
                name: 'Пополнения'
              },
            state: 'processed',
            dateCreated: '2021-04-20T09:54:20+05:00',
            payWallet: null,
            direction: 'credit',
            comment: null,
            productAccount: '40817810624615409538',
            productCardId: null
          }
      },
      {
        '40817810624615409538': { id: 'account', instrument: 'RUB' }
      },
      {
        comment: 'Компенсация бонусами',
        date: new Date('2021-04-20T09:54:20+05:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '1002403192',
            invoice: null,
            sum: 3000
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 996429192,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'interest',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009712v1',
            descriptions:
              {
                operationDescription: 'Выплата процентов',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'На счет карты'
              },
            amounts:
              {
                amount: 80.38,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: null,
            category:
              {
                id: 394010366,
                internalCode: 'replenishment',
                name: 'Пополнения'
              },
            state: 'processed',
            dateCreated: '2021-03-31T12:00:00+05:00',
            payWallet: null,
            direction: 'credit',
            comment: null,
            productAccount: '40817810624615409538',
            productCardId: null
          }
      },
      {
        '40817810624615409538': { id: 'account', instrument: 'RUB' }
      },
      {
        comment: 'Выплата процентов',
        date: new Date('2021-03-31T12:00:00+05:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '996429192',
            invoice: null,
            sum: 80.38
          }
        ]
      }
    ]
  ])('should convert income', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
