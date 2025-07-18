import { convertAccounts } from '../../../converters.js'

describe('convertAccount', () => {
  it.each([
    [
      {
        accounts: [
          {
            productClassId: 2,
            productTypeId: 501,
            productName: null,
            icon: 'ic_metall_gold',
            background: '',
            backColor1: '#CC9F2E',
            backColor2: '#D6C85A',
            contractType: 6,
            contractId: '10535590',
            contractNumber: '1278147',
            refContractNumber: null,
            account: 'BY11BPSB1393F000000001278147',
            name: 'Обезличенный металл. счет (золото)',
            currencyCode: '959',
            currencyName: 'AU',
            dateStart: 1376946000000,
            dateEnd: null,
            dateClosed: null,
            percentRate: 0,
            availableAmount: 146,
            amount: 146,
            unit: 2,
            creditCurrentPayment: null,
            creditRest: null,
            descr: 'Дополнительный офис №703 на Кальварийской',
            hasReport: null,
            paymentPercent: null,
            principalDebt: null,
            percentAccuralUrgent: null,
            percentUrgent: null,
            departmentNumber: '369-703',
            contractAccount: 'BY28BPSB13937030000319590000',
            isGracePeriod: null,
            isUseInDebitTransactions: 0,
            overdraftLimit: null,
            packageContractNumber: null,
            packageContractKind: null,
            isFamily: false,
            cardList: [],
            actionList:
              [
                {
                  actionCode: 1025362,
                  actionName: 'On-line списание ДМ на другой металлический счет',
                  actionGroup: 3
                },
                {
                  actionCode: 1025495,
                  actionName: 'On-line закрытие ОМС',
                  actionGroup: 4
                },
                {
                  actionCode: 1050881,
                  actionName: 'On-line заявка на покупку драгоценных металлов с использованием сервиса Мобильный банкинг',
                  actionGroup: 1104
                },
                {
                  actionCode: 1050882,
                  actionName: 'On-line заявка на продажу драгоценных металлов с использованием сервиса Мобильный банкинг',
                  actionGroup: 1104
                }
              ],
            properties: ['IS_OMS']
          }
        ],
        moneyBoxes: []
      },
      {
        products: [],
        accountsByContractNumber: {
          1278147: { id: '10535590', instrument: 'A98' }
        },
        accounts: [
          {
            balance: 146,
            id: '10535590',
            instrument: 'A98',
            syncID: [
              'BY11BPSB1393F000000001278147'
            ],
            title: '*8147',
            type: 'ccard'
          }
        ]
      }
    ]
  ])('converts metall account', (apiAccount, account) => {
    expect(convertAccounts(apiAccount)).toEqual(account)
  })
})
