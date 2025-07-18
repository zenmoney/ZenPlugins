import { convertLoan, convertAccounts } from '../../../converters.js'

describe('convertLoan', () => {
  it.each([
    [
      {
        productClassId: 3,
        productTypeId: 50,
        productName: 'Кредит',
        icon: 'ic_loan',
        background: '',
        backColor1: '#33C985',
        backColor2: '#4FC5BC',
        contractType: 50,
        contractId: '232951310120',
        contractNumber: '704-63478/17',
        refContractNumber: null,
        account: null,
        name: 'Кредит 704-63478/17',
        currencyCode: '933',
        currencyName: 'BYN',
        dateStart: 1506373200000,
        dateEnd: 2137006800000,
        dateClosed: 2137006800000,
        percentRate: 5.65,
        amount: 60000,
        unit: 1,
        creditCurrentPayment: '240.94',
        creditRest: '50263.54',
        descr: 'КД (физ)',
        paymentPercent: null,
        principalDebt: null,
        percentAccuralUrgent: '240.94',
        percentUrgent: '0',
        departmentNumber: null,
        contractAccount: null,
        isGracePeriod: null,
        isUseInDebitTransactions: null,
        overdraftLimit: null,
        packageContractNumber: null,
        packageContractKind: null,
        isFamily: null,
        cardList: [],
        actionList: []
      },
      {
        account: {
          id: '232951310120',
          instrument: 'BYN',
          balance: -50263.54,
          startBalance: 60000,
          type: 'loan',
          title: 'Кредит 704-63478/17',
          startDate: new Date(1506373200000),
          capitalization: true,
          percent: 5.65,
          endDateOffsetInterval: 'day',
          endDateOffset: 7299,
          payoffInterval: 'month',
          payoffStep: 1,
          syncID: ['7046347817']
        },
        products: []
      }
    ],
    [
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
        amount: 8029.9,
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
        account: {
          id: '384376202',
          instrument: 'BYN',
          available: 8029.9,
          creditLimit: 10000,
          type: 'ccard',
          title: '"Добро пожаловать в Сбербанк" 12 месяцев (СР-1,5 продукт 589)(классик, классический, статусный, голд, "ComPass")неуст.',
          percent: 7.25,
          syncID: ['5161070']
        },
        products: []
      }
    ]
  ])('converts loan', (apiAccount, account) => {
    expect(convertLoan(apiAccount)).toEqual(account)
  })
})

describe('convertAccounts', () => {
  it.each([
    [
      {
        accounts: [
          {
            icon: '',
            name: 'ЛПЦ Карточный счет физических лиц с грейс-периодом (BYN)',
            descr: 'Дополнительный офис №100 Брест',
            unit: 1,
            amount: 0,
            account: 'BY76BPSB3014F000000005504913',
            dateStart: 1502658000000,
            isFamily: false,
            contractId: '365597460',
            background: '',
            backColor1: '#9FA3C1',
            backColor2: '#B3C0BE',
            percentRate: 0.01,
            currencyName: 'BYN',
            currencyCode: '933',
            contractType: 1,
            productTypeId: 829,
            contractNumber: '5504913',
            productClassId: 1,
            availableAmount: 0,
            contractAccount: 'BY53BPSB30141000006189330000',
            departmentNumber: '369-100',
            isUseInDebitTransactions: 1,
            status: 1,
            cardList:
              [
                {
                  contract: null,
                  cardId: '1226654183',
                  contractId: '365597460',
                  cardAccountNumber: 'BY76BPSB3014F000000005504913',
                  panCode: '543553******4147',
                  productName: 'MasterCard',
                  smartVistaId: '200013001961',
                  stateSignature: 'BETRAY',
                  paymentSystemId: '2',
                  productTypeId: 8983,
                  amount: 0,
                  name: 'MasterCard Standard',
                  descr: '0',
                  status: 0,
                  yearEnd: 2026,
                  monthEnd: 7,
                  cardExpire: 1785445200000,
                  icon: 'ic_mastercard',
                  imageUri: 'mc_standard_chip.png',
                  textColor: 'ff000000',
                  background: null,
                  backColor1: '#FABB40',
                  backColor2: '#EF6A5D',
                  iconCode: 'mc_36_mastercard_standart',
                  isFamily: false,
                  isBelavia: false,
                  isMoneyback: false,
                  dominantColor: '#A3A7A9',
                  cardholderName: 'NIKOLAY NIKOLAEV',
                  processingCenter: 2,
                  properties: ['IS_P2P_WITHOUT_FEE', 'IS_INTERNET_PASS']
                }
              ],
            actionList:
              [
                {
                  actionName: 'Подключение/изменение набора категорий money-back',
                  actionCode: 1051028,
                  actionGroup: 700
                },
                {
                  actionName: 'Замена карты по сроку действия из CRM (СБОЛ) (автоисполнение)',
                  actionCode: 1150325,
                  actionGroup: 125
                }
              ],
            properties: []
          },
          {
            icon: 'ic_loan',
            name: '«НаСТОящая кредитка» с grace-периодом 5 лет (СР+2 продукт 606 )',
            dateEnd: 1819659600000,
            descr: 'Дополнительный офис №100 Брест',
            unit: 1,
            amount: 3870,
            dateStart: 1502658000000,
            isFamily: false,
            hasReport: false,
            contractId: '365599792',
            background: '',
            backColor1: '#33C985',
            backColor2: '#4FC5BC',
            percentRate: 1,
            currencyName: 'BYN',
            currencyCode: '933',
            contractType: 51,
            isGracePeriod: '1',
            productTypeId: 606,
            contractNumber: '151-60723/17',
            overdraftLimit: 3870,
            productClassId: 3,
            availableAmount: 0,
            contractAccount: 'BY76BPSB24271000000049330000',
            departmentNumber: '369-100',
            refContractNumber: '5504913',
            isUseInDebitTransactions: 0,
            status: 1,
            cardList: [],
            actionList: [],
            properties: []
          }
        ],
        moneyBoxes: []
      },
      {
        accounts: [
          {
            available: 3870,
            creditLimit: 3870,
            id: '365597460',
            instrument: 'BYN',
            percent: 0.01,
            syncID: ['BY76BPSB3014F000000005504913', '543553******4147'],
            title: '*4147',
            type: 'ccard'
          }
        ],
        accountsByContractNumber: {
          5504913: {
            id: '365597460',
            instrument: 'BYN'
          }
        },
        products: [
          {
            id: '1226654183',
            type: 'card'
          }
        ]
      }
    ],
    [
      {
        accounts: [
          {
            icon: 'ic_loan',
            name: '«НаСТОящая кредитка» с grace-периодом 5 лет (СР+2 продукт 606 )',
            dateEnd: 1819659600000,
            descr: 'Дополнительный офис №100 Брест',
            unit: 1,
            amount: 3870,
            dateStart: 1502658000000,
            isFamily: false,
            hasReport: false,
            contractId: '365599792',
            background: '',
            backColor1: '#33C985',
            backColor2: '#4FC5BC',
            percentRate: 1,
            currencyName: 'BYN',
            currencyCode: '933',
            contractType: 51,
            isGracePeriod: '1',
            productTypeId: 606,
            contractNumber: '151-60723/17',
            overdraftLimit: 3870,
            productClassId: 3,
            availableAmount: 0,
            contractAccount: 'BY76BPSB24271000000049330000',
            departmentNumber: '369-100',
            refContractNumber: '5504913',
            isUseInDebitTransactions: 0,
            status: 1,
            cardList: [],
            actionList: [],
            properties: []
          }
        ],
        moneyBoxes: []
      },
      {
        accounts: [
          {
            available: 3870,
            creditLimit: 3870,
            id: '365599792',
            instrument: 'BYN',
            percent: 1,
            syncID: ['5504913'],
            title: '«НаСТОящая кредитка» с grace-периодом 5 лет (СР+2 продукт 606 )',
            type: 'ccard'
          }
        ],
        accountsByContractNumber: {
          '151-60723/17': {
            id: '365599792',
            instrument: 'BYN'
          }
        },
        products: []
      }
    ]
  ])('converts accounts loan', (apiAccount, account) => {
    expect(convertAccounts(apiAccount)).toEqual(account)
  })
})
