import { convertAccount } from '../../../converters.js'

describe('convertAccount', () => {
  it.each([
    [
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
        // mainProduct: {
        //   id: 911702355,
        //   type: 'account',
        //   contractNumber: '8013742'
        // },
        products: [
          {
            id: '911702357',
            type: 'card'
          }
        ],
        account: {
          id: '911702355',
          type: 'ccard',
          title: '*3289',
          instrument: 'BYN',
          syncID: [
            'BY91BPSB3014F000000008013742',
            '449655******3289'
          ],
          balance: 1.97
        }
      }
    ],
    [
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
      },
      {
        // mainProduct: {
        //   id: 575063360,
        //   type: 'account',
        //   contractNumber: '6870102'
        // },
        products: [],
        account: {
          id: '575063360',
          type: 'ccard',
          title: '*0102',
          instrument: 'BYN',
          syncID: [
            'BY70BPSB3014F000000006870102'
          ],
          balance: 1.97
        }
      }
    ],
    [
      {
        productClassId: 1,
        productTypeId: 821,
        productName: null,
        icon: '',
        background: '',
        backColor1: '#9FA3C1',
        backColor2: '#B3C0BE',
        contractType: 1,
        contractId: '339847299',
        contractNumber: '5315398',
        refContractNumber: null,
        account: 'BY37BPSB3014F000000005315398',
        name: 'ЛПЦ Карточный счет физических лиц (BYN)',
        currencyCode: '933',
        currencyName: 'BYN',
        dateStart: 1496869200000,
        dateEnd: null,
        dateClosed: null,
        percentRate: 0.01,
        availableAmount: 2480.52,
        amount: 2480.52,
        unit: 1,
        creditCurrentPayment: null,
        creditRest: null,
        descr: 'Дополнительный офис №300 Гомель',
        paymentPercent: null,
        principalDebt: null,
        percentAccuralUrgent: null,
        percentUrgent: null,
        departmentNumber: '369-300',
        contractAccount: 'BY56BPSB30143000003209330000',
        isGracePeriod: null,
        isUseInDebitTransactions: 1,
        overdraftLimit: null,
        packageContractNumber: '5315400',
        packageContractKind: '92004',
        isFamily: false,
        cardList: [
          {
            contractId: '339847299',
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
            cardId: '978101059',
            panCode: '543553******7451',
            name: 'ЛПЦ MC Gold Chip PayPass, BYN',
            yearEnd: 2023,
            monthEnd: 6,
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
            actionCode: 1050507,
            actionName: 'Заявление на выпуск дополнительной карты лицу, не являющемуся владельцем счета из CRM (СБОЛ) (автоисполнение)',
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
        products: [
          {
            id: '978101059',
            type: 'card'
          }
        ],
        account: {
          id: '339847299',
          type: 'ccard',
          title: '*7451',
          instrument: 'BYN',
          syncID: [
            'BY37BPSB3014F000000005315398',
            '543553******7451'
          ],
          balance: 2480.52
        }
      }
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
