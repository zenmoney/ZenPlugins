import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info:
          {
            id: 847324007,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'loan-repayment',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010369v11.png',
            descriptions:
              {
                operationDescription: 'Погашение кредита',
                productDescription: 'Счет RUB',
                productType: 'Со счета'
              },
            amounts:
              {
                amount: 6000,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: '"ПЕРСОНАЛЬНОЕ ПРЕДЛОЖЕНИЕ (потребительский кредит)" от 13.03.2014 на сумму 216 300,00 рублей',
            actions: ['sendCheck', 'print'],
            category: {
              id: 394010369,
              internalCode: 'loan',
              name: 'Кредиты'
            },
            state: 'processed',
            dateCreated: '2020-07-13T22:55:50+05:00',
            payWallet: null,
            direction: 'debit',
            comment: null,
            productAccount: '40817810239923082636',
            productCardId: null
          }
      },
      {},
      null
    ],
    [
      {
        info:
          {
            id: 856924346,
            operationType: 'payment',
            skbPaymentOperationType: 'p2p',
            subType: 'p2p',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846246.png',
            descriptions:
              {
                operationDescription: 'В "СКБ-Банк" на карту ***6004',
                productDescription: 'Сбербанк',
                productType: 'C карты'
              },
            amounts:
              {
                amount: 10000,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: 'С карты ***4617',
            actions: ['sendCheck', 'print', 'toFavorite', 'repeatable'],
            category: {
              id: 394010367,
              internalCode: 'transfer',
              name: 'Переводы'
            },
            state: 'rejected',
            dateCreated: '2020-08-22T17:23:19+05:00',
            payWallet: false,
            direction: 'credit',
            comment: null,
            productAccount: null,
            productCardId: 170971097
          }
      },
      {},
      null
    ],
    [
      {
        info: {
          id: 2695294202,
          operationType: 'account_transaction',
          skbPaymentOperationType: null,
          subType: 'sbp_in',
          hasOfdReceipt: false
        },
        view: {
          operationIcon: 'https://ib.delo.ru/json/icon/2011970043v0',
          descriptions:
            {
              operationDescription: 'Любовь Николаевна П',
              productDescription: 'Счет 20%',
              productType: 'На счет'
            },
          amounts: {
            amount: 300,
            currency: 'RUB',
            feeAmount: 0,
            feeCurrency: 'RUB',
            bonusAmount: null,
            bonusCurrency: 'RUB',
            cashBackAmount: 0,
            cashBackCurrency: 'RUB'
          },
          mainRequisite: 'Из ООО "ОЗОН Банк"',
          category: {
            id: 394010366,
            internalCode: 'replenishment',
            name: 'Пополнения'
          },
          state: 'processed',
          dateCreated: '2025-07-23T19:06:40+05:00',
          payWallet: null,
          direction: 'credit',
          comment: 'Перевод с использованием Системы быстрых платежей',
          productAccount: '40817810000000000003',
          productCardId: null
        }
      },
      {
        '40817810000000000001': {
          id: 'account1',
          instrument: 'RUB'
        }
        /*
        '40817810000000000003': { // Нет в списке своих аккаунтов
          id: 'account2',
          instrument: 'RUB'
        }
        */
      },
      null
    ]
  ])('skips specific transaction', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
