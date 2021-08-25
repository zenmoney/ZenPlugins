import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info:
          {
            id: 956806995,
            operationType: 'card_transaction',
            skbPaymentOperationType: null,
            subType: 'cash-in',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009712v1',
            descriptions:
              {
                operationDescription: 'Внесение наличных OO PERMSKIY',
                productDescription: 'Mastercard Unembossed',
                productType: 'На карту'
              },
            amounts:
              {
                amount: 100000,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB',
                cashAmount: null,
                cashCurrency: null,
                bonusAmountMin: 0,
                bonusAmountMax: 0
              },
            mainRequisite: 'МСС: 6012',
            category:
              {
                id: 394010366,
                internalCode: 'replenishment',
                name: 'Пополнения'
              },
            state: 'processed',
            dateCreated: '2021-02-11T10:10:47+05:00',
            payWallet: false,
            direction: 'credit',
            comment: null,
            productAccount: '40817810624615409538',
            productCardId: 105737180
          }
      },
      {
        '40817810624615409538': { id: 'account', instrument: 'RUB' }
      },
      {
        hold: false,
        date: new Date('2021-02-11T10:10:47+05:00'),
        movements: [
          {
            id: '956806995',
            account: { id: 'account' },
            invoice: null,
            sum: 100000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -100000,
            fee: 0
          }
        ],
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: 6012,
          title: 'OO PERMSKIY'
        },
        comment: null
      }
    ],
    [
      {
        info:
          {
            id: 1061350036,
            operationType: 'card_transaction',
            skbPaymentOperationType: null,
            subType: 'cash-out',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009708v1',
            descriptions:
              {
                operationDescription: 'Снятие наличных DO SISERTSKIY',
                productDescription: 'Visa Classic',
                productType: 'С карты'
              },
            amounts:
              {
                amount: 200,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB',
                cashAmount: null,
                cashCurrency: null,
                bonusAmountMin: 0,
                bonusAmountMax: 0
              },
            mainRequisite: 'МСС: 6011',
            category: { id: 394010368, internalCode: 'cash', name: 'Наличные' },
            state: 'processed',
            dateCreated: '2021-07-16T10:57:42+05:00',
            payWallet: false,
            direction: 'debit',
            comment: null,
            productAccount: '40817810711724042935',
            productCardId: 298225746
          }
      },
      {
        '40817810711724042935': { id: 'account', instrument: 'RUB' }
      },
      {
        hold: false,
        date: new Date('2021-07-16T10:57:42+05:00'),
        movements: [
          {
            id: '1061350036',
            account: { id: 'account' },
            invoice: null,
            sum: -200,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'RUB',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: 200,
            fee: 0
          }
        ],
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: 6011,
          title: 'DO SISERTSKIY'
        },
        comment: null
      }
    ]
  ])('should convert cash', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
