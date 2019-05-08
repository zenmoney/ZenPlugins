import { collapseDoubleAccounts } from '../../../api'
import { convertAccount } from '../../../converters'

const accountType = 'CreditCardTW'
const apiAccounts = [
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
  }
]
const zenAccounts = [
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

describe('convertAccount', () => {
  it('should converts CreditCardTW #1 account', () => {
    expect(convertAccount(
      apiAccounts[0], 'CreditCardTW'
    )).toEqual(
      zenAccounts[0]
    )
  })

  it('should converts CreditCardTW #2 account', () => {
    expect(convertAccount(
      apiAccounts[1], accountType
    )).toEqual(
      zenAccounts[1]
    )
  })
})

describe('convertAccount', () => {
  it('should group accounts to one', () => {
    expect(collapseDoubleAccounts(zenAccounts)).toEqual([
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
})
