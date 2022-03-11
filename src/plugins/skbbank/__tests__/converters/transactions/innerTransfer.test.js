import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        info: {
          id: 900000001,
          operationType: 'payment',
          skbPaymentOperationType: 'transfer_rub',
          subType: 'transfer_rub',
          hasOfdReceipt: false
        },
        view: {
          operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846246.png',
          descriptions: {
            operationDescription: 'Между счетами',
            productDescription: 'Счет RUB',
            productType: 'Со счета'
          },
          amounts: {
            amount: 1000,
            currency: 'RUB',
            feeAmount: 0,
            feeCurrency: 'RUB',
            bonusAmount: 0,
            bonusCurrency: null,
            cashBackAmount: 0,
            cashBackCurrency: null
          },
          mainRequisite: 'На "Счет Mastercard Unembossed"',
          actions: ['sendCheck', 'print', 'toFavorite', 'repeatable'],
          category: {
            id: 394010367,
            internalCode: 'transfer',
            name: 'Переводы'
          },
          state: 'processed',
          dateCreated: '2020-08-09T19:23:32+05:00',
          payWallet: false,
          direction: 'internal',
          comment: null,
          productAccount: '40817810900016392697',
          productCardId: null
        },
        details: {
          actions: ['sendCheck', 'print', 'toFavorite', 'repeatable'],
          amount: 1000,
          'another-person-payment': null,
          bankSystemId: '6741705204',
          bonusAmount: null,
          category: {
            id: 394010367,
            name: 'Переводы'
          },
          charge: '2020-08-09T00:00:00+05:00',
          comment: null,
          controlValue: null,
          convAmount: null,
          convCurrency: null,
          counterpartyId: null,
          'create-date': '2020-08-09T19:23:32+05:00',
          currency: 'RUB',
          data_contacts: {},
          dateCreated: '2020-08-09T19:23:32+05:00',
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
          direction: 'internal',
          ekassir: false,
          feeAmount: 0,
          feeCurrency: 'RUB',
          fields: {},
          firstCurrency: null,
          icon: {
            hash: '1a751336e99fa57c3295ab785571db69',
            url: '/imgcache/bankData628293674_1a751336e99fa57c3295ab785571db69.png'
          },
          internalCode: null,
          kvvo: null,
          limit: null,
          linked_document_id: null,
          linked_document_type: null,
          mainRequisite: 'На "Счет Mastercard Unembossed"',
          nds: 20,
          ndsType: '3',
          operationDescription: 'Между счетами',
          operationIcon: 'https://ib.delo.ru/imgcache/bankIcon_ii312846246.png',
          'order-date': '2020-08-09',
          orderedRequisites: [],
          originalRegistry: null,
          outdated: false,
          'payee-account': '40817810700012345678',
          'payee-bank-account': '30101810045250000000',
          'payee-bank-bic': '044520000',
          'payee-bank-name': 'ФИЛИАЛ "МОСКОВСКИЙ" ПАО "СКБ-БАНК"',
          'payee-card': null,
          'payee-card-id': null,
          'payee-card-mask-pan': null,
          'payee-inn': null,
          'payee-kpp': null,
          'payee-member-id': null,
          'payee-name': 'Иванов Иван Иванович',
          'payee-phone': null,
          'payer-account': '40817810900087654321',
          'payer-bank-account': '30101810045250000000',
          'payer-bank-bic': '044520000',
          'payer-bank-name': 'ФИЛИАЛ "МОСКОВСКИЙ" ПАО "СКБ-БАНК"',
          'payer-card': null,
          'payer-card-mask-pan': null,
          'payer-inn': null,
          'payer-kpp': null,
          'payment-date': null,
          'payment-kind': null,
          'payment-number': '3',
          'payment-operation-type': 'transfer',
          'payment-type': null,
          payout: null,
          'payout.date': null,
          'payout.type': null,
          pointOfInitiationMethod: null,
          priority: '5',
          productAccount: '40817810900087654321',
          productCardId: null,
          productDescription: 'Счет RUB',
          productType: 'Со счета',
          profit: null,
          purpose: 'Перевод между счетами.',
          purposeCode: null,
          qrIdentifier: null,
          rate: null,
          reason: null,
          registryPaidAmount: null,
          requisites: {},
          'rest-amount': null,
          revokeRejectReason: null,
          secondCurrency: 'RUB',
          skbPaymentOperationType: 'transfer_rub',
          state: 'processed',
          uin: null
        }
      },
      {
        '40817810900087654321': {
          id: 'account1',
          instrument: 'RUB'
        },
        '40817810900016392697': {
          id: 'account',
          instrument: 'RUB'
        },
        '40817810700012345678': {
          id: 'account2',
          instrument: 'RUB'
        }
      },
      {
        date: new Date('2020-08-09T14:23:32.000Z'),
        hold: false,
        comment: null,
        merchant: null,
        movements: [
          {
            id: '900000001',
            account: {
              id: 'account2'
            },
            invoice: null,
            sum: 1000,
            fee: 0
          },
          {
            id: '900000001',
            account: {
              id: 'account1'
            },
            invoice: null,
            sum: -1000,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info: {
          id: 850999999,
          operationType: 'account_transaction',
          skbPaymentOperationType: null,
          subType: 'transfer-own',
          hasOfdReceipt: false
        },
        view: {
          operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010367v11.png',
          descriptions: {
            operationDescription: 'Вклады: открытие вклада Исполнение желаний        +',
            productDescription: 'Счет Mastercard Unembossed',
            productType: 'Со счета карты'
          },
          amounts: {
            amount: 10000,
            currency: 'RUB',
            feeAmount: 0,
            feeCurrency: 'RUB',
            bonusAmount: 0,
            bonusCurrency: 'RUB',
            cashBackAmount: 0,
            cashBackCurrency: 'RUB'
          },
          mainRequisite: 'На "Исполнение желаний + (срочный вклад)"',
          actions: ['sendCheck', 'print'],
          category: {
            id: 394010367,
            internalCode: 'transfer',
            name: 'Переводы'
          },
          state: 'processed',
          dateCreated: '2020-08-07T16:16:16+05:00',
          payWallet: null,
          direction: 'internal',
          comment: null,
          productAccount: '40817810700012345678',
          productCardId: null
        },
        details: {
          actions: ['sendCheck', 'print'],
          amount: 10000,
          bankSystemId: '6741190000',
          category: {
            id: 394010367,
            internalCode: 'transfer',
            name: 'Переводы'
          },
          chargeDate: '2020-08-07T16:16:16+05:00',
          comment: 'Перевод между счетами через систему ДБО',
          convAmount: null,
          convCurrency: null,
          currency: 'RUB',
          dateCreated: '2020-08-07T16:16:16+05:00',
          descriptions: {
            operationDescription: 'Вклады: открытие вклада Исполнение желаний        +',
            productDescription: 'Счет Mastercard Unembossed',
            productType: 'Со счета карты'
          },
          direction: 'internal',
          feeAmount: 0,
          feeCurrency: 'RUB',
          firstCurrency: null,
          id: 850999999,
          mainRequisite: 'На "Исполнение желаний + (срочный вклад)"',
          operationIcon: 'https://ib.delo.ru/imgcache/operation_category394010367v11.png',
          orderedRequisites: [],
          payeeAccount: '42305810330000000042',
          payeeBic: '044520000',
          payerAccount: '40817810700012345678',
          payerBic: '044520000',
          productAccount: '40817810700012345678',
          productCardId: null,
          rate: null,
          requisites: {},
          secondCurrency: null,
          state: 'processed',
          transactionType: 'transfer-own'
        }
      },
      {
        '40817810700012345678': {
          id: 'account1',
          instrument: 'RUB'
        },
        '42305810330000000042': {
          id: 'account2',
          instrument: 'RUB'
        }
      },
      {
        date: new Date('2020-08-07T11:16:16.000Z'),
        hold: false,
        comment: null,
        merchant: null,
        movements: [
          {
            id: '850999999',
            account: {
              id: 'account2'
            },
            invoice: null,
            sum: 10000,
            fee: 0
          },
          {
            id: '850999999',
            account: {
              id: 'account1'
            },
            invoice: null,
            sum: -10000,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 969744689,
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
                operationDescription: 'Вклады: открытие вклада Исполнение желаний +',
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
            mainRequisite: 'На "Исполнение желаний + (срочный вклад)"',
            category: {
              id: 394010367,
              internalCode: 'transfer',
              name: 'Переводы'
            },
            state: 'processed',
            dateCreated: '2021-03-02T18:04:08+05:00',
            payWallet: null,
            direction: 'internal',
            comment: null,
            productAccount: '40817810825715720880',
            productCardId: null
          },
        details: {
          actions: ['sendCheck', 'print'],
          amount: 425686.13,
          bankSystemId: '7079293128',
          category: {
            id: 394010367,
            internalCode: 'transfer',
            name: 'Переводы'
          },
          chargeDate: '2021-03-02T18:04:21+05:00',
          comment: 'Перевод между счетами через систему ДБО',
          convAmount: null,
          convCurrency: null,
          currency: 'RUB',
          dateCreated: '2021-03-02T18:04:08+05:00',
          descriptions:
            {
              operationDescription: 'Вклады: открытие вклада Исполнение желаний +',
              productDescription: 'Счет Mastercard Unembossed',
              productType: 'Со счета карты'
            },
          direction: 'internal',
          feeAmount: 0,
          feeCurrency: 'RUB',
          firstCurrency: null,
          id: 969744689,
          mainRequisite: 'На "Исполнение желаний + (срочный вклад)"',
          operationIcon: 'https://ib.delo.ru/json/icon/394009711v1',
          orderedRequisites: [],
          payeeAccount: '42305810725700366005',
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
        '40817810825715720880': {
          id: 'account1',
          instrument: 'RUB'
        },
        '42305810725700366005': {
          id: 'account2',
          instrument: 'RUB'
        }
      },
      {
        date: new Date('2021-03-02T18:04:08+0500'),
        hold: false,
        comment: null,
        merchant: null,
        movements: [
          {
            id: '969744689',
            account: { id: 'account2' },
            invoice: null,
            sum: 425686.13,
            fee: 0
          },
          {
            id: '969744689',
            account: { id: 'account1' },
            invoice: null,
            sum: -425686.13,
            fee: 0
          }
        ]
      }
    ],
    [
      {
        info:
          {
            id: 1222757182,
            operationType: 'payment',
            skbPaymentOperationType: 'transfer_currency',
            subType: 'transfer_currency',
            hasOfdReceipt: false
          },
        view:
          {
            operationIcon: 'https://ib.delo.ru/json/icon/628293674v0',
            descriptions:
              {
                operationDescription: 'Между счетами',
                productDescription: 'Счет Mastercard Unembossed',
                productType: 'Со счета карты'
              },
            amounts:
              {
                amount: 1000,
                currency: 'EUR',
                feeAmount: 0,
                feeCurrency: 'RUB',
                bonusAmount: 0,
                bonusCurrency: null,
                cashBackAmount: 0,
                cashBackCurrency: null
              },
            mainRequisite: 'На "Саша"',
            category: {
              id: 394010367,
              internalCode: 'transfer',
              name: 'Переводы'
            },
            state: 'processed',
            dateCreated: '2022-02-15T20:25:02+05:00',
            payWallet: false,
            direction: 'internal',
            comment: null,
            productAccount: '40817810623215495862',
            productCardId: null
          },
        details: {
          actions: ['sendCheck', 'print', 'toFavorite', 'repeatable'],
          amount: 1000,
          'another-person-payment': null,
          bankSystemId: '7507095252',
          bonusAmount: null,
          category: {
            id: 394010367,
            name: 'Переводы'
          },
          charge: '2022-02-15T00:00:00+05:00',
          comment: null,
          controlValue: null,
          convAmount: 86900,
          convCurrency: 'RUB',
          counterpartyId: null,
          'create-date': '2022-02-15T20:25:02+05:00',
          currency: 'EUR',
          data_contacts: {},
          dateCreated: '2022-02-15T20:25:02+05:00',
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
          deliveryDate: null,
          direction: 'internal',
          ekassir: false,
          feeAmount: 0,
          feeCurrency: 'RUB',
          fields: {},
          firstCurrency: 'EUR',
          icon:
            {
              hash: '1a751336e99fa57c3295ab785571db69',
              url: '/imgcache/bankData628293674_1a751336e99fa57c3295ab785571db69.png'
            },
          internalCode: null,
          kvvo: null,
          limit: null,
          linked_document_id: 1222757079,
          linked_document_type: 'ru.infosysco.ibank.model.CurrencyExchangeRequest',
          mainRequisite: 'На "Саша"',
          messageId: null,
          nds: 20,
          ndsType: '3',
          operationDescription: 'Между счетами',
          operationIcon: 'https://ib.delo.ru/json/icon/628293674v0',
          'order-date': '2022-02-15',
          orderedRequisites: [],
          originalRegistry: null,
          outdated: true,
          'payee-account': '40817978100016682342',
          'payee-bank-account': '30101810800000000756',
          'payee-bank-bic': '046577756',
          'payee-bank-name': 'ПАО "СКБ-БАНК"',
          'payee-card': null,
          'payee-card-id': null,
          'payee-card-mask-pan': null,
          'payee-inn': null,
          'payee-kpp': null,
          'payee-member-id': null,
          'payee-name': 'Иванов Иван Иванович',
          'payee-phone': null,
          'payer-account': '40817810623215495862',
          'payer-bank-account': '30101810800000000756',
          'payer-bank-bic': '046577756',
          'payer-bank-name': 'ПАО "СКБ-БАНК"',
          'payer-card': null,
          'payer-card-mask-pan': null,
          'payer-inn': null,
          'payer-kpp': null,
          'payment-date': null,
          'payment-kind': null,
          'payment-number': '127',
          'payment-operation-type': 'transfer',
          'payment-type': null,
          payout: null,
          'payout.date': null,
          'payout.type': null,
          pointOfInitiationMethod: null,
          prepaymentReturnDate: null,
          priority: '5',
          productAccount: '40817810623215495862',
          productCardId: null,
          productDescription: 'Счет Mastercard Unembossed',
          productType: 'Со счета карты',
          profit: null,
          purpose: ' Покупка иностранной валюты по договору на покупку-продажу валюты N 11 от 15.02.2022 по курсу банка 86.9000 RUB/EUR',
          purposeCode: null,
          qrIdentifier: null,
          rate: 86.9,
          reason: null,
          registryPaidAmount: null,
          registryParentId: null,
          relatedRegistryPayment: false,
          repeatable: true,
          requisites: {},
          'rest-amount': null,
          revokeRejectReason: null,
          secondCurrency: 'RUB',
          signature: null,
          skbPaymentOperationType: 'transfer_currency',
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
        '40817810623215495862': {
          id: 'account1',
          instrument: 'RUB'
        },
        '40817978100016682342': {
          id: 'account2',
          instrument: 'EUR'
        }
      },
      {
        date: new Date('2022-02-15T18:25:02+03:00'),
        hold: false,
        merchant: null,
        movements:
          [
            {
              id: '1222757182',
              account: { id: 'account2' }, // Получатель 'EUR'
              invoice: null,
              sum: 1000,
              fee: 0
            },
            {
              id: '1222757182',
              account: { id: 'account1' }, // Отправитель 'RUB'
              invoice: {
                sum: -1000,
                instrument: 'EUR'
              },
              sum: -86900,
              fee: 0
            }
          ],
        comment: null
      }
    ]
  ])('should convert inner transfer', (rawTransaction, accountsById, transaction) => {
    expect(convertTransaction(rawTransaction, accountsById)).toEqual(transaction)
  })
})
