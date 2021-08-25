import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info:
          {
            id: 969519764,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'transfer-own',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009711v1',
            descriptions:
              {
                operationDescription: 'Вклады: открытие вклада Обыкновенное чудо!! RUB',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 425686.13,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: 'На "Обыкновенное чудо!!"',
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2021-03-02T13:49:53+05:00',
            payWallet: null,
            direction: 'internal',
            comment: null,
            productAccount: '40817810825715720880',
            productCardId: null
          },
        details: {
          actions: ['sendCheck', 'print'],
          amount: 425686.13,
          bankSystemId: '7079064656',
          category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
          chargeDate: '2021-03-02T13:50:22+05:00',
          comment: 'Перевод между счетами через систему ДБО',
          convAmount: null,
          convCurrency: null,
          currency: 'RUB',
          dateCreated: '2021-03-02T13:49:53+05:00',
          descriptions:
            {
              operationDescription: 'Вклады: открытие вклада Обыкновенное чудо!! RUB',
              productDescription: 'Счет Mastercard Unembossed',
              productType: 'Со счета карты'
            },
          direction: 'internal',
          feeAmount: 0,
          feeCurrency: 'RUB',
          firstCurrency: null,
          id: 969519764,
          mainRequisite: 'На "Обыкновенное чудо!!"',
          operationIcon: 'https://ib.delo.ru/json/icon/394009711v1',
          orderedRequisites: [],
          payeeAccount: '42306810925701652119',
          payeeBic: '046577756',
          payerAccount: '40817810825715720880',
          payerBic: '046577756',
          productAccount: '40817810825715720880',
          productCardId: null,
          rate: null,
          requisites: {},
          secondCurrency: null,
          state: 'processed',
          transactionType: 'transfer-own'
        }
      },
      {
        '40817810825715720880': { id: 'account1', instrument: 'RUB' },
        '42305810725700366005': { id: 'account2', instrument: 'RUB' }
      },
      {
        date: new Date('2021-03-02T13:49:53+05:00'),
        hold: false,
        comment: 'Вклады: открытие вклада Обыкновенное чудо!! RUB',
        merchant: null,
        movements: [
          {
            id: '969519764',
            account: { id: 'account1' },
            invoice: null,
            sum: -425686.13,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'checking',
              instrument: 'RUB',
              syncIds: [
                '42306810925701652119'
              ],
              company: null
            },
            invoice: null,
            sum: 425686.13,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1018823564,
            operationType: 'payment',
            skbPaymentOperationType: 'internal_physical_phone_number',
            subType: 'internal_physical_phone_number',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/628293674v0',
            descriptions:
              {
                operationDescription: 'Николаев Николай Н.',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 100320,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: 'По телефону 79024777777',
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2021-05-17T09:02:21+05:00',
            payWallet: false,
            direction: 'debit',
            comment: 'Пополнение лицевого счета Николаев Николай Н.',
            productAccount: '40817810624615409538',
            productCardId: null
          }
      },
      {
        '40817810624615409538': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2021-05-17T09:02:21+05:00'),
        hold: false,
        comment: 'Пополнение лицевого счета Николаев Николай Н.',
        merchant: null,
        movements: [
          {
            id: '1018823564',
            account: { id: 'account' },
            invoice: null,
            sum: -100320,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 100320,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1004179024,
            operationType: 'payment',
            skbPaymentOperationType: 'external_sbp_c2c',
            subType: 'external_sbp_c2c',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/893359999v1',
            descriptions:
              {
                operationDescription: 'Николай Николаевич Н',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 900,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: 'В Сбербанк по телефону 79082717777',
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2021-04-22T12:21:27+05:00',
            payWallet: false,
            direction: 'debit',
            comment: null,
            productAccount: '40817810624615409538',
            productCardId: null
          }
      },
      {
        '40817810624615409538': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2021-04-22T12:21:27+05:00'),
        hold: false,
        comment: 'В Сбербанк по телефону 79082717777',
        merchant: null,
        movements: [
          {
            id: '1004179024',
            account: { id: 'account' },
            invoice: null,
            sum: -900,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 900,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1067028153,
            operationType: 'payment',
            skbPaymentOperationType: 'internal_physical_card',
            subType: 'internal_physical_card',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/628293674v0',
            descriptions:
              {
                operationDescription: 'Николай Николаевич Н.',
                productDescription: 'Счет Visa Classic',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 1200,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: 'На карту ***6978',
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2021-07-24T07:28:12+05:00',
            payWallet: false,
            direction: 'debit',
            comment: 'Пополнение лицевого счета Николай Николаевич Н.',
            productAccount: '40817810711724042935',
            productCardId: null
          }
      },
      {
        '40817810711724042935': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2021-07-24T07:28:12+05:00'),
        hold: false,
        comment: 'Пополнение лицевого счета Николай Николаевич Н.',
        merchant: null,
        movements: [
          {
            id: '1067028153',
            account: { id: 'account' },
            invoice: null,
            sum: -1200,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'ccard',
              instrument: 'RUB',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: 1200,
            fee: 0
          }
        ]
      }
    ]
  ])('should convert outer outcome transfer', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
