import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info: {
          id: 900000001,
          operationType: 'card_transaction',
          skbPaymentOperationType: null,
          subType: 'purchase',
          hasOfdReceipt: false
        },
        view: {
          operationIcon: 'https://ib.delo.ru/imgcache/br21046010ic350545280v0.png',
          descriptions: {
            operationDescription: 'Пятерочка',
            productDescription: 'Mastercard Unembossed',
            productType: 'С карты'
          },
          amounts: {
            amount: 789.67,
            currency: 'RUB',
            feeAmount: 0,
            feeCurrency: 'RUB',
            bonusAmount: 0,
            bonusCurrency: 'RUB',
            cashBackAmount: 0,
            cashBackCurrency: 'RUB'
          },
          mainRequisite: 'МСС: 5411',
          actions: ['sendCheck', 'print', 'dispute'],
          category: {
            id: 394010344,
            internalCode: 'supermarket',
            name: 'Супермаркеты'
          },
          state: 'accepted',
          dateCreated: '2020-08-09T17:55:44+05:00',
          payWallet: true,
          direction: 'debit',
          comment: null,
          productAccount: '40817810700012345678',
          productCardId: 85858585
        }
      },
      {
        '40817810700012345678': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2020-08-09T12:55:44.000Z'),
        hold: true,
        comment: null,
        merchant: {
          country: null,
          city: null,
          title: 'Пятерочка',
          mcc: 5411,
          location: null
        },
        movements: [
          {
            id: '900000001',
            account: { id: 'account' },
            invoice: null,
            sum: -789.67,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info: {
          id: 347900002,
          operationType: 'card_transaction',
          skbPaymentOperationType: null,
          subType: 'purchase',
          hasOfdReceipt: false
        },
        view: {
          operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010347v11.png',
          descriptions: {
            operationDescription: 'RESTORAN "VASILKI"',
            productDescription: 'Mastercard Unembossed',
            productType: 'С карты'
          },
          amounts: {
            amount: 43.95,
            currency: 'BYN',
            feeAmount: 0,
            feeCurrency: 'RUB',
            bonusAmount: 0,
            bonusCurrency: 'RUB',
            cashBackAmount: 0,
            cashBackCurrency: 'RUB'
          },
          mainRequisite: 'МСС: 5812',
          actions: ['sendCheck', 'print'],
          category: {
            id: 394010347,
            internalCode: 'restaurant',
            name: 'Рестораны и кафе'
          },
          state: 'processed',
          dateCreated: '2020-07-21T22:17:05+05:00',
          payWallet: false,
          direction: 'debit',
          comment: null,
          productAccount: '40817810700012345678',
          productCardId: 85858585
        },
        details: {
          id: 347900002,
          payerAccount: '40817810700012345678',
          payerBic: '044520000',
          payeeAccount: null,
          payeeBic: null,
          dateCreated: '2020-07-21T22:17:05+05:00',
          chargeDate: '2020-07-23T00:19:04+05:00',
          cardId: 4141414,
          description: 'Оплата',
          amount: 43.95,
          currency: 'BYN',
          feeAmount: 0,
          feeCurrency: 'RUB',
          convAmount: 1430.9,
          convCurrency: 'RUB',
          terminal: {
            name: 'RESTORAN "VASILKI"',
            address: 'PR.MOSKOVSKIY,9/1',
            city: 'VITEBSK'
          },
          authCode: '777777',
          mccCode: '5812',
          purpose: 'Списание со счета по операции: Оплата RESTORAN "VASILKI"    \\PR.MOSKOVSKIY,9/1\\VITEBSK      \\210013    BLRBLR',
          state: 'processed',
          payWallet: false,
          payWalletDeviceName: null,
          payWalletType: null,
          firstCurrency: 'BYN',
          secondCurrency: 'RUB',
          rate: 32.56,
          cashBackAmount: 0,
          cashBackCurrency: 'RUB',
          bonusAmount: 0,
          bonusCurrency: 'RUB',
          operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010347v11.png',
          descriptions: {
            operationDescription: 'RESTORAN "VASILKI"',
            productDescription: 'Mastercard Unembossed',
            productType: 'С карты'
          },
          category: {
            id: 394010347,
            name: 'Рестораны и кафе'
          },
          direction: 'debit',
          mainRequisite: 'MCC: 5812',
          productAccount: '40817810700012345678',
          productCardId: 85858585,
          actions: ['sendCheck', 'print'],
          ofdReceipt: null
        }
      },
      {
        '40817810700012345678': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2020-07-21T17:17:05.000Z'),
        hold: false,
        comment: null,
        merchant: {
          country: 'BLR',
          city: 'VITEBSK',
          title: 'RESTORAN "VASILKI"',
          mcc: 5812,
          location: null
        },
        movements: [
          {
            id: '347900002',
            account: { id: 'account' },
            invoice: {
              instrument: 'BYN',
              sum: -43.95
            },
            sum: -1430.9,
            fee: 0
          }
        ]
      }
    ]
  ])('should convert usual payment', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })

  it.each([
    [
      {
        info: {
          id: 912618150,
          operationType: 'card_transaction',
          skbPaymentOperationType: null,
          subType: 'purchase',
          hasOfdReceipt: false
        },
        view: {
          operationIcon: 'https://ib.delo.ru/json/icon/394009718v1',
          descriptions: {
            operationDescription: 'Krasniy yar KYa11',
            productDescription: 'Mastercard Unembossed',
            productType: 'С карты'
          },
          amounts: {
            amount: 62.49,
            currency: 'RUB',
            feeAmount: 0,
            feeCurrency: 'RUB',
            bonusAmount: 1.87,
            bonusCurrency: 'RUB',
            cashBackAmount: 0,
            cashBackCurrency: 'RUB',
            cashAmount: null,
            cashCurrency: null,
            bonusAmountMin: 0,
            bonusAmountMax: 0
          },
          mainRequisite: 'МСС: 5411',
          actions: ['sendCheck', 'print', 'dispute'],
          category: {
            id: 394010344,
            internalCode: 'supermarket',
            name: 'Супермаркеты'
          },
          state: 'processed',
          dateCreated: '2020-12-01T09:49:25+05:00',
          payWallet: false,
          direction: 'debit',
          comment: null,
          productAccount: '40817810827415912174',
          productCardId: 626698911
        }
      },
      {
        '40817810827415912174': { id: 'account', instrument: 'RUB' }
      },
      {
        comment: null,
        date: new Date('2020-12-01T09:49:25+05:00'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: 5411,
          title: 'Krasniy yar KYa11'
        },
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '912618150',
            invoice: null,
            sum: -62.49
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 898264024,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'fee-out',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/394009721v1',
            descriptions:
              {
                operationDescription: 'Списание комиссии',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 30,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: null,
            category: { id: 394010370, internalCode: 'services', name: 'Услуги банка' },
            state: 'processed',
            dateCreated: '2020-11-01T23:37:13+05:00',
            payWallet: null,
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
        comment: 'Списание комиссии',
        date: new Date('2020-11-01T23:37:13+05:00'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: 'account' },
            fee: 0,
            id: '898264024',
            invoice: null,
            sum: -30
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1066231277,
            operationType: 'payment',
            skbPaymentOperationType: 'external_corporate',
            subType: 'external_corporate',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/312846344v2',
            descriptions:
              {
                operationDescription: 'ООО УК "Каменный цветок"',
                productDescription: 'Счет Visa Classic',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 1236.99,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: null,
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2021-07-23T08:44:38+05:00',
            payWallet: false,
            direction: 'debit',
            comment: null,
            productAccount: '40817810711724042935',
            productCardId: null
          }
      },
      {
        '40817810711724042935': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2021-07-23T08:44:38+05:00'),
        hold: false,
        comment: null,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'ООО УК "Каменный цветок"'
        },
        movements: [
          {
            id: '1066231277',
            account: { id: 'account' },
            invoice: null,
            sum: -1236.99,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1059219063,
            operationType: 'payment',
            skbPaymentOperationType: 'service_payment',
            subType: 'service_payment',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/6179951v1',
            descriptions:
              {
                operationDescription: 'МТС',
                productDescription: 'Счет Visa Classic',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 370.34,
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
                id: 394010350,
                internalCode: 'communication',
                name: 'Связь, интернет'
              },
            state: 'processed',
            dateCreated: '2021-07-13T23:03:32+05:00',
            payWallet: false,
            direction: 'debit',
            comment: null,
            productAccount: '40817810711724042935',
            productCardId: null
          }
      },
      {
        '40817810711724042935': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2021-07-13T23:03:32+05:00'),
        hold: false,
        comment: null,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'МТС'
        },
        movements: [
          {
            id: '1059219063',
            account: { id: 'account' },
            invoice: null,
            sum: -370.34,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1034997491,
            operationType: 'payment',
            skbPaymentOperationType: 'external_budgetary',
            subType: 'external_budgetary',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/1056698187v0',
            descriptions:
              {
                operationDescription: 'Финансовое управление Администрации Сысертского городского округа (МАДОУ №38)',
                productDescription: 'Счет Visa Classic',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 1501.82,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: null,
            category: { id: 394010364, internalCode: 'budget', name: 'Бюджет РФ' },
            state: 'processed',
            dateCreated: '2021-06-09T14:43:37+05:00',
            payWallet: false,
            direction: 'debit',
            comment: null,
            productAccount: '40817810711724042935',
            productCardId: null
          }
      },
      {
        '40817810711724042935': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2021-06-09T14:43:37+05:00'),
        hold: false,
        comment: null,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title: 'Финансовое управление Администрации Сысертского городского округа (МАДОУ №38)'
        },
        movements: [
          {
            id: '1034997491',
            account: { id: 'account' },
            invoice: null,
            sum: -1501.82,
            fee: 0
          }
        ]
      }
    ]
  ])('should convert outcome', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
