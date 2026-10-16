import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        accounts: [
          {
            productClassId: 1,
            productTypeId: 891,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000003',
            contractNumber: '1000003',
            refContractNumber: null,
            account: 'BY78BPSB3014F000000001000003',
            name: 'МПЦ Карточный счет Virtuon (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1583874000000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 1.97,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №707 на Свердлова',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-707',
            contractAccount: 'BY30BPSB30141000000000000004',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [{
              contractId: '100000003',
              contract: null,
              productTypeId: null,
              productName: null,
              icon: 'ic_visa',
              imageUri: 'visa_virtuon.png',
              background: null,
              backColor1: '#8E69C1',
              backColor2: '#0A48A2',
              dominantColor: '#039c39',
              textColor: 'ffffffff',
              status: 0,
              cardId: '100000004',
              panCode: '411111******2222',
              name: 'МПЦ Visa Virtuon, BYN',
              yearEnd: 2021,
              monthEnd: 3,
              amount: 0.0,
              descr: '0',
              processingCenter: 1,
              properties: ['IS_VIRTUON', 'IS_APPLE_PAY'],
              paymentSystemId: '1',
              isFamily: false,
              cardholderName: 'TEST USERTWO'
            }],
            actionList: [{
              actionCode: 1050504,
              actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
              actionGroup: 700
            }, {
              actionCode: 1050505,
              actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
              actionGroup: 700
            }, {
              actionCode: 1051028,
              actionName: 'Подключение/изменение набора категорий money-back',
              actionGroup: 700
            }]
          },
          {
            productClassId: 2,
            productTypeId: 821,
            productName: null,
            icon: 'ic_deposit_active',
            background: '',
            backColor1: '#1DCD81',
            backColor2: '#3BDB6A',
            contractType: 1,
            contractId: '100000005',
            contractNumber: '1043333',
            refContractNumber: null,
            account: 'BY85BPSB3014F000000001043333',
            name: 'МПЦ Карточный счет физических лиц (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1538946000000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 1.97,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №704 на Уральской',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-704',
            contractAccount: 'BY73BPSB30141000000000000006',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [],
            actionList:
              [{
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          }
        ],
        moneyBoxes: [{
          id: '00000000-0000-4000-8000-000000000001',
          name: 'Цель один + цель два',
          created: 1575574380000,
          closed: 1585325791000,
          status: 'OPENED',
          statusDescription: 'Закрытая копилка',
          targetAmount: 200,
          targetDate: 1583625600000,
          image: null,
          imageURL: null,
          contractCurrency: '933',
          contractId: '1000007',
          balance: 100,
          phone: '375290000001',
          email: null,
          contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
          percRate: 3,
          settings: [
            {
              id: '00000000-0000-4000-8000-000000000002',
              status: 'DISABLE',
              refillType: 'INCOME',
              cardId: '100000008',
              cardPan: '411111******5555',
              contractId: null,
              fixedAmount: null,
              fixedSchedule: null,
              fixedPeriod: null,
              operationsPercent: 80,
              operationsMaxAmount: 400,
              created: 1581756955000,
              lastAttemptDate: null,
              lastTransferDate: 1581756955000,
              startDate: null,
              nextDate: 1581800400000
            }, {
              id: '00000000-0000-4000-8000-000000000003',
              status: 'DISABLE',
              refillType: 'INCOME',
              cardId: '100000008',
              cardPan: '411111******5555',
              contractId: null,
              fixedAmount: null,
              fixedSchedule: null,
              fixedPeriod: null,
              operationsPercent: 85,
              operationsMaxAmount: 400,
              created: 1581793872000,
              lastAttemptDate: null,
              lastTransferDate: 1582526374000,
              startDate: null,
              nextDate: 1583701200000
            }
          ],
          ibannum: 'BY87BPSB3014F100000000000009'
        }]
      },
      {
        accounts: [{
          id: '100000003',
          type: 'ccard',
          title: '*2222',
          instrument: 'BYN',
          syncID: [
            'BY78BPSB3014F000000001000003',
            '411111******2222'
          ],
          balance: 1.97
        }, {
          id: '100000005',
          type: 'ccard',
          title: '*3333',
          instrument: 'BYN',
          syncID: [
            'BY85BPSB3014F000000001043333'
          ],
          balance: 1.97
        },
        {
          id: '00000000-0000-4000-8000-000000000001',
          type: 'checking',
          title: 'Цель один + цель два',
          instrument: 'BYN',
          syncID: [
            'BY87BPSB3014F100000000000009'
          ],
          balance: 100,
          savings: true,
          archive: false
        }
        ],
        accountsByContractNumber: {
          1000003: {
            id: '100000003',
            instrument: 'BYN'
          },
          1043333: {
            id: '100000005',
            instrument: 'BYN'
          },
          1000007: {
            id: '00000000-0000-4000-8000-000000000001',
            instrument: 'BYN'
          }
        },
        products: [
          {
            id: '100000004',
            type: 'card'
          }
        ]
      }
    ],
    [
      {
        accounts: [
          {
            productClassId: 1,
            productTypeId: 821,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000009',
            contractNumber: '1000008',
            refContractNumber: null,
            account: 'BY40BPSB3014F000000001000008',
            name: 'ЛПЦ Карточный счет физических лиц (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1539032400000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 3340.33,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №704 на Уральской',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-704',
            contractAccount: 'BY73BPSB30141000000000000006',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: '1000009',
            packageContractKind: '92022',
            isFamily: false,
            cardList: [{
              contractId: '100000009',
              contract: null,
              productTypeId: 8032,
              productName: null,
              icon: 'ic_mastercard',
              imageUri: 'mc_gold_chip_paypass.png',
              background: null,
              backColor1: '#FABB40',
              backColor2: '#EF6A5D',
              dominantColor: '#ca9730',
              textColor: 'ff000000',
              status: 0,
              cardId: '100000010',
              panCode: '555555******6666',
              name: 'ЛПЦ MC Gold Chip PayPass, BYN',
              yearEnd: 2021,
              monthEnd: 10,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              cardholderName: 'TEST USERTWO'
            },
            {
              contractId: '100000009',
              contract: null,
              productTypeId: 8043,
              productName: null,
              icon: 'ic_mastercard',
              imageUri: 'bps_master_silver_paypass_20160727.png',
              background: null,
              backColor1: '#FABB40',
              backColor2: '#EF6A5D',
              dominantColor: '#a8abae',
              textColor: 'ff000000',
              status: 0,
              cardId: '100000011',
              panCode: '555555******7777',
              name: 'ЛПЦ MC Standard Chip PayPass, BYN',
              yearEnd: 2022,
              monthEnd: 12,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              cardholderName: 'TEST USERTWO'
            }],
            actionList: [
              {
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 1,
            productTypeId: 815,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000012',
            contractNumber: '1000010',
            refContractNumber: null,
            account: 'BY83BPSB3014F000000001000010',
            name: 'ЛПЦ Карточный счет физических лиц (EUR)',
            currencyCode: '978',
            currencyName: 'EUR',
            dateStart: 1539896400000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 0,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №704 на Уральской',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-704',
            contractAccount: 'BY08BPSB30141000000000000012',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '100000012',
                contract: null,
                productTypeId: 8216,
                productName: null,
                icon: 'ic_mastercard',
                imageUri: 'bps_master_silver_paypass_20160727.png',
                background: null,
                backColor1: '#FABB40',
                backColor2: '#EF6A5D',
                dominantColor: '#a8abae',
                textColor: 'ff000000',
                status: 0,
                cardId: '100000013',
                panCode: '555555******8888',
                name: 'ЛПЦ MC Standard Momentum Chip, EUR',
                yearEnd: 2021,
                monthEnd: 10,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }
            ],
            actionList: [
              {
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 1,
            productTypeId: 813,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000014',
            contractNumber: '1000011',
            refContractNumber: null,
            account: 'BY56BPSB3014F000000001000011',
            name: 'ЛПЦ Карточный счет физических лиц (RUB)',
            currencyCode: '643',
            currencyName: 'RUB',
            dateStart: 1539896400000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 0,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №704 на Уральской',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-704',
            contractAccount: 'BY51BPSB30141000000000000014',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '100000014',
                contract: null,
                productTypeId: 8230,
                productName: null,
                icon: 'ic_visa',
                imageUri: 'visa_classic_chip.png',
                background: null,
                backColor1: '#8E69C1',
                backColor2: '#0A48A2',
                dominantColor: '#a3a7a9',
                textColor: 'ffffffff',
                status: 0,
                cardId: '100000015',
                panCode: '411111******9999',
                name: 'ЛПЦ Visa Classic Momentum Chip, RUB',
                yearEnd: 2021,
                monthEnd: 10,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }
            ],
            actionList: [
              {
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }
            ]
          },
          {
            productClassId: 1,
            productTypeId: 812,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000016',
            contractNumber: '1000012',
            refContractNumber: null,
            account: 'BY29BPSB3014F000000001000012',
            name: 'ЛПЦ Карточный счет физических лиц (USD)',
            currencyCode: '840',
            currencyName: 'USD',
            dateStart: 1539896400000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 0,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №704 на Уральской',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-704',
            contractAccount: 'BY94BPSB30141000000000000016',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '100000016',
                contract: null,
                productTypeId: 8228,
                productName: null,
                icon: 'ic_visa',
                imageUri: 'visa_classic_chip.png',
                background: null,
                backColor1: '#8E69C1',
                backColor2: '#0A48A2',
                dominantColor: '#a3a7a9',
                textColor: 'ffffffff',
                status: 0,
                cardId: '100000017',
                panCode: '411111******0101',
                name: 'ЛПЦ Visa Classic Momentum Chip, USD',
                yearEnd: 2021,
                monthEnd: 10,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }
            ],
            actionList: [
              {
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }
            ]
          },
          {
            productClassId: 1,
            productTypeId: 812,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000018',
            contractNumber: '1000013',
            refContractNumber: null,
            account: 'BY02BPSB3014F000000001000013',
            name: 'ЛПЦ Карточный счет физических лиц (USD)',
            currencyCode: '840',
            currencyName: 'USD',
            dateStart: 1576443600000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 0,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №701 на Чкалова',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-701',
            contractAccount: 'BY40BPSB30141000000000000018',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '100000018',
                contract: null,
                productTypeId: 8044,
                productName: null,
                icon: 'ic_mastercard',
                imageUri: 'bps_master_silver_paypass_20160727.png',
                background: null,
                backColor1: '#FABB40',
                backColor2: '#EF6A5D',
                dominantColor: '#a8abae',
                textColor: 'ff000000',
                status: 0,
                cardId: '100000019',
                panCode: '555555******0202',
                name: 'ЛПЦ MC Standard Chip PayPass, USD',
                yearEnd: 2022,
                monthEnd: 12,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }
            ],
            actionList: [
              {
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }
            ]
          },
          {
            productClassId: 1,
            productTypeId: 828,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000020',
            contractNumber: '1000014',
            refContractNumber: null,
            account: 'BY72BPSB3014F000000001000014',
            name: 'ЛПЦ Карточный счет физического лица с рассрочкой (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1577307600000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            amount: 0,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №701 на Чкалова',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-701',
            contractAccount: 'BY83BPSB30141000000000000020',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [{
              contractId: '100000020',
              contract: null,
              productTypeId: 8227,
              productName: null,
              icon: 'ic_visa',
              imageUri: 'visa_classic_fun_chip.png',
              background: null,
              backColor1: '#8E69C1',
              backColor2: '#0A48A2',
              dominantColor: '#ffffff',
              textColor: 'ff000000',
              status: 0,
              cardId: '100000021',
              panCode: '422222******0303',
              name: 'КартаFUN',
              yearEnd: 2022,
              monthEnd: 11,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties:
                ['IS_CASHBACK',
                  'IS_APPLE_PAY',
                  'IS_P2P_WITHOUT_FEE'],
              paymentSystemId: '1',
              isFamily: false,
              cardholderName: 'TEST USERTWO'
            }],
            actionList: [
              {
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 3,
            productTypeId: 823,
            productName: null,
            icon: 'ic_loan',
            background: '',
            backColor1: '#33C985',
            backColor2: '#4FC5BC',
            contractType: 51,
            contractId: '100000022',
            contractNumber: '101-10001/19',
            refContractNumber: '1000014',
            account: null,
            name: 'Карта рассрочки «КартаFUN» (СР+3,89)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1577307600000,
            dateEnd: 1672434000000,
            dateClosed: null,
            percentRate: 12.64,
            amount: 0,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №701 на Чкалова',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-701',
            contractAccount: 'BY84BPSB24271000000000000021',
            isGracePeriod: '1',
            isUseInDebitTransactions: 0,
            overdraftLimit: 1090,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [],
            actionList: []
          }
        ],
        moneyBoxes: []
      },
      {
        accounts: [
          {
            id: '100000009',
            type: 'ccard',
            title: '*6666',
            instrument: 'BYN',
            syncID: [
              'BY40BPSB3014F000000001000008',
              '555555******6666',
              '555555******7777'
            ],
            balance: 3340.33
          },
          {
            id: '100000012',
            type: 'ccard',
            title: '*8888',
            instrument: 'EUR',
            syncID: [
              'BY83BPSB3014F000000001000010',
              '555555******8888'
            ],
            balance: 0
          },
          {
            id: '100000014',
            type: 'ccard',
            title: '*9999',
            instrument: 'RUB',
            syncID: [
              'BY56BPSB3014F000000001000011',
              '411111******9999'
            ],
            balance: 0
          },
          {
            id: '100000016',
            type: 'ccard',
            title: '*0101',
            instrument: 'USD',
            syncID: [
              'BY29BPSB3014F000000001000012',
              '411111******0101'
            ],
            balance: 0
          },
          {
            id: '100000018',
            type: 'ccard',
            title: '*0202',
            instrument: 'USD',
            syncID: [
              'BY02BPSB3014F000000001000013',
              '555555******0202'
            ],
            balance: 0
          },
          {
            id: '100000020',
            type: 'ccard',
            title: '*0303',
            instrument: 'BYN',
            syncID: [
              'BY72BPSB3014F000000001000014',
              '422222******0303'
            ],
            available: 0,
            creditLimit: 1090,
            percent: 0.01
          }
          // {
          //   id: '100000022',
          //   instrument: 'BYN',
          //   balance: -1090,
          //   creditLimit: 1090,
          //   type: 'ccard',
          //   title: 'Карта рассрочки «КартаFUN» (СР+3,89)',
          //   percent: 12.64,
          //   syncID: ['1000014']
          // }
        ],
        accountsByContractNumber: {
          1000008: {
            id: '100000009',
            instrument: 'BYN'
          },
          1000010: {
            id: '100000012',
            instrument: 'EUR'
          },
          1000011: {
            id: '100000014',
            instrument: 'RUB'
          },
          1000012: {
            id: '100000016',
            instrument: 'USD'
          },
          1000013: {
            id: '100000018',
            instrument: 'USD'
          },
          1000014: {
            id: '100000020',
            instrument: 'BYN'
          } // ,
          // '101-10001/19': {
          //   id: '100000022',
          //   instrument: 'BYN'
          // }
        },
        products: [
          {
            id: '100000010',
            type: 'card'
          },
          {
            id: '100000011',
            type: 'card'
          },
          {
            id: '100000013',
            type: 'card'
          },
          {
            id: '100000015',
            type: 'card'
          },
          {
            id: '100000017',
            type: 'card'
          },
          {
            id: '100000019',
            type: 'card'
          },
          {
            id: '100000021',
            type: 'card'
          }
        ]
      }
    ],
    [
      {
        accounts: [
          {
            productClassId: 3,
            productTypeId: 828,
            productName: null,
            icon: 'ic_loan',
            background: '',
            backColor1: '#33C985',
            backColor2: '#4FC5BC',
            contractType: 51,
            contractId: '100000023',
            contractNumber: '102-100038/19',
            refContractNumber: '1000015',
            account: null,
            name: 'Овердрафтный кредит «One-click!»(СР+3,89)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1576789200000,
            dateEnd: 1672434000000,
            dateClosed: null,
            percentRate: 12.64,
            amount: 781.13,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №327 Речица',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-327',
            contractAccount: 'BY57BPSB24271000000000000022',
            isGracePeriod: '0',
            isUseInDebitTransactions: 0,
            overdraftLimit: 840,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [],
            actionList: []
          }
        ],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '100000023',
          instrument: 'BYN',
          available: 781.13,
          creditLimit: 840,
          type: 'ccard',
          title: 'Овердрафтный кредит «One-click!»(СР+3,89)',
          percent: 12.64,
          syncID: ['1000015']
        }],
        accountsByContractNumber: {
          '102-100038/19': {
            id: '100000023',
            instrument: 'BYN'
          }
        },
        products: []
      }
    ],
    [
      {
        accounts: [
          {
            productClassId: 1,
            productTypeId: 925,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000024',
            contractNumber: '1000016',
            refContractNumber: null,
            account: 'BY10BPSB6520F000000001000016',
            name: 'Технологический (корпоративный) карточный счет (EUR)',
            currencyCode: '978',
            currencyName: 'EUR',
            dateStart: 1472763600000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0,
            availableAmount: 0,
            amount: 2000,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №777 на Мулявина',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-777',
            contractAccount: '1000000000001',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [{
              contractId: '100000024',
              contract: null,
              productTypeId: 928,
              productName: null,
              icon: 'ic_visa',
              imageUri: 'visa_gold_chip.png',
              background: null,
              backColor1: '#8E69C1',
              backColor2: '#0A48A2',
              dominantColor: '#ca9730',
              textColor: 'ffffffff',
              status: 0,
              cardId: '100000025',
              panCode: '433333******0404',
              name: 'VI Gold PayWave Корпоративная Банка, EUR',
              yearEnd: 2020,
              monthEnd: 8,
              amount: 0,
              descr: '0',
              processingCenter: 0,
              properties: [],
              paymentSystemId: '1',
              isFamily: false,
              cardholderName: 'TEST USERTWO'
            }],
            actionList: [{
              actionCode: 1051028,
              actionName: 'Подключение/изменение набора категорий money-back',
              actionGroup: 700
            }]
          },
          {
            productClassId: 1,
            productTypeId: 821,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000026',
            contractNumber: '1000017',
            refContractNumber: null,
            account: 'BY88BPSB3014F000000001000017',
            name: 'ЛПЦ Карточный счет физических лиц (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1492030800000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            availableAmount: 0,
            amount: 41.94,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №777 на Мулявина',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-777',
            contractAccount: 'BY45BPSB30141000000000000025',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: '1000018',
            packageContractKind: '92004',
            isFamily: false,
            cardList:
              [{
                contractId: '100000026',
                contract: null,
                productTypeId: 8032,
                productName: null,
                icon: 'ic_mastercard',
                imageUri: 'mc_gold_chip_paypass.png',
                background: null,
                backColor1: '#FABB40',
                backColor2: '#EF6A5D',
                dominantColor: '#ca9730',
                textColor: 'ff000000',
                status: 0,
                cardId: '100000027',
                panCode: '555555******0505',
                name: 'ЛПЦ MC Gold Chip PayPass, BYN',
                yearEnd: 2023,
                monthEnd: 4,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }],
            actionList:
              [{
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 1,
            productTypeId: 126,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000028',
            contractNumber: '1000019',
            refContractNumber: null,
            account: 'BY34BPSB3014F000000001000019',
            name: 'Карточный счет физических лиц с овердрафтом (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1492030800000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            availableAmount: 0,
            amount: 0.9,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №777 на Мулявина',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-777',
            contractAccount: 'BY88BPSB30141000000000000027',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '100000028',
                contract: null,
                productTypeId: 198,
                productName: null,
                icon: 'ic_visa',
                imageUri: 'visa_virtuon.png',
                background: null,
                backColor1: '#8E69C1',
                backColor2: '#0A48A2',
                dominantColor: '#039c39',
                textColor: 'ffffffff',
                status: 0,
                cardId: '100000029',
                panCode: '444444******0606',
                name: 'VV Виртуон, BYN',
                yearEnd: 2021,
                monthEnd: 1,
                amount: 0,
                descr: '0',
                processingCenter: 0,
                properties: ['IS_VIRTUON', 'IS_MILES'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }],
            actionList:
              [{
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 1,
            productTypeId: 828,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000030',
            contractNumber: '1000020',
            refContractNumber: null,
            account: 'BY07BPSB3014F000000001000020',
            name: 'ЛПЦ Карточный счет физического лица с рассрочкой (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1515618000000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            availableAmount: 0,
            amount: 9523.68,
            overdraftLimit: 10260,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №711 Сбербанк 1',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-711',
            contractAccount: 'BY34BPSB30141000000000000029',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '100000030',
                contract: null,
                productTypeId: 8227,
                productName: null,
                icon: 'ic_visa',
                imageUri: 'visa_classic_fun_chip.png',
                background: null,
                backColor1: '#8E69C1',
                backColor2: '#0A48A2',
                dominantColor: '#ffffff',
                textColor: 'ff000000',
                status: 0,
                cardId: '100000031',
                panCode: '422222******0707',
                name: 'КартаFUN',
                yearEnd: 2020,
                monthEnd: 12,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties:
                  ['IS_CASHBACK',
                    'IS_APPLE_PAY',
                    'IS_P2P_WITHOUT_FEE'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }],
            actionList:
              [{
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 1,
            productTypeId: 815,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000032',
            contractNumber: '1000021',
            refContractNumber: null,
            account: 'BY77BPSB3014F000000001000021',
            name: 'ЛПЦ Карточный счет физических лиц (EUR)',
            currencyCode: '978',
            currencyName: 'EUR',
            dateStart: 1546894800000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            availableAmount: 0.23,
            amount: 0.23,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №711 Сбербанк 1',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-711',
            contractAccount: 'BY77BPSB30141000000000000031',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '100000032',
                contract: null,
                productTypeId: 8048,
                productName: null,
                icon: 'ic_mastercard',
                imageUri: 'mc_gold_chip_paypass.png',
                background: null,
                backColor1: '#FABB40',
                backColor2: '#EF6A5D',
                dominantColor: '#ca9730',
                textColor: 'ff000000',
                status: 0,
                cardId: '100000033',
                panCode: '555555******0808',
                name: 'ЛПЦ MC Gold Chip PayPass, EUR',
                yearEnd: 2021,
                monthEnd: 1,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }],
            actionList:
              [{
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 1,
            productTypeId: 821,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000034',
            contractNumber: '1000022',
            refContractNumber: null,
            account: 'BY50BPSB3014F000000001000022',
            name: 'ЛПЦ Карточный счет физических лиц (BYN)',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1573592400000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            availableAmount: 0.02,
            amount: 0.02,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №711 Сбербанк 1',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-711',
            contractAccount: 'BY45BPSB30141000000000000025',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '100000034',
                contract: null,
                productTypeId: 8240,
                productName: null,
                icon: 'ic_visa',
                imageUri: 'visa_classic_chip.png',
                background: null,
                backColor1: '#8E69C1',
                backColor2: '#0A48A2',
                dominantColor: '#a3a7a9',
                textColor: 'ffffffff',
                status: 0,
                cardId: '100000035',
                panCode: '411111******0909',
                name: 'ЛПЦ Visa Classic Chip PayWave, BYN',
                yearEnd: 2020,
                monthEnd: 11,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }],
            actionList:
              [{
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 1,
            productTypeId: 812,
            productName: null,
            icon: '',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            contractType: 1,
            contractId: '100000036',
            contractNumber: '1000023',
            refContractNumber: null,
            account: 'BY23BPSB3014F000000001000023',
            name: 'ЛПЦ Карточный счет физических лиц (USD)',
            currencyCode: '840',
            currencyName: 'USD',
            dateStart: 1583701200000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0.01,
            availableAmount: 0,
            amount: 0,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №711 Сбербанк 1',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-711',
            contractAccount: 'BY93BPSB30141000000000000034',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '100000036',
                contract: null,
                productTypeId: 8044,
                productName: null,
                icon: 'ic_mastercard',
                imageUri: 'bps_master_silver_paypass_20160727.png',
                background: null,
                backColor1: '#FABB40',
                backColor2: '#EF6A5D',
                dominantColor: '#a8abae',
                textColor: 'ff000000',
                status: 0,
                cardId: '100000037',
                panCode: '555555******1010',
                name: 'ЛПЦ MC Standard Chip PayPass, USD',
                yearEnd: 2021,
                monthEnd: 3,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'TEST USERTWO'
              }],
            actionList:
              [{
                actionCode: 1050504,
                actionName: 'On-line заявление на выпуск дополнительной карты владельцу счета',
                actionGroup: 700
              },
              {
                actionCode: 1050505,
                actionName: 'Заявление на выпуск дополнительной карты владельцу счета из CRM (СБОЛ) (автоисполнение)',
                actionGroup: 700
              },
              {
                actionCode: 1051028,
                actionName: 'Подключение/изменение набора категорий money-back',
                actionGroup: 700
              }]
          },
          {
            productClassId: 3,
            productTypeId: 683,
            productName: null,
            icon: 'ic_loan',
            background: '',
            backColor1: '#33C985',
            backColor2: '#4FC5BC',
            contractType: 51,
            contractId: '100000038',
            contractNumber: '103-10002/18',
            refContractNumber: '1000020',
            account: null,
            name: 'Кредитная карта «КартаFUN» ОТС партнеров и grace-период 0,000001%(СР+5,8 продукт 683) VIP',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1515618000000,
            dateEnd: 1612040400000,
            dateClosed: null,
            percentRate: 14.55,
            availableAmount: 0,
            amount: 736.32,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №711 Сбербанк 1',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-711',
            contractAccount: 'BY94BPSB24271000000000000035',
            isGracePeriod: '1',
            isUseInDebitTransactions: 0,
            overdraftLimit: 10260,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [],
            actionList: []
          },
          {
            productClassId: 3,
            productTypeId: 589,
            productName: null,
            icon: 'ic_loan',
            background: '',
            backColor1: '#33C985',
            backColor2: '#4FC5BC',
            contractType: 51,
            contractId: '100000039',
            contractNumber: '103-10003/17',
            refContractNumber: '1000017',
            account: null,
            name: '"Добро пожаловать в Сбербанк" 12 месяцев (СР-1,5 продукт 589)(классик, классический, статусный, голд, "ComPass")неуст.',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1506459600000,
            dateEnd: 1601413200000,
            dateClosed: null,
            percentRate: 7.25,
            availableAmount: 0,
            amount: 9958.06,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №777 на Мулявина',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-777',
            contractAccount: 'BY94BPSB24271000000000000035',
            isGracePeriod: '0',
            isUseInDebitTransactions: 0,
            overdraftLimit: 10000,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [],
            actionList: []
          },
          {
            productClassId: 3,
            productTypeId: 590,
            productName: null,
            icon: 'ic_loan',
            background: '',
            backColor1: '#33C985',
            backColor2: '#4FC5BC',
            contractType: 51,
            contractId: '100000040',
            contractNumber: '103-10004/17',
            refContractNumber: '1000019',
            account: 'BY72BPSB2427F100000000361212',
            name: '«НаСТОящая кредитка» (СР+3продукт 590) 3года+зарпл.пакет ',
            currencyCode: '933',
            currencyName: 'BYN',
            dateStart: 1492030800000,
            dateEnd: 1682802000000,
            dateClosed: null,
            percentRate: 11.75,
            availableAmount: 0,
            amount: 9999.1,
            unit: 1,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №777 на Мулявина',
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-777',
            contractAccount: 'BY94BPSB24271000000000000035',
            isGracePeriod: '0',
            isUseInDebitTransactions: 0,
            overdraftLimit: 10000,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [],
            actionList: []
          }
        ],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '100000024',
          instrument: 'EUR',
          balance: 2000,
          type: 'ccard',
          title: '*0404',
          syncID: [
            'BY10BPSB6520F000000001000016',
            '433333******0404'
          ]
        },
        {
          available: 9958.06,
          creditLimit: 10000,
          id: '100000026',
          instrument: 'BYN',
          percent: 0.01,
          syncID: [
            'BY88BPSB3014F000000001000017',
            '555555******0505'
          ],
          title: '*0505',
          type: 'ccard'
        },
        {
          available: 9999.1,
          creditLimit: 10000,
          id: '100000028',
          instrument: 'BYN',
          percent: 0.01,
          syncID: [
            'BY34BPSB3014F000000001000019',
            '444444******0606'
          ],
          title: '*0606',
          type: 'ccard'
        },
        {
          available: 736.32,
          creditLimit: 10260,
          id: '100000030',
          instrument: 'BYN',
          percent: 0.01,
          syncID: [
            'BY07BPSB3014F000000001000020',
            '422222******0707'
          ],
          title: '*0707',
          type: 'ccard'
        },
        {
          balance: 0.23,
          id: '100000032',
          instrument: 'EUR',
          syncID: [
            'BY77BPSB3014F000000001000021',
            '555555******0808'
          ],
          title: '*0808',
          type: 'ccard'
        },
        {
          balance: 0.02,
          id: '100000034',
          instrument: 'BYN',
          syncID: [
            'BY50BPSB3014F000000001000022',
            '411111******0909'
          ],
          title: '*0909',
          type: 'ccard'
        },
        {
          balance: 0,
          id: '100000036',
          instrument: 'USD',
          syncID: [
            'BY23BPSB3014F000000001000023',
            '555555******1010'
          ],
          title: '*1010',
          type: 'ccard'
        }
        ],
        accountsByContractNumber: {
          1000016: {
            id: '100000024',
            instrument: 'EUR'
          },
          1000017: {
            id: '100000026',
            instrument: 'BYN'
          },
          1000019: {
            id: '100000028',
            instrument: 'BYN'
          },
          1000020: {
            id: '100000030',
            instrument: 'BYN'
          },
          1000021: {
            id: '100000032',
            instrument: 'EUR'
          },
          1000022: {
            id: '100000034',
            instrument: 'BYN'
          },
          1000023: {
            id: '100000036',
            instrument: 'USD'
          }
        },
        products: [
          {
            id: '100000025',
            type: 'card'
          },
          {
            id: '100000027',
            type: 'card'
          },
          {
            id: '100000029',
            type: 'card'
          },
          {
            id: '100000031',
            type: 'card'
          },
          {
            id: '100000033',
            type: 'card'
          },
          {
            id: '100000035',
            type: 'card'
          },
          {
            id: '100000037',
            type: 'card'
          }
        ]
      }
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
