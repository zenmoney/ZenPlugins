import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info:
          {
            id: 855984970,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'sbp_in',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846257.png',
            descriptions:
              {
                operationDescription: 'Николаев Николай Николаевич',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'На счет карты'
              },
            amounts:
              {
                amount: 10000,
                currency: 'RUB',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: 'RUB',
                cashBackAmount: 0,
                cashBackCurrency: 'RUB'
              },
            mainRequisite: 'Из АО "ТИНЬКОФФ БАНК"',
            actions: ['sendCheck', 'print', 'reversePayment'],
            category:
              {
                id: 394010366,
                internalCode: 'replenishment',
                name: 'Пополнения'
              },
            state: 'processed',
            dateCreated: '2020-08-20T11:08:36+05:00',
            payWallet: null,
            direction: 'credit',
            comment: 'Перевод с использованием Системы быстрых платежей',
            productAccount: '40817810100015387612',
            productCardId: null
          }
      },
      {
        '40817810100015387612': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2020-08-20T06:08:36.000Z'),
        hold: false,
        comment: 'Перевод с использованием Системы быстрых платежей',
        merchant: null,
        movements: [
          {
            id: '855984970',
            account: { id: 'account' },
            invoice: null,
            sum: 10000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -10000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 856924379,
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
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2020-08-22T17:23:49+05:00',
            payWallet: false,
            direction: 'credit',
            comment: null,
            productAccount: null,
            productCardId: 170971097
          },
        details:
          {
            actions: ['sendCheck', 'print', 'toFavorite', 'repeatable'],
            amount: 10000,
            'another-person-payment': null,
            bankSystemId: null,
            bonusAmount: null,
            category: { id: 394010367, name: 'Переводы' },
            charge: '2020-08-22T17:24:19+05:00',
            comment: null,
            controlValue: null,
            convAmount: null,
            convCurrency: null,
            counterpartyId: null,
            'create-date': '2020-08-22T17:23:49+05:00',
            currency: 'RUB',
            data_contacts: { 'always-notify': false, 'counterparty-notify': false },
            dateCreated: '2020-08-22T17:23:49+05:00',
            'debtor-city': null,
            'debtor-flat': null,
            'debtor-house': null,
            'debtor-inn': null,
            'debtor-kpp': null,
            'debtor-lastname': null,
            'debtor-middlename': null,
            'debtor-name': null,
            'debtor-nonResident': null,
            'debtor-street': null,
            'debtor-type': null,
            direction: 'debit',
            ekassir: false,
            feeAmount: 0,
            feeCurrency: 'RUB',
            fields: {},
            firstCurrency: null,
            icon:
              {
                hash: '1a751336e99fa57c3295ab785571db69',
                url: '/imgcache/bankData628293674_1a751336e99fa57c3295ab785571db69.png'
              },
            internalCode: null,
            kvvo: null,
            limit: null,
            linked_document_id: null,
            linked_document_type: null,
            mainRequisite: 'С карты ****4617',
            nds: 0,
            ndsType: null,
            operationDescription: 'В "СКБ-Банк" на карту ***6004',
            operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846246.png',
            'order-date': '2020-08-22',
            orderedRequisites: [{ name: 'Банк получателя', value: 'СКБ-Банк' }],
            originalRegistry: null,
            outdated: false,
            'payee-account': null,
            'payee-bank-account': null,
            'payee-bank-bic': null,
            'payee-bank-name': null,
            'payee-card': '170537804',
            'payee-card-id': null,
            'payee-card-mask-pan': '548386******6004',
            'payee-inn': null,
            'payee-kpp': null,
            'payee-member-id': null,
            'payee-name': null,
            'payee-phone': null,
            'payer-account': null,
            'payer-bank-account': null,
            'payer-bank-bic': null,
            'payer-bank-name': null,
            'payer-card': '170971097',
            'payer-card-mask-pan': '427681******4617',
            'payer-inn': null,
            'payer-kpp': null,
            'payment-date': null,
            'payment-kind': null,
            'payment-number': '142',
            'payment-operation-type': 'externalPayment',
            'payment-type': null,
            payout: null,
            'payout.date': null,
            'payout.type': null,
            pointOfInitiationMethod: null,
            priority: '5',
            productAccount: null,
            productCardId: 170971097,
            productDescription: 'Сбербанк',
            productType: 'С карты',
            profit: null,
            purpose: 'Перевод с карты на карту',
            purposeCode: null,
            qrIdentifier: null,
            rate: null,
            reason: null,
            registryPaidAmount: null,
            relatedRegistryPayment: false,
            requisites: { 'Банк получателя': 'СКБ-Банк' },
            'rest-amount': null,
            revokeRejectReason: null,
            secondCurrency: 'RUB',
            skbPaymentOperationType: 'p2p',
            state: 'processed',
            'tax-101': null,
            'tax-104': null,
            'tax-105': null,
            'tax-106': null,
            'tax-107': null,
            'tax-108': null,
            'tax-109': null,
            'tax-110': null,
            uin: null,
            'zhkkh.communalPayment': null,
            'zhkkh.consumerApartment': null,
            'zhkkh.consumerInn': null,
            'zhkkh.consumerMName': null,
            'zhkkh.consumerName': null,
            'zhkkh.consumerPlacement': null,
            'zhkkh.consumerSName': null,
            'zhkkh.documentId': null,
            'zhkkh.fiasCode': null,
            'zhkkh.payDate': null,
            'zhkkh.perfDocNumber': null,
            'zhkkh.personalAccount': null,
            'zhkkh.singlePersonalAcc': null,
            'zhkkh.type': null
          }
      },
      {
        170537804: { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2020-08-22T12:23:49.000Z'),
        hold: false,
        comment: 'В "СКБ-Банк" на карту ***6004',
        merchant: null,
        movements: [
          {
            id: '856924379',
            account: {
              id: 'account'
            },
            invoice: null,
            sum: 10000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: [
                '427681******4617'
              ],
              company: null
            },
            invoice: null,
            sum: -10000.00,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 847324006,
            operationType: 'account_transaction',
            skbPaymentOperationType: null,
            subType: 'transfer-in',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846257.png',
            descriptions:
              {
                operationDescription: 'ВАСИЛЬЕВ ВАСИЛИЙ ВАСИЛЬЕВИЧ',
                productDescription: 'Счет RUB',
                productType: 'На счет'
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
            mainRequisite: null,
            actions: ['sendCheck', 'print', 'reversePayment'],
            category:
              {
                id: 394010366,
                internalCode: 'replenishment',
                name: 'Пополнения'
              },
            state: 'processed',
            dateCreated: '2020-07-13T05:47:02+05:00',
            payWallet: null,
            direction: 'credit',
            comment: null,
            productAccount: '40817810239923088530',
            productCardId: null
          }
      },
      {
        '40817810239923088530': { id: 'account', instrument: 'RUB' }
      },
      {
        date: new Date('2020-07-13T05:47:02+05:00'),
        hold: false,
        comment: 'На счет',
        merchant: null,
        movements: [
          {
            id: '847324006',
            account: { id: 'account' },
            invoice: null,
            sum: 6000,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: null,
              company: null
            },
            invoice: null,
            sum: -6000,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 969644936,
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
                operationDescription: 'Досрочное закрытие вклада',
                productDescription: 'Обыкновенное чудо!!',
                productType: 'Со вклада'
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
            mainRequisite: 'На "Счет Mastercard Unembossed"',
            category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
            state: 'processed',
            dateCreated: '2021-03-02T15:58:38+05:00',
            payWallet: null,
            direction: 'internal',
            comment: null,
            productAccount: '42306810925701652119',
            productCardId: null
          },
        details: {
          actions: ['sendCheck', 'print'],
          amount: 425686.13,
          bankSystemId: '7079140845',
          category: { id: 394010367, internalCode: 'transfer', name: 'Переводы' },
          chargeDate: '2021-03-02T15:58:45+05:00',
          comment: 'Списание суммы на связанный договор при закрытии',
          convAmount: null,
          convCurrency: null,
          currency: 'RUB',
          dateCreated: '2021-03-02T15:58:38+05:00',
          descriptions:
            {
              operationDescription: 'Досрочное закрытие вклада',
              productDescription: 'Обыкновенное чудо!!',
              productType: 'Со вклада'
            },
          direction: 'internal',
          feeAmount: 0,
          feeCurrency: 'RUB',
          firstCurrency: null,
          id: 969644936,
          mainRequisite: 'На "Счет Mastercard Unembossed"',
          operationIcon: 'https://ib.delo.ru/json/icon/394009711v1',
          orderedRequisites: [],
          payeeAccount: '40817810825715720880',
          payeeBic: '046577756',
          payerAccount: '42306810925701652119',
          payerBic: '046577756',
          productAccount: '42306810925701652119',
          productCardId: null,
          rate: null,
          requisites: {},
          secondCurrency: null,
          state: 'processed',
          transactionType: 'transfer-own'
        }
      },
      {
        '42305810725700366005': { id: 'account1', instrument: 'RUB' },
        '40817810825715720880': { id: 'account2', instrument: 'RUB' }
      },
      {
        date: new Date('2021-03-02T15:58:38+05:00'),
        hold: false,
        comment: 'Досрочное закрытие вклада',
        merchant: null,
        movements: [
          {
            id: '969644936',
            account: { id: 'account2' },
            invoice: null,
            sum: 425686.13,
            fee: 0
          },
          {
            id: null,
            account: {
              type: null,
              instrument: 'RUB',
              syncIds: [
                '42306810925701652119'
              ],
              company: null
            },
            invoice: null,
            sum: -425686.13,
            fee: 0
          }
        ]
      }
    ]
  ])('should convert outer income transfer', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
