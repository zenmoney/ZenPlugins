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
          contractAccount: 'BY94BPSB24271000000000000035',
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
          id: '100000038',
          instrument: 'BYN',
          available: 1536.32,
          type: 'ccard',
          title: 'Кредитная карта «КартаFUN» ОТС партнеров и grace-период 0,000001%(СР+5,8 продукт 683) VIP',
          percent: 14.55,
          creditLimit: 10260,
          syncID: [
            '1000020'
          ]
        }],
        accountsByContractNumber: {
          '103-10002/18': {
            id: '100000038',
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
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '100000040',
          instrument: 'BYN',
          available: 9999.1,
          type: 'ccard',
          title: '*1212',
          percent: 11.75,
          creditLimit: 10000,
          syncID: [
            'BY72BPSB2427F100000000361212',
            '1000019'
          ]
        }],
        accountsByContractNumber: {
          '103-10004/17': {
            id: '100000040',
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
          contractId: '100000026',
          contractNumber: '1000017',
          amount: 41.94,
          overdraftLimit: 10000,
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
          packageContractNumber: '1000018',
          packageContractKind: '92004',
          isFamily: false,
          cardList: [{
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
          }]
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '100000026',
          instrument: 'BYN',
          available: 41.94,
          type: 'ccard',
          title: '*0505',
          percent: 0.01,
          creditLimit: 10000,
          syncID: [
            'BY88BPSB3014F000000001000017',
            '555555******0505'
          ]
        }],
        accountsByContractNumber: {
          1000017: {
            id: '100000026',
            instrument: 'BYN'
          }
        },
        products: [{
          id: '100000027',
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
          contractId: '100000041',
          contractNumber: '1000024',
          refContractNumber: null,
          account: 'BY93BPSB3014F000000001000024',
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
          contractAccount: 'BY82BPSB30141000000000000038',
          isGracePeriod: null,
          isUseInDebitTransactions: 1,
          packageContractNumber: '1000025',
          packageContractKind: '92003',
          isFamily: false,
          cardList:
            [{
              contractId: '100000041',
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
              cardId: '100000042',
              panCode: '555555******1313',
              name: 'ЛПЦ MC Standard Chip PayPass, BYN',
              yearEnd: 2020,
              monthEnd: 8,
              amount: 0,
              descr: '0',
              processingCenter: 2,
              properties: ['IS_APPLE_PAY'],
              paymentSystemId: '2',
              isFamily: false,
              cardholderName: 'TEST USERTWO'
            }]
        }],
        moneyBoxes: []
      },
      {
        accounts: [{
          id: '100000041',
          instrument: 'BYN',
          available: 168.16,
          type: 'ccard',
          title: '*1313',
          percent: 0.01,
          creditLimit: 200,
          syncID: [
            'BY93BPSB3014F000000001000024',
            '555555******1313'
          ]
        }],
        accountsByContractNumber: {
          1000024: {
            id: '100000041',
            instrument: 'BYN'
          }
        },
        products: [{
          id: '100000042',
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
          contractId: '100000001',
          contractNumber: '1000001',
          refContractNumber: null,
          account: 'BY35BPSB3014F000000001000001',
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
          contractAccount: 'BY84BPSB30141000000000000002',
          isGracePeriod: null,
          isUseInDebitTransactions: 1,
          overdraftLimit: 1200,
          packageContractNumber: '1000002',
          packageContractKind: '92004',
          isFamily: false,
          cardList: [
            {
              contractId: '100000001',
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
              cardId: '1000000001',
              panCode: '555555******1111',
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
          id: '100000001',
          instrument: 'BYN',
          available: 45.04,
          type: 'ccard',
          title: '*1111',
          percent: 0.01,
          creditLimit: 1200,
          syncID: [
            'BY35BPSB3014F000000001000001',
            '555555******1111'
          ]
        }],
        accountsByContractNumber: {
          1000001: {
            id: '100000001',
            instrument: 'BYN'
          }
        },
        products: [{
          id: '1000000001',
          type: 'card'
        }]
      }
    ]
  ]
  )('converts credit card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
