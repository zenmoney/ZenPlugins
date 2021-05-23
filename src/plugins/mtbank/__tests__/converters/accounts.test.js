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
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
