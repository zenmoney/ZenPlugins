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
        // mainProduct: {
        //   id: 100000003,
        //   type: 'account',
        //   contractNumber: '1000003'
        // },
        products: [
          {
            id: '100000004',
            type: 'card'
          }
        ],
        account: {
          id: '100000003',
          type: 'ccard',
          title: '*2222',
          instrument: 'BYN',
          syncID: [
            'BY78BPSB3014F000000001000003',
            '411111******2222'
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
      },
      {
        // mainProduct: {
        //   id: 100000005,
        //   type: 'account',
        //   contractNumber: '1043333'
        // },
        products: [],
        account: {
          id: '100000005',
          type: 'ccard',
          title: '*3333',
          instrument: 'BYN',
          syncID: [
            'BY85BPSB3014F000000001043333'
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
        contractId: '100000006',
        contractNumber: '1000005',
        refContractNumber: null,
        account: 'BY24BPSB3014F000000001000005',
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
        contractAccount: 'BY19BPSB30141000000000000008',
        isGracePeriod: null,
        isUseInDebitTransactions: 1,
        overdraftLimit: null,
        packageContractNumber: '1000006',
        packageContractKind: '92004',
        isFamily: false,
        cardList: [
          {
            contractId: '100000006',
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
            cardId: '100000007',
            panCode: '555555******4444',
            name: 'ЛПЦ MC Gold Chip PayPass, BYN',
            yearEnd: 2023,
            monthEnd: 6,
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
            id: '100000007',
            type: 'card'
          }
        ],
        account: {
          id: '100000006',
          type: 'ccard',
          title: '*4444',
          instrument: 'BYN',
          syncID: [
            'BY24BPSB3014F000000001000005',
            '555555******4444'
          ],
          balance: 2480.52
        }
      }
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
