import { convertAccount } from '../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        productType: 'PC',
        accountId: '1113333',
        id: 1,
        productCode: '1113333|PC',
        show: true,
        variationId: '[MASTERCARD][MCW INSTANT BYR 3Y (PAYOKAY)]',
        accruedInterest: null,
        avlBalance: '99.9',
        avlLimit: null,
        cardAccounts: [
          {
            accType: null,
            accountId: 'BY36MTBK10110008000001111000',
            accountIdenType: 'PC',
            availableBalance: null,
            contractCode: '1113333',
            currencyCode: 'BYN',
            productType: 'PC'
          }
        ],
        cards: [
          {
            blockReason: null,
            cardCurr: 'BYN',
            commisDate: '2019-01-31',
            commisSum: '99.9',
            description: 'MASTERCARD',
            embossedName: 'IVAN IVANOV',
            isOfAccntHolder: '1',
            mainCard: '1',
            over: '0',
            pan: '999999_1111',
            smsNotification: '1',
            status: 'A',
            term: '01/01',
            type: 'MASTERCARD',
            vpan: '1234567890123456',
            rbs: '1234567',
            pinPhoneNumber: '123456789012'
          }
        ],
        description: 'PayOkay',
        over: null,
        debtPayment: null,
        isActive: true,
        isOverdraft: false,
        rate: '0.0001'
      },
      {
        id: '1113333',
        type: 'card',
        title: 'PayOkay',
        productType: 'PC',
        instrument: 'BYN',
        balance: 99.9,
        creditLimit: 0,
        syncID: [
          'BY36MTBK10110008000001111000',
          'BY36MTBK10110008000001111000M',
          '1111'
        ]
      }
    ],
    [
      {
        productType: 'PC',
        accountId: 'BY46MTBK30140008999900089237',
        id: 2,
        productCode: 'BY46MTBK30140008999900089237|PC',
        show: true,
        variationId: 'CRD.5044',
        contractCardCode: '1259.15114401',
        accruedInterest: null,
        avlBalance: '2068.9',
        avlLimit: '2068.9',
        cardAccounts:
          [
            {
              accType: null,
              accountId: 'BY46MTBK30140008999900089237',
              accountIdenType: 'IBN',
              availableBalance: '2068.9',
              contractCode: '1259.15114401',
              currencyCode: 'BYN',
              isArest: false,
              productType: 'PC'
            }
          ],
        cardContract:
          [
            {
              productType: 'MTBANK_CARD',
              closeDate: '2021-03-31',
              contractNum: '39672753',
              openDate: '2018-03-06',
              cardTerm: null,
              rateBal: null,
              servicePaySum: null,
              servicePayTerm: null,
              smsNotification: null,
              tariffPlan: 'Халва MCW BYN 3Y instant'
            }
          ],
        cards: [],
        debtPayment: null,
        debtPaymentSumCom: null,
        description: 'Халва MCW BYN 3Y instant',
        gracePeriodAvalDays: null,
        gracePeriodEnd: null,
        gracePeriodLength: null,
        gracePeriodOutRateCashless: null,
        gracePeriodRateCashless: null,
        gracePeriodStart: null,
        isActive: true,
        isOverdraft: true,
        loanContractDate: null,
        loanContractNumber: null,
        loanNextPaymentAmmount: null,
        loanNextPaymentDate: null,
        minPaymentFee: null,
        minPaymentMainDebt: null,
        minPaymentOverFee: null,
        minPaymentOverMainDebt: null,
        minPaymentOverPer: null,
        minPaymentPenalty: null,
        minPaymentPer: null,
        minPaymentStandardOper: null,
        minPaymentStandardOperPer: null,
        minPaymentStateDue: null,
        minPaymentUBS: null,
        over: '2220',
        overStandardOperationRate: null,
        overdueDebts: false,
        isAvailableAddInstallments: null,
        ownFunds: '0',
        points: '0',
        pointsDate: null,
        productIdenType: 'CRP',
        rate: null,
        rateAvalInstalment: null,
        rateCash: null,
        rateCashHistory: null,
        rateCashless: null,
        rateCashlessHistory: null,
        rateChangingHistory: null,
        rateExpirPayment: null,
        standardOperationRate: null,
        overCashlessOperationsRate: null,
        overCashOperationsRate: null,
        loanContractDateTo: null,
        addInstallmentsRate: null,
        nameOfRateForAddInstallments: null,
        cashLimitAmount: null,
        rateStandartOperation: null,
        canTurnOnCash: null,
        avlLimitCash: null,
        limitOverStandartOperation: null,
        floatRateRatio: null,
        overnightRateRatio: null,
        installmentTerm: null,
        cashWithdrawalRateRatio: null
      },
      {
        id: 'BY46MTBK30140008999900089237',
        type: 'card',
        title: 'Халва MCW BYN 3Y instant',
        productType: 'PC',
        instrument: 'BYN',
        balance: -151.1,
        creditLimit: 2220,
        syncID: [
          'BY46MTBK30140008999900089237',
          'BY46MTBK30140008999900089237M'
        ]
      }
    ],
    [
      {
        productType: 'PC',
        accountId: 'BY08MTBK30140008999900559572',
        id: 1,
        productCode: 'BY08MTBK30140008999900559572|PC',
        show: true,
        variationId: 'CRD.5702',
        contractCardCode: '1158.1406544095',
        accruedInterest: null,
        avlBalance: '408.33',
        avlLimit: '355.25',
        cardAccounts:
          [
            {
              accType: null,
              accountId: 'BY08MTBK30140008999900559572',
              accountIdenType: 'IBN',
              availableBalance: '408.33',
              contractCode: '1158.1406544095',
              currencyCode: 'BYN',
              isArest: false,
              productType: 'PC'
            }
          ],
        cardContract:
          [
            {
              productType: 'MTBANK_CARD',
              closeDate: '2023-08-31',
              contractNum: '32472991',
              openDate: '2021-01-11',
              cardTerm: '08/23',
              rateBal: null,
              servicePaySum: null,
              servicePayTerm: null,
              smsNotification: null,
              tariffPlan: 'Халва MAX instant'
            }
          ],
        cards:
          [
            {
              blockReason: '',
              cardCurr: 'BYN',
              commisDate: null,
              commisSum: null,
              description: 'MasterCard World 3Y',
              embossedName: 'KIRIL RADYNO',
              isOfAccntHolder: '1',
              limits: [],
              mainCard: '1',
              over: '403.88',
              pan: '535104_7450',
              smsNotification: '0',
              status: 'A',
              term: '08/23',
              type: 'MasterCard World 3Y',
              vpan: '1453510407883964',
              rbs: '4346272',
              pinPhoneNumber: '+375296919126',
              corpCard: false,
              cardHolder: true
            }
          ],
        debtPayment: null,
        debtPaymentSumCom: null,
        description: 'Халва MAX instant',
        gracePeriodAvalDays: null,
        gracePeriodEnd: null,
        gracePeriodLength: null,
        gracePeriodOutRateCashless: null,
        gracePeriodRateCashless: null,
        gracePeriodStart: null,
        isActive: true,
        isOverdraft: true,
        loanContractDate: null,
        loanContractNumber: null,
        loanNextPaymentAmmount: null,
        loanNextPaymentDate: null,
        minPaymentFee: null,
        minPaymentMainDebt: null,
        minPaymentOverFee: null,
        minPaymentOverMainDebt: null,
        minPaymentOverPer: null,
        minPaymentPenalty: null,
        minPaymentPer: null,
        minPaymentStandardOper: null,
        minPaymentStandardOperPer: null,
        minPaymentStateDue: null,
        minPaymentUBS: null,
        over: '1450',
        overStandardOperationRate: null,
        overdueDebts: false,
        isAvailableAddInstallments: null,
        ownFunds: '53.08',
        points: '0',
        pointsDate: null,
        productIdenType: 'CRP',
        rate: null,
        rateAvalInstalment: null,
        rateCash: null,
        rateCashHistory: null,
        rateCashless: null,
        rateCashlessHistory: null,
        rateChangingHistory: null,
        rateExpirPayment: null,
        standardOperationRate: null,
        overCashlessOperationsRate: null,
        overCashOperationsRate: null,
        loanContractDateTo: null,
        addInstallmentsRate: null,
        nameOfRateForAddInstallments: null,
        cashLimitAmount: null,
        rateStandartOperation: null,
        canTurnOnCash: null,
        avlLimitCash: null,
        limitOverStandartOperation: null,
        floatRateRatio: null,
        overnightRateRatio: null,
        installmentTerm: null,
        cashWithdrawalRateRatio: null
      },
      {
        id: 'BY08MTBK30140008999900559572',
        type: 'card',
        title: 'Халва MAX instant',
        instrument: 'BYN',
        balance: -1041.67,
        syncID:
          [
            'BY08MTBK30140008999900559572',
            'BY08MTBK30140008999900559572M',
            '7450'
          ],
        productType: 'PC',
        creditLimit: 1450
      }
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
