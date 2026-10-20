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
            contractId: '10000001',
            contractNumber: '1271515',
            refContractNumber: null,
            account: 'BY13BPSB1393F000000001271515',
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
            contractAccount: 'BY23BPSB13931000000000000043',
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
          1271515: { id: '10000001', instrument: 'A98' }
        },
        accounts: [
          {
            balance: 146,
            id: '10000001',
            instrument: 'A98',
            syncID: [
              'BY13BPSB1393F000000001271515'
            ],
            title: '*1515',
            type: 'ccard'
          }
        ]
      }
    ]
  ])('converts metall account', (apiAccount, account) => {
    expect(convertAccounts(apiAccount)).toEqual(account)
  })
})
