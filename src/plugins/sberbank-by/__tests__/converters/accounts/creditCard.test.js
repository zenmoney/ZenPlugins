import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        accounts: [{
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
          amount: 1536.32,
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
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '433582516',
          instrument: 'BYN',
          available: 1536.32,
          type: 'ccard',
          title: 'Кредитная карта «КартаFUN» ОТС партнеров и grace-период 0,000001%(СР+5,8 продукт 683) VIP',
          percent: 14.55,
          creditLimit: 10260,
          syncID: [
            '6091027'
          ]
        }],
        accountsByContractNumber: {
          '777-60138/18': {
            id: '433582516',
            instrument: 'BYN'
          }
        },
        products: []
      }
    ],
    [
      {
        accounts: [{
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
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '319742207',
          instrument: 'BYN',
          available: 9999.1,
          type: 'ccard',
          title: '*3590',
          percent: 11.75,
          creditLimit: 10000,
          syncID: [
            'BY75BPSB2427F300000000453590',
            '5161114'
          ]
        }],
        accountsByContractNumber: {
          '777-60762/17': {
            id: '319742207',
            instrument: 'BYN'
          }
        },
        products: []
      }
    ],
    [
      {
        accounts: [{
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
          amount: 41.94,
          overdraftLimit: 10000,
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
          packageContractNumber: '5161072',
          packageContractKind: '92004',
          isFamily: false,
          cardList: [{
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
          }]
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '319739750',
          instrument: 'BYN',
          available: 41.94,
          type: 'ccard',
          title: '*7568',
          percent: 0.01,
          creditLimit: 10000,
          syncID: [
            'BY64BPSB3014F000000005161070',
            '543553******7568'
          ]
        }],
        accountsByContractNumber: {
          5161070: {
            id: '319739750',
            instrument: 'BYN'
          }
        },
        products: [{
          id: '928104406',
          type: 'card'
        }]
      }
    ],
    [
      {
        accounts: [{
          productClassId: 1,
          productTypeId: 821,
          productName: null,
          icon: '',
          background: '',
          backColor1: '#9FA3C1',
          backColor2: '#B3C0BE',
          contractType: 1,
          contractId: '362942802',
          contractNumber: '5484196',
          refContractNumber: null,
          account: 'BY36BPSB3014F000000005484196',
          name: 'ЛПЦ Карточный счет физических лиц (BYN)',
          currencyCode: '933',
          currencyName: 'BYN',
          dateStart: 1502053200000,
          dateEnd: null,
          dateClosed: null,
          percentRate: 0.01,
          availableAmount: 0,
          amount: 168.16,
          overdraftLimit: 200,
          unit: 1,
          creditCurrentPayment: null,
          creditRest: null,
          descr: 'Дополнительный офис №706 Каскад',
          paymentPercent: null,
          principalDebt: null,
          percentAccuralUrgent: null,
          percentUrgent: null,
          departmentNumber: '369-706',
          contractAccount: 'BY13BPSB30147060004909330000',
          isGracePeriod: null,
          isUseInDebitTransactions: 1,
          packageContractNumber: '5484197',
          packageContractKind: '92003',
          isFamily: false,
          cardList:
            [{
              contractId: '362942802',
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
              cardId: '362942804',
              panCode: '543553******1259',
              name: 'ЛПЦ MC Standard Chip PayPass, BYN',
              yearEnd: 2020,
              monthEnd: 8,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              cardholderName: 'NIKOLAY NIKOLAEV'
            }]
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '362942802',
          instrument: 'BYN',
          available: 168.16,
          type: 'ccard',
          title: '*1259',
          percent: 0.01,
          creditLimit: 200,
          syncID: [
            'BY36BPSB3014F000000005484196',
            '543553******1259'
          ]
        }],
        accountsByContractNumber: {
          5484196: {
            id: '362942802',
            instrument: 'BYN'
          }
        },
        products: [{
          id: '362942804',
          type: 'card'
        }]
      }
    ],
    [
      {
        accounts: [{
          productClassId: 1,
          productTypeId: 821,
          productName: null,
          icon: '',
          background: '',
          backColor1: '#9FA3C1',
          backColor2: '#B3C0BE',
          contractType: 1,
          contractId: '367719901',
          contractNumber: '5521718',
          refContractNumber: null,
          account: 'BY10BPSB3014F000000005521718',
          name: 'ЛПЦ Карточный счет физических лиц (BYN)',
          currencyCode: '933',
          currencyName: 'BYN',
          dateStart: 1503003600000,
          dateEnd: null,
          dateClosed: null,
          percentRate: 0.01,
          availableAmount: 444.97,
          amount: 45.04,
          unit: 1,
          creditCurrentPayment: '0',
          creditRest: null,
          descr: 'Дополнительный офис №333 Светлогорск',
          paymentPercent: null,
          principalDebt: null,
          percentAccuralUrgent: null,
          percentUrgent: null,
          departmentNumber: '369-333',
          contractAccount: 'BY75BPSB30143330004439330000',
          isGracePeriod: null,
          isUseInDebitTransactions: 1,
          overdraftLimit: 1200,
          packageContractNumber: '5521722',
          packageContractKind: '92004',
          isFamily: false,
          cardList: [
            {
              contractId: '367719901',
              contract: null,
              productTypeId: 8032,
              productName: 'MasterCard',
              icon: 'ic_mastercard',
              imageUri: 'mc_gold_chip_paypass.png',
              background: null,
              backColor1: '#FABB40',
              backColor2: '#EF6A5D',
              dominantColor: '#ca9730',
              textColor: 'ff000000',
              status: 0,
              cardId: '1012784482',
              panCode: '543553******9142',
              name: 'ЛПЦ MC Gold Chip PayPass, BYN',
              yearEnd: 2023,
              monthEnd: 7,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              isMoneyback: false,
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
          actionCode: 1050507,
          actionName: 'Заявление на выпуск дополнительной карты лицу, не являющемуся владельцем счета из CRM (СБОЛ) (автоисполнение)',
          actionGroup: 700
        },
        {
          actionCode: 1150325,
          actionName: 'Замена карты по сроку действия из CRM (СБОЛ) (автоисполнение)',
          actionGroup: 125
        }]
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '367719901',
          instrument: 'BYN',
          available: 45.04,
          type: 'ccard',
          title: '*9142',
          percent: 0.01,
          creditLimit: 1200,
          syncID: [
            'BY10BPSB3014F000000005521718',
            '543553******9142'
          ]
        }],
        accountsByContractNumber: {
          5521718: {
            id: '367719901',
            instrument: 'BYN'
          }
        },
        products: [{
          id: '1012784482',
          type: 'card'
        }]
      }
    ]
  ]
  )('converts credit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
