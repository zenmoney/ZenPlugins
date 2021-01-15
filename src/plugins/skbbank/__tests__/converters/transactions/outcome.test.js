import { convertTransaction, convertTransactions } from '../../../converters'

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
      [{
        info: {
          id: 912719894,
          operationType: 'account_transaction',
          skbPaymentOperationType: null,
          subType: 'bonus',
          hasOfdReceipt: false
        },
        view: {
          operationIcon: 'https://ib.delo.ru/json/icon/394009712v1',
          descriptions: {
            operationDescription: 'Компенсация бонусами',
            productDescription: 'Счет Mastercard Unembossed',
            productType: 'На счет карты'
          },
          amounts: {
            amount: 1408.48,
            currency: 'RUB',
            feeAmount: 0,
            feeCurrency: 'RUB',
            bonusAmount: 0,
            bonusCurrency: 'RUB',
            cashBackAmount: 0,
            cashBackCurrency: 'RUB'
          },
          mainRequisite: null,
          actions: ['sendCheck', 'print'],
          category: {
            id: 394010366,
            internalCode: 'replenishment',
            name: 'Пополнения'
          },
          state: 'processed',
          dateCreated: '2020-12-01T11:43:44+05:00',
          payWallet: null,
          direction: 'credit',
          comment: null,
          productAccount: '40817810700015912174',
          productCardId: null
        }
      },
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
      }],
      {
        '40817810827415912174': { id: 'account', instrument: 'RUB' }
      },
      [{
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
        movements: [{
          account: { id: 'account' },
          fee: 0,
          id: '912618150',
          invoice: null,
          sum: -62.49
        }]
      }]
    ]
  ])('should convert usual payment', (rawTransaction, accountsById, transaction) => {
    expect(convertTransactions(rawTransaction, accountsById)).toEqual(transaction)
  })
})
