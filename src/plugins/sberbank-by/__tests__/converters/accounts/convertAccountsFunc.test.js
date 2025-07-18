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
            contractId: '911702355',
            contractNumber: '8013742',
            refContractNumber: null,
            account: 'BY91BPSB3014F000000008013742',
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
            contractAccount: 'BY57BPSB30147010005389330000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [{
              contractId: '911702355',
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
              cardId: '911702357',
              panCode: '449655******3289',
              name: 'МПЦ Visa Virtuon, BYN',
              yearEnd: 2021,
              monthEnd: 3,
              amount: 0.0,
              descr: '0',
              processingCenter: 1,
              properties: ['IS_VIRTUON', 'IS_APPLE_PAY'],
              paymentSystemId: '1',
              isFamily: false,
              cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '575063360',
            contractNumber: '6870102',
            refContractNumber: null,
            account: 'BY70BPSB3014F000000006870102',
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
            contractAccount: 'BY98BPSB30147040005069330000',
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
          id: '470c803e-4fa0-49af-9fd2-b9deb43677f4',
          name: 'Автошкола + машина',
          created: 1575574380000,
          closed: 1585325791000,
          status: 'OPENED',
          statusDescription: 'Закрытая копилка',
          targetAmount: 200,
          targetDate: 1583625600000,
          image: null,
          imageURL: null,
          contractCurrency: '933',
          contractId: '7824229',
          balance: 100,
          phone: '375298106295',
          email: null,
          contractKindName: 'Текущий (расчетный) счет "Копилка" в белорусских рублях',
          percRate: 3,
          settings: [
            {
              id: 'a6e588d4-e9f9-40a4-a7ad-b91a168ed9aa',
              status: 'DISABLE',
              refillType: 'INCOME',
              cardId: '764704950',
              cardPan: '449655******0276',
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
              id: '3e674b43-1c3d-4949-be95-207251c85a7d',
              status: 'DISABLE',
              refillType: 'INCOME',
              cardId: '764704950',
              cardPan: '449655******0276',
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
          ibannum: 'BY95BPSB3014F000000007824229'
        }]
      },
      {
        accounts: [{
          id: '911702355',
          type: 'ccard',
          title: '*3289',
          instrument: 'BYN',
          syncID: [
            'BY91BPSB3014F000000008013742',
            '449655******3289'
          ],
          balance: 1.97
        }, {
          id: '575063360',
          type: 'ccard',
          title: '*0102',
          instrument: 'BYN',
          syncID: [
            'BY70BPSB3014F000000006870102'
          ],
          balance: 1.97
        },
        {
          id: '470c803e-4fa0-49af-9fd2-b9deb43677f4',
          type: 'checking',
          title: 'Автошкола + машина',
          instrument: 'BYN',
          syncID: [
            'BY95BPSB3014F000000007824229'
          ],
          balance: 100,
          savings: true,
          archive: false
        }
        ],
        accountsByContractNumber: {
          8013742: {
            id: '911702355',
            instrument: 'BYN'
          },
          6870102: {
            id: '575063360',
            instrument: 'BYN'
          },
          7824229: {
            id: '470c803e-4fa0-49af-9fd2-b9deb43677f4',
            instrument: 'BYN'
          }
        },
        products: [
          {
            id: '911702357',
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
            contractId: '575836659',
            contractNumber: '6875131',
            refContractNumber: null,
            account: 'BY87BPSB3014F000000006875131',
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
            contractAccount: 'BY98BPSB30147040005069330000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: '6875132',
            packageContractKind: '92022',
            isFamily: false,
            cardList: [{
              contractId: '575836659',
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
              cardId: '575836661',
              panCode: '543553******7974',
              name: 'ЛПЦ MC Gold Chip PayPass, BYN',
              yearEnd: 2021,
              monthEnd: 10,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              cardholderName: 'NIKOLAY NIKOLAEV'
            },
            {
              contractId: '575836659',
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
              cardId: '898044243',
              panCode: '543553******8815',
              name: 'ЛПЦ MC Standard Chip PayPass, BYN',
              yearEnd: 2022,
              monthEnd: 12,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '581759962',
            contractNumber: '6904050',
            refContractNumber: null,
            account: 'BY27BPSB3014F000000006904050',
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
            contractAccount: 'BY78BPSB30147040005229780000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '581759962',
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
                cardId: '579548199',
                panCode: '543553******7952',
                name: 'ЛПЦ MC Standard Momentum Chip, EUR',
                yearEnd: 2021,
                monthEnd: 10,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '581760119',
            contractNumber: '6904075',
            refContractNumber: null,
            account: 'BY31BPSB3014F000000006904075',
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
            contractAccount: 'BY02BPSB30147040005356430000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '581760119',
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
                cardId: '575827473',
                panCode: '449655******3828',
                name: 'ЛПЦ Visa Classic Momentum Chip, RUB',
                yearEnd: 2021,
                monthEnd: 10,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '581760207',
            contractNumber: '6904092',
            refContractNumber: null,
            account: 'BY57BPSB3014F000000006904092',
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
            contractAccount: 'BY95BPSB30147040005198400000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '581760207',
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
                cardId: '575827130',
                panCode: '449655******4823',
                name: 'ЛПЦ Visa Classic Momentum Chip, USD',
                yearEnd: 2021,
                monthEnd: 10,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '850778313',
            contractNumber: '7841565',
            refContractNumber: null,
            account: 'BY48BPSB3014F000000007841565',
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
            contractAccount: 'BY19BPSB30147010004248400000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [
              {
                contractId: '850778313',
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
                cardId: '850778315',
                panCode: '543553******8228',
                name: 'ЛПЦ MC Standard Chip PayPass, USD',
                yearEnd: 2022,
                monthEnd: 12,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '857066393',
            contractNumber: '7857452',
            refContractNumber: null,
            account: 'BY33BPSB3014F000000007857452',
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
            contractAccount: 'BY59BPSB30147010005129330000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [{
              contractId: '857066393',
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
              cardId: '829525997',
              panCode: '460257******2849',
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
              cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '857068331',
            contractNumber: '701-69261/19',
            refContractNumber: '7857452',
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
            contractAccount: 'BY36BPSB24277010100029330000',
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
            id: '575836659',
            type: 'ccard',
            title: '*7974',
            instrument: 'BYN',
            syncID: [
              'BY87BPSB3014F000000006875131',
              '543553******7974',
              '543553******8815'
            ],
            balance: 3340.33
          },
          {
            id: '581759962',
            type: 'ccard',
            title: '*7952',
            instrument: 'EUR',
            syncID: [
              'BY27BPSB3014F000000006904050',
              '543553******7952'
            ],
            balance: 0
          },
          {
            id: '581760119',
            type: 'ccard',
            title: '*3828',
            instrument: 'RUB',
            syncID: [
              'BY31BPSB3014F000000006904075',
              '449655******3828'
            ],
            balance: 0
          },
          {
            id: '581760207',
            type: 'ccard',
            title: '*4823',
            instrument: 'USD',
            syncID: [
              'BY57BPSB3014F000000006904092',
              '449655******4823'
            ],
            balance: 0
          },
          {
            id: '850778313',
            type: 'ccard',
            title: '*8228',
            instrument: 'USD',
            syncID: [
              'BY48BPSB3014F000000007841565',
              '543553******8228'
            ],
            balance: 0
          },
          {
            id: '857066393',
            type: 'ccard',
            title: '*2849',
            instrument: 'BYN',
            syncID: [
              'BY33BPSB3014F000000007857452',
              '460257******2849'
            ],
            available: 0,
            creditLimit: 1090,
            percent: 0.01
          }
          // {
          //   id: '857068331',
          //   instrument: 'BYN',
          //   balance: -1090,
          //   creditLimit: 1090,
          //   type: 'ccard',
          //   title: 'Карта рассрочки «КартаFUN» (СР+3,89)',
          //   percent: 12.64,
          //   syncID: ['7857452']
          // }
        ],
        accountsByContractNumber: {
          6875131: {
            id: '575836659',
            instrument: 'BYN'
          },
          6904050: {
            id: '581759962',
            instrument: 'EUR'
          },
          6904075: {
            id: '581760119',
            instrument: 'RUB'
          },
          6904092: {
            id: '581760207',
            instrument: 'USD'
          },
          7841565: {
            id: '850778313',
            instrument: 'USD'
          },
          7857452: {
            id: '857066393',
            instrument: 'BYN'
          } // ,
          // '701-69261/19': {
          //   id: '857068331',
          //   instrument: 'BYN'
          // }
        },
        products: [
          {
            id: '575836661',
            type: 'card'
          },
          {
            id: '898044243',
            type: 'card'
          },
          {
            id: '579548199',
            type: 'card'
          },
          {
            id: '575827473',
            type: 'card'
          },
          {
            id: '575827130',
            type: 'card'
          },
          {
            id: '850778315',
            type: 'card'
          },
          {
            id: '829525997',
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
            contractId: '854367160',
            contractNumber: '369-658130/19',
            refContractNumber: '6746169',
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
            contractAccount: 'BY76BPSB24273270187079330000',
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
          id: '854367160',
          instrument: 'BYN',
          available: 781.13,
          creditLimit: 840,
          type: 'ccard',
          title: 'Овердрафтный кредит «One-click!»(СР+3,89)',
          percent: 12.64,
          syncID: ['6746169']
        }],
        accountsByContractNumber: {
          '369-658130/19': {
            id: '854367160',
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
            contractId: '243439625',
            contractNumber: '4583528',
            refContractNumber: null,
            account: 'BY67BPSB6520F000000004583528',
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
            contractAccount: '6520860015939',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [{
              contractId: '243439625',
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
              cardId: '529265313',
              panCode: '431837******0467',
              name: 'VI Gold PayWave Корпоративная Банка, EUR',
              yearEnd: 2020,
              monthEnd: 8,
              amount: 0,
              descr: '0',
              processingCenter: 0,
              properties: [],
              paymentSystemId: '1',
              isFamily: false,
              cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '319739750',
            contractNumber: '5161070',
            refContractNumber: null,
            account: 'BY64BPSB3014F000000005161070',
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
            contractAccount: 'BY39BPSB30147770002729330000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: '5161072',
            packageContractKind: '92004',
            isFamily: false,
            cardList:
              [{
                contractId: '319739750',
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
                cardId: '928104406',
                panCode: '543553******7568',
                name: 'ЛПЦ MC Gold Chip PayPass, BYN',
                yearEnd: 2023,
                monthEnd: 4,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '319739991',
            contractNumber: '5161114',
            refContractNumber: null,
            account: 'BY40BPSB3014F000000005161114',
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
            contractAccount: 'BY97BPSB30147770001979330000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '319739991',
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
                cardId: '627745664',
                panCode: '431838******0908',
                name: 'VV Виртуон, BYN',
                yearEnd: 2021,
                monthEnd: 1,
                amount: 0,
                descr: '0',
                processingCenter: 0,
                properties: ['IS_VIRTUON', 'IS_MILES'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '433579789',
            contractNumber: '6091027',
            refContractNumber: null,
            account: 'BY63BPSB3014F000000006091027',
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
            contractAccount: 'BY63BPSB30147770004459330000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '433579789',
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
                cardId: '425513522',
                panCode: '460257******5014',
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
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '627744188',
            contractNumber: '7101076',
            refContractNumber: null,
            account: 'BY96BPSB3014F000000007101076',
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
            contractAccount: 'BY65BPSB30147770002729780000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '627744188',
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
                cardId: '627744190',
                panCode: '543553******9002',
                name: 'ЛПЦ MC Gold Chip PayPass, EUR',
                yearEnd: 2021,
                monthEnd: 1,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '826844894',
            contractNumber: '7775763',
            refContractNumber: null,
            account: 'BY50BPSB3014F000000007775763',
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
            contractAccount: 'BY39BPSB30147770002729330000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '826844894',
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
                cardId: '826844896',
                panCode: '449655******2903',
                name: 'ЛПЦ Visa Classic Chip PayWave, BYN',
                yearEnd: 2020,
                monthEnd: 11,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '1',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '909713282',
            contractNumber: '8007630',
            refContractNumber: null,
            account: 'BY21BPSB3014F000000008007630',
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
            contractAccount: 'BY37BPSB30147770002728400000',
            isGracePeriod: null,
            isUseInDebitTransactions: 1,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList:
              [{
                contractId: '909713282',
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
                cardId: '909713294',
                panCode: '543553******0754',
                name: 'ЛПЦ MC Standard Chip PayPass, USD',
                yearEnd: 2021,
                monthEnd: 3,
                amount: 0,
                descr: '0',
                processingCenter: 2,
                properties: ['IS_APPLE_PAY'],
                paymentSystemId: '2',
                isFamily: false,
                cardholderName: 'NIKOLAY NIKOLAEV'
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
            contractId: '433582516',
            contractNumber: '777-60138/18',
            refContractNumber: '6091027',
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
            contractAccount: 'BY95BPSB24277770052439330000',
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
            contractId: '384376202',
            contractNumber: '777-62189/17',
            refContractNumber: '5161070',
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
            contractAccount: 'BY95BPSB24277770052439330000',
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
            contractId: '319742207',
            contractNumber: '777-60762/17',
            refContractNumber: '5161114',
            account: 'BY75BPSB2427F300000000453590',
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
            contractAccount: 'BY95BPSB24277770052439330000',
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
          id: '243439625',
          instrument: 'EUR',
          balance: 2000,
          type: 'ccard',
          title: '*0467',
          syncID: [
            'BY67BPSB6520F000000004583528',
            '431837******0467'
          ]
        },
        {
          available: 9958.06,
          creditLimit: 10000,
          id: '319739750',
          instrument: 'BYN',
          percent: 0.01,
          syncID: [
            'BY64BPSB3014F000000005161070',
            '543553******7568'
          ],
          title: '*7568',
          type: 'ccard'
        },
        {
          available: 9999.1,
          creditLimit: 10000,
          id: '319739991',
          instrument: 'BYN',
          percent: 0.01,
          syncID: [
            'BY40BPSB3014F000000005161114',
            '431838******0908'
          ],
          title: '*0908',
          type: 'ccard'
        },
        {
          available: 736.32,
          creditLimit: 10260,
          id: '433579789',
          instrument: 'BYN',
          percent: 0.01,
          syncID: [
            'BY63BPSB3014F000000006091027',
            '460257******5014'
          ],
          title: '*5014',
          type: 'ccard'
        },
        {
          balance: 0.23,
          id: '627744188',
          instrument: 'EUR',
          syncID: [
            'BY96BPSB3014F000000007101076',
            '543553******9002'
          ],
          title: '*9002',
          type: 'ccard'
        },
        {
          balance: 0.02,
          id: '826844894',
          instrument: 'BYN',
          syncID: [
            'BY50BPSB3014F000000007775763',
            '449655******2903'
          ],
          title: '*2903',
          type: 'ccard'
        },
        {
          balance: 0,
          id: '909713282',
          instrument: 'USD',
          syncID: [
            'BY21BPSB3014F000000008007630',
            '543553******0754'
          ],
          title: '*0754',
          type: 'ccard'
        }
        ],
        accountsByContractNumber: {
          4583528: {
            id: '243439625',
            instrument: 'EUR'
          },
          5161070: {
            id: '319739750',
            instrument: 'BYN'
          },
          5161114: {
            id: '319739991',
            instrument: 'BYN'
          },
          6091027: {
            id: '433579789',
            instrument: 'BYN'
          },
          7101076: {
            id: '627744188',
            instrument: 'EUR'
          },
          7775763: {
            id: '826844894',
            instrument: 'BYN'
          },
          8007630: {
            id: '909713282',
            instrument: 'USD'
          }
        },
        products: [
          {
            id: '529265313',
            type: 'card'
          },
          {
            id: '928104406',
            type: 'card'
          },
          {
            id: '627745664',
            type: 'card'
          },
          {
            id: '425513522',
            type: 'card'
          },
          {
            id: '627744190',
            type: 'card'
          },
          {
            id: '826844896',
            type: 'card'
          },
          {
            id: '909713294',
            type: 'card'
          }
        ]
      }
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
