import { collapseDoubleAccounts } from '../../../api'
import { convertAccount } from '../../../converters'

const accounts = {
  'CreditCardTW': [
    [
      {
        '$id': '3',
        Order: 7,
        ContractNumber: '2258773215',
        ProductName: 'Карта Рассрочки',
        ProductId: 0,
        ProductType: 7,
        Contract: {
          '$id': '4',
          Debt: {
            '$id': '5',
            DebtDays: 0,
            DebtAmount: 0,
            LastPaymentDebtDays: 0
          },
          Properties: {
            '$id': '6',
            NextPaymentDate: '2019-05-05T00:00:00',
            FirstPaymentDate: '2019-04-24T00:00:00',
            RecPaymentDate: '2019-04-14T00:00:00',
            RecPaymentDateShow: '2019-04-19T00:00:00',
            SumToPay: 0,
            ContractBillingDate: '2019-04-24T00:00:00'
          }
        },
        ContractStatus: 1,
        AccountNumber: '40817810393280001234',
        CreditLimit: 150000,
        AvailableBalance: 150000,
        InstalmentDebtSum: 0,
        MinMonthDebtAmount: 0,
        MainCardStatus: 2,
        MainCardNumber: '450726XXXXXX0015',
        IsPolza: false,
        TotalIndebtedness: 94300,
        PrincipalDebtSum: 0,
        InterestDebtSum: 0,
        FeeDebtSum: 0,
        PenaltySum: 0,
        DateCreate: '2017-11-11T00:00:00',
        DateSign: '2017-11-11T00:00:00',
        StartPaymentPeriod: 5,
        OverdueDebtSum: 0,
        Colour: 3,
        RecommendedPaymentSum: 0,
        IsInstalmentProduct: true,
        CardType: 2,
        CreditCardTWGuiData: {
          '$id': '7',
          CreditCardTWGuiStatus: 1,
          DisplayedPayments: 0,
          ShowGauge: false,
          DaysLeftWordAgreement: 0,
          DebtDaysWordAgreement: 3,
          PaymentSystem: 1,
          DisplayOrder: 0,
          PercentAvailable: 100,
          ShowTwoBalances: false
        },
        OuterLimitInfo: {
          '$id': '8',
          IsOuterLimitOn: false,
          OuterCreditLimit: 0,
          OuterAvailableBalance: 0,
          OuterCreditBalance: 0,
          UsedOuterCreditLimit: 0,
          UsedPartnersCreditLimit: 0
        },
        IsActivationAvailable: false,
        PaymentDetails: {
          '$id': '9',
          OverdueInterest: 0,
          OverdueDebtBody: 0,
          OverduePenalties: 0,
          NonOverduePenalties: 0,
          NonOverdueInterest: 0,
          NonOverdueDebtBody: 0,
          CurrentInstallmentsInMinPayment: 0,
          OverdueFees: 0,
          NonOverdueFees: 0,
          CurrentInstallments: 0
        },
        ExtraServicesInfo: {
          '$id': '10',
          IsFinProtectionAvailable: false,
          IsFinProtectionOn: false
        },
        AclipInfo: {
          '$id': '11',
          OfferedIncrease: 0,
          IncreasedCreditLimit: 150000,
          IncreasedAvailableBalance: 150000
        },
        IsPinGenerated: true,
        IsNoName: false,
        IsAdditional: false,
        MainCardMBR: 0,
        MainCardExpDate: '2022-11-30T00:00:00',
        IsPlasticActivationAvailable: false
      },
      {
        'account': {
          'balance': 0,
          'creditLimit': 150000,
          'id': '2258773215',
          'instrument': 'RUB',
          'syncID': [ '1234', '0015' ],
          'title': 'Карта Рассрочки',
          'type': 'ccard'
        },
        'details': {
          'accountNumber': '40817810393280001234',
          'cardNumber': '450726XXXXXX0015',
          'contractNumber': '2258773215',
          'title': 'Карта Рассрочки',
          'type': 'CreditCardTW'
        }
      }
    ],
    [
      {
        '$id': '12',
        Order: 7,
        ContractNumber: '2258773215',
        ProductName: 'Карта Рассрочки - неименная',
        ProductId: 0,
        ProductType: 7,
        Contract: {
          '$id': '13',
          Debt: {
            '$id': '14',
            DebtDays: 0,
            DebtAmount: 0,
            LastPaymentDebtDays: 0
          },
          Properties: {
            '$id': '15',
            NextPaymentDate: '2019-05-05T00:00:00',
            FirstPaymentDate: '2019-04-24T00:00:00',
            RecPaymentDate: '2019-04-14T00:00:00',
            RecPaymentDateShow: '2019-04-19T00:00:00',
            SumToPay: 0,
            ContractBillingDate: '2019-04-24T00:00:00'
          }
        },
        ContractStatus: 1,
        AccountNumber: '40817810393280001234',
        CreditLimit: 150000,
        AvailableBalance: 150000,
        InstalmentDebtSum: 0,
        MinMonthDebtAmount: 0,
        MainCardStatus: 2,
        MainCardNumber: '450726XXXXXX3456',
        IsPolza: false,
        TotalIndebtedness: 94300,
        PrincipalDebtSum: 0,
        InterestDebtSum: 0,
        FeeDebtSum: 0,
        PenaltySum: 0,
        DateCreate: '2017-11-11T00:00:00',
        DateSign: '2017-11-11T00:00:00',
        StartPaymentPeriod: 5,
        OverdueDebtSum: 0,
        Colour: 3,
        RecommendedPaymentSum: 0,
        IsInstalmentProduct: true,
        CardType: 2,
        CreditCardTWGuiData: {
          '$id': '16',
          CreditCardTWGuiStatus: 1,
          DisplayedPayments: 0,
          ShowGauge: false,
          DaysLeftWordAgreement: 0,
          DebtDaysWordAgreement: 3,
          PaymentSystem: 1,
          DisplayOrder: 1,
          PercentAvailable: 100,
          ShowTwoBalances: false
        },
        OuterLimitInfo: {
          '$id': '17',
          IsOuterLimitOn: false,
          OuterCreditLimit: 0,
          OuterAvailableBalance: 0,
          OuterCreditBalance: 0,
          UsedOuterCreditLimit: 0,
          UsedPartnersCreditLimit: 0
        },
        IsActivationAvailable: false,
        PaymentDetails: {
          '$id': '18',
          OverdueInterest: 0,
          OverdueDebtBody: 0,
          OverduePenalties: 0,
          NonOverduePenalties: 0,
          NonOverdueInterest: 0,
          NonOverdueDebtBody: 0,
          CurrentInstallmentsInMinPayment: 0,
          OverdueFees: 0,
          NonOverdueFees: 0,
          CurrentInstallments: 0
        },
        ExtraServicesInfo: {
          '$id': '19',
          IsFinProtectionAvailable: false,
          IsFinProtectionOn: false
        },
        AclipInfo: {
          '$id': '20',
          OfferedIncrease: 0,
          IncreasedCreditLimit: 150000,
          IncreasedAvailableBalance: 150000
        },
        IsPinGenerated: true,
        IsNoName: true,
        IsAdditional: false,
        MainCardMBR: 0,
        MainCardExpDate: '2022-10-31T00:00:00',
        IsPlasticActivationAvailable: false
      },
      {
        'account': {
          'balance': 0,
          'creditLimit': 150000,
          'id': '2258773215',
          'instrument': 'RUB',
          'syncID': [ '1234', '3456' ],
          'title': 'Карта Рассрочки - неименная',
          'type': 'ccard'
        },
        'details': {
          'accountNumber': '40817810393280001234',
          'cardNumber': '450726XXXXXX3456',
          'contractNumber': '2258773215',
          'title': 'Карта Рассрочки - неименная',
          'type': 'CreditCardTW'
        }
      }
    ]
  ],
  'CreditLoan': [
    [
      {
        $id: '3',
        AccBalanceWithoutDebt: 1531.29,
        AccountBalance: 3884.81,
        AccountNumber: '42301810440640097576',
        Colour: 3,
        Contract: {
          $id: '4',
          Debt: { $id: '5', DebtDays: 0, DebtAmount: 0, LastPaymentDebtDays: 0, IsPaymentPaid: true },
          LastPayDate: '2020-04-18T00:00:00+03:00',
          Properties: {
            $id: '6',
            FirstPaymentDate: '2018-04-27T00:00:00+03:00',
            LastPaymentNum: 12,
            NextPaymentDate: '2019-05-13T00:00:00+03:00',
            PaymentNum: 24,
            RecPaymentDate: '2019-05-03T00:00:00+03:00',
            RecPaymentDateShow: '2019-05-08T00:00:00+03:00',
            RemainingDebt: 0,
            SumToPay: 1531.29,
            UnpaidPaymentNum: 0
          }
        },
        ContractNumber: '2268605008',
        ContractStatus: 1,
        CreditAmount: 33714,
        CreditLoanGuiData: {
          $id: '8',
          CreditLoanGuiStatus: 6,
          DebtDaysWordAgreement: 3,
          DisplayOrder: 1,
          FollowingDate: '2019-06-13T00:00:00+03:00',
          FollowingSum: 1531.29,
          PercentPaid: 50,
          ScheduleAvailable: true,
          ShowCompleted: false,
          ShowDetails: true,
          ShowGauge: false,
          ShowSchedule: true
        },
        CurPaymentIsPaid: false,
        DateClosure: '0001-01-01T00:00:00',
        DateSign: '2018-04-05T03:00:00+03:00',
        IsEarlyRepayment: false,
        Order: 1,
        OverdueDaysNum: 0,
        Payment: 1531.29,
        PenaltySum: 0,
        ProductName: 'Кредит на товар',
        ProductSet: { $id: '7', Code: 'Без переплаты', Name: '0-0-24_новый_Онлайн' },
        ProductType: 1,
        RepaymentAmount: 13801.36,
        SigningChannel: 2,
        SmsPackService: false
      },
      {
        'account': {
          'balance': -13801.36,
          'capitalization': true,
          'endDateOffset': 24,
          'endDateOffsetInterval': 'month',
          'id': '2268605008',
          'instrument': 'RUB',
          'payoffInterval': 'month',
          'payoffStep': 1,
          'percent': 0.1,
          'startBalance': 33714,
          'startDate': '2018-04-05T03:00:00+03:00',
          'syncID': ['5008'],
          'title': 'Кредит на товар',
          'type': 'loan'
        },
        'details': {
          'accountNumber': '42301810440640097576',
          'cardNumber': undefined,
          'contractNumber': '2268605008',
          'title': 'Кредит на товар',
          'type': 'CreditLoan'
        }
      }
    ],
    [
      {
        $id: '9',
        AccBalanceWithoutDebt: 707.28,
        AccountBalance: 3884.81,
        AccountNumber: '42301810440640097576',
        Colour: 3,
        Contract: {
          $id: '10',
          Debt: { $id: '11', DebtDays: 0, DebtAmount: 0, LastPaymentDebtDays: 0, IsPaymentPaid: true },
          LastPayDate: '2021-03-06T00:00:00+03:00',
          Properties: {
            $id: '12',
            FirstPaymentDate: '2019-03-15T00:00:00+03:00',
            LastPaymentNum: 2,
            NextPaymentDate: '2019-05-25T00:00:00+03:00',
            PaymentNum: 24,
            RecPaymentDate: '2019-05-15T00:00:00+03:00',
            RecPaymentDateShow: '2019-05-20T00:00:00+03:00',
            RemainingDebt: 0,
            SumToPay: 707.28,
            UnpaidPaymentNum: 0
          }
        },
        ContractNumber: '2291863337',
        ContractStatus: 1,
        CreditAmount: 15299,
        CreditLoanGuiData: {
          $id: '14',
          CreditLoanGuiStatus: 6,
          DebtDaysWordAgreement: 3,
          DisplayOrder: 2,
          FollowingDate: '2019-06-25T00:00:00+03:00',
          FollowingSum: 707.28,
          PercentPaid: 8,
          ScheduleAvailable: true,
          ShowCompleted: false,
          ShowDetails: true,
          ShowGauge: false,
          ShowSchedule: true
        },
        CurPaymentIsPaid: false,
        DateClosure: '0001-01-01T00:00:00',
        DateSign: '2019-02-19T03:00:00+03:00',
        IsEarlyRepayment: false,
        Order: 1,
        OverdueDaysNum: 0,
        Payment: 707.28,
        PenaltySum: 0,
        ProductName: 'Кредит на товар',
        ProductSet: { $id: '13', Code: 'Без переплаты', Name: '0-0-24_СК10_NEW_Онлайн' },
        ProductType: 1,
        RepaymentAmount: 10373.93,
        SigningChannel: 2,
        SmsPackService: false
      },
      {
        'account': {
          'balance': -10373.93,
          'capitalization': true,
          'endDateOffset': 24,
          'endDateOffsetInterval': 'month',
          'id': '2291863337',
          'instrument': 'RUB',
          'payoffInterval': 'month',
          'payoffStep': 1,
          'percent': 0.1,
          'startBalance': 15299,
          'startDate': '2019-02-19T03:00:00+03:00',
          'syncID': ['3337'],
          'title': 'Кредит на товар',
          'type': 'loan'
        },
        'details': {
          'accountNumber': '42301810440640097576',
          'cardNumber': undefined,
          'contractNumber': '2291863337',
          'title': 'Кредит на товар',
          'type': 'CreditLoan'
        }
      }
    ],
    [
      {
        $id: '15',
        AccBalanceWithoutDebt: 1643.94,
        AccountBalance: 3884.81,
        AccountNumber: '42301810440640097576',
        Colour: 3,
        Contract: {
          $id: '16',
          Debt: { $id: '17', DebtDays: 0, DebtAmount: 0, LastPaymentDebtDays: 0, IsPaymentPaid: true },
          LastPayDate: '2020-10-30T00:00:00+03:00',
          Properties: {
            $id: '18',
            FirstPaymentDate: '2017-11-01T00:00:00+03:00',
            LastPaymentNum: 18,
            NextPaymentDate: '2019-05-22T00:00:00+03:00',
            PaymentNum: 36,
            RecPaymentDate: '2019-05-12T00:00:00+03:00',
            RecPaymentDateShow: '2019-05-17T00:00:00+03:00',
            RemainingDebt: 0,
            SumToPay: 1643.94,
            UnpaidPaymentNum: 0
          }
        },
        ContractNumber: '2255951986',
        ContractStatus: 1,
        CreditAmount: 46152,
        CreditLoanGuiData: {
          $id: '20',
          CreditLoanGuiStatus: 6,
          DebtDaysWordAgreement: 3,
          DisplayOrder: 0,
          FollowingDate: '2019-06-22T00:00:00+03:00',
          FollowingSum: 1643.94,
          PercentPaid: 50,
          ScheduleAvailable: true,
          ShowCompleted: false,
          ShowDetails: true,
          ShowGauge: false,
          ShowSchedule: true
        },
        CurPaymentIsPaid: false,
        DateClosure: '0001-01-01T00:00:00',
        DateSign: '2017-09-29T03:00:00+03:00',
        IsEarlyRepayment: false,
        Order: 1,
        OverdueDaysNum: 0,
        Payment: 1643.94,
        PenaltySum: 0,
        ProductName: 'Кредит на товар',
        ProductSet: { $id: '19', Code: 'Без переплаты', Name: '0-0-36_СК22%_УР' },
        ProductType: 1,
        RepaymentAmount: 22442,
        SigningChannel: 2,
        SmsPackService: false
      },
      {
        'account': {
          'balance': -22442,
          'capitalization': true,
          'endDateOffset': 36,
          'endDateOffsetInterval': 'month',
          'id': '2255951986',
          'instrument': 'RUB',
          'payoffInterval': 'month',
          'payoffStep': 1,
          'percent': 0.1,
          'startBalance': 46152,
          'startDate': '2017-09-29T03:00:00+03:00',
          'syncID': ['1986'],
          'title': 'Кредит на товар',
          'type': 'loan'
        },
        'details': {
          'accountNumber': '42301810440640097576',
          'cardNumber': undefined,
          'contractNumber': '2255951986',
          'title': 'Кредит на товар',
          'type': 'CreditLoan'
        }
      }
    ]
  ]
}

describe('convertAccount', () => {
  for (let accountType in accounts) {
    for (let accountNum in accounts[accountType]) {
      it(`should converts ${accountType} #${accountNum} account`, () => {
        expect(
          convertAccount(accounts[accountType][accountNum][0], accountType)
        ).toEqual(
          accounts[accountType][accountNum][1]
        )
      })
    }
  }
})

describe('collapseDoubleAccounts', () => {
  it('should group CreditCardTW accounts', () => {
    const accountType = 'CreditCardTW'
    expect(
      collapseDoubleAccounts(accounts[accountType].map(item => convertAccount(item[0], accountType)))
    ).toEqual([
      {
        'account': {
          'balance': 0,
          'creditLimit': 150000,
          'id': '2258773215',
          'instrument': 'RUB',
          'syncID': [ '1234', '0015', '3456' ],
          'title': 'Карта Рассрочки',
          'type': 'ccard'
        },
        'details': {
          'accountNumber': '40817810393280001234',
          'cardNumber': '450726XXXXXX0015',
          'contractNumber': '2258773215',
          'title': 'Карта Рассрочки',
          'type': 'CreditCardTW'
        }
      }
    ])
  })

  it('should not group CreditLoan accounts', () => {
    const accountType = 'CreditLoan'
    expect(
      collapseDoubleAccounts(accounts[accountType].map(item => item[1], accountType))
    ).toEqual([
      accounts[accountType][2][1],
      accounts[accountType][0][1],
      accounts[accountType][1][1]
    ])
  })
})
