import { convertAccount } from '../../../converters'

const accounts = {
  CreditLoan: [
    [
      {
        '$id': '3',
        Order: 4,
        ContractNumber: '2293024095',
        ProductName: 'Кредит наличными',
        ProductType: 2,
        Contract:
          {
            '$id': '4',
            Debt:
              {
                '$id': '5',
                DebtDays: 0,
                DebtAmount: 0,
                LastPaymentDebtDays: 0,
                IsPaymentPaid: false
              },
            Properties:
              {
                '$id': '6',
                NextPaymentDate: '2019-06-05T00:00:00+03:00',
                PaymentNum: 48,
                FirstPaymentDate: '2019-03-26T00:00:00+03:00',
                RecPaymentDate: '2019-05-26T00:00:00+03:00',
                RecPaymentDateShow: '2019-05-31T00:00:00+03:00',
                UnpaidPaymentNum: 0,
                LastPaymentNum: 2,
                SumToPay: 10545.51,
                RemainingDebt: 10386.53
              },
            LastPayDate: '2023-03-05T00:00:00+03:00'
          },
        ContractStatus: 1,
        CreditAmount: 350000,
        Payment: 10545.51,
        OverdueDaysNum: 0,
        PenaltySum: 0,
        AccountNumber: '42301810740030385271',
        DateSign: '2019-03-05T03:00:00+03:00',
        DateClosure: '0001-01-01T00:00:00',
        SmsPackService: false,
        ProductSet: { '$id': '7', Code: 'База set C', Name: 'База 19,4% 10-999' },
        AccountBalance: 158.98,
        AccBalanceWithoutDebt: 0,
        SigningChannel: 2,
        IsEarlyRepayment: false,
        Colour: 3,
        CurPaymentIsPaid: false,
        CreditLoanGuiData:
          {
            '$id': '8',
            CreditLoanGuiStatus: 1,
            ShowDetails: true,
            ShowGauge: true,
            GaugeMaxValue: 30,
            GaugeCurrentValue: 8,
            ShowSchedule: true,
            ScheduleAvailable: true,
            DaysLeft: 22,
            DaysLeftWordAgreement: 2,
            DebtDaysWordAgreement: 3,
            DisplayOrder: 1,
            PercentPaid: 4,
            ShowCompleted: false
          }
      },
      {
        'account': {
          'capitalization': true,
          'endDateOffset': 48,
          'endDateOffsetInterval': 'month',
          'id': '2293024095',
          'instrument': 'RUB',
          'payoffInterval': 'month',
          'payoffStep': 1,
          'percent': 0.1,
          'startBalance': 350000,
          'startDate': '2019-03-05T03:00:00+03:00',
          'syncID': ['4095'],
          'title': 'Кредит наличными',
          'type': 'loan'
        },
        'details': {
          'accountNumber': '42301810740030385271',
          'cardNumber': undefined,
          'contractNumber': '2293024095',
          'title': 'Кредит наличными',
          'type': 'CreditLoan'
        }
      }
    ],
    [
      {
        '$id': '9',
        Order: 9,
        ContractNumber: '2124295810',
        ProductName: 'Кредит на товар',
        ProductType: 1,
        Contract:
          {
            '$id': '10',
            Debt:
              {
                '$id': '11',
                DebtDays: 0,
                DebtAmount: 0,
                LastPaymentDebtDays: 0
              },
            Properties:
              {
                '$id': '12',
                NextPaymentDate: '0001-01-01T00:00:00',
                PaymentNum: 6,
                FirstPaymentDate: '2010-10-12T00:00:00+04:00',
                RecPaymentDate: '0001-01-01T00:00:00',
                UnpaidPaymentNum: 0,
                SumToPay: 0
              },
            LastPayDate: '2011-03-21T00:00:00+03:00'
          },
        ContractStatus: 4,
        CreditAmount: 12672,
        Payment: 0,
        OverdueDaysNum: 0,
        PenaltySum: 0,
        AccountNumber: '42301810740030385271',
        DateSign: '2010-09-15T04:00:00+04:00',
        DateClosure: '2011-03-27T04:00:00+04:00',
        SmsPackService: false,
        ProductSet:
          {
            '$id': '13',
            Code: 'Стандартные',
            Name: 'Сада Мобильный+ 2 документа'
          },
        AccountBalance: 158.98,
        AccBalanceWithoutDebt: 158.98,
        SigningChannel: 2,
        IsEarlyRepayment: false,
        Colour: 3,
        CreditLoanGuiData:
          {
            '$id': '14',
            CreditLoanGuiStatus: 8,
            ShowDetails: false,
            ShowGauge: false,
            ShowSchedule: false,
            ScheduleAvailable: false,
            DebtDaysWordAgreement: 3,
            DisplayOrder: 4,
            ShowCompleted: false
          }
      },
      {
        'account': {
          'capitalization': true,
          'endDateOffset': 6,
          'endDateOffsetInterval': 'month',
          'id': '2124295810',
          'instrument': 'RUB',
          'payoffInterval': 'month',
          'payoffStep': 1,
          'percent': 0.1,
          'startBalance': 12672,
          'startDate': '2010-09-15T04:00:00+04:00',
          'syncID': ['5810'],
          'title': 'Кредит на товар',
          'type': 'loan'
        },
        'details': {
          'accountNumber': '42301810740030385271',
          'cardNumber': undefined,
          'contractNumber': '2124295810',
          'title': 'Кредит на товар',
          'type': 'CreditLoan'
        }
      }
    ],
    [
      {
        '$id': '15',
        Order: 10,
        ContractNumber: '2221439050',
        ProductName: 'Кредит наличными',
        ProductType: 2,
        Contract:
          {
            '$id': '16',
            Debt:
              {
                '$id': '17',
                DebtDays: 0,
                DebtAmount: 0,
                LastPaymentDebtDays: 0
              },
            Properties:
              {
                '$id': '18',
                NextPaymentDate: '0001-01-01T00:00:00',
                PaymentNum: 36,
                FirstPaymentDate: '2015-09-08T00:00:00+03:00',
                RecPaymentDate: '0001-01-01T00:00:00',
                UnpaidPaymentNum: 0,
                SumToPay: 0
              },
            LastPayDate: '2018-08-03T00:00:00+03:00'
          },
        ContractStatus: 4,
        CreditAmount: 150000,
        Payment: 0,
        OverdueDaysNum: 0,
        PenaltySum: 0,
        AccountNumber: '42301810740030385271',
        DateSign: '2015-08-19T03:00:00+03:00',
        DateClosure: '2018-08-06T03:00:00+03:00',
        SmsPackService: false,
        ProductSet:
          {
            '$id': '19',
            Code: 'base_super-score',
            Name: 'Особенный кредит_24,9%_10-500'
          },
        AccountBalance: 158.98,
        AccBalanceWithoutDebt: 158.98,
        SigningChannel: 2,
        IsEarlyRepayment: false,
        Colour: 3,
        CreditLoanGuiData:
          {
            '$id': '20',
            CreditLoanGuiStatus: 8,
            ShowDetails: false,
            ShowGauge: false,
            ShowSchedule: false,
            ScheduleAvailable: false,
            DebtDaysWordAgreement: 3,
            DisplayOrder: 3,
            ShowCompleted: false
          }
      },
      {
        'account': {
          'capitalization': true,
          'endDateOffset': 36,
          'endDateOffsetInterval': 'month',
          'id': '2221439050',
          'instrument': 'RUB',
          'payoffInterval': 'month',
          'payoffStep': 1,
          'percent': 0.1,
          'startBalance': 150000,
          'startDate': '2015-08-19T03:00:00+03:00',
          'syncID': ['9050'],
          'title': 'Кредит наличными',
          'type': 'loan'
        },
        'details': {
          'accountNumber': '42301810740030385271',
          'cardNumber': undefined,
          'contractNumber': '2221439050',
          'title': 'Кредит наличными',
          'type': 'CreditLoan'
        }
      }
    ],
    [
      {
        '$id': '21',
        Order: 10,
        ContractNumber: '2211066953',
        ProductName: 'Кредит наличными',
        ProductType: 2,
        Contract:
          {
            '$id': '22',
            Debt:
              {
                '$id': '23',
                DebtDays: 0,
                DebtAmount: 0,
                LastPaymentDebtDays: 0
              },
            Properties:
              {
                '$id': '24',
                NextPaymentDate: '0001-01-01T00:00:00',
                PaymentNum: 48,
                FirstPaymentDate: '2014-12-25T00:00:00+03:00',
                RecPaymentDate: '0001-01-01T00:00:00',
                UnpaidPaymentNum: 0,
                SumToPay: 0
              },
            LastPayDate: '2018-11-14T00:00:00+03:00'
          },
        ContractStatus: 4,
        CreditAmount: 132997,
        Payment: 0,
        OverdueDaysNum: 0,
        PenaltySum: 0,
        AccountNumber: '42301810740030385271',
        DateSign: '2014-12-05T03:00:00+03:00',
        DateClosure: '2018-11-15T03:00:00+03:00',
        SmsPackService: false,
        ProductSet: { '$id': '25', Code: 'База', Name: 'Базовый_22,9%' },
        AccountBalance: 158.98,
        AccBalanceWithoutDebt: 158.98,
        SigningChannel: 2,
        IsEarlyRepayment: false,
        Colour: 3,
        CreditLoanGuiData:
          {
            '$id': '26',
            CreditLoanGuiStatus: 8,
            ShowDetails: false,
            ShowGauge: false,
            ShowSchedule: false,
            ScheduleAvailable: false,
            DebtDaysWordAgreement: 3,
            DisplayOrder: 2,
            ShowCompleted: false
          }
      },
      {
        'account': {
          'capitalization': true,
          'endDateOffset': 48,
          'endDateOffsetInterval': 'month',
          'id': '2211066953',
          'instrument': 'RUB',
          'payoffInterval': 'month',
          'payoffStep': 1,
          'percent': 0.1,
          'startBalance': 132997,
          'startDate': '2014-12-05T03:00:00+03:00',
          'syncID': ['6953'],
          'title': 'Кредит наличными',
          'type': 'loan'
        },
        'details': {
          'accountNumber': '42301810740030385271',
          'cardNumber': undefined,
          'contractNumber': '2211066953',
          'title': 'Кредит наличными',
          'type': 'CreditLoan'
        }
      }
    ]
  ],
  CreditCard:
    [
      [
        {
          '$id': '27',
          Order: 7,
          ContractNumber: '2124296333',
          ProductName: 'Кредитная карта',
          ProductType: 3,
          Contract:
          {
            '$id': '28',
            Debt:
              {
                '$id': '29',
                DebtDays: 0,
                DebtAmount: 0,
                LastPaymentDebtDays: 0
              },
            Properties:
              {
                '$id': '30',
                NextPaymentDate: '2019-05-15T00:00:00+03:00',
                PaymentNum: 0,
                FirstPaymentDate: '2011-09-24T00:00:00+04:00',
                RecPaymentDate: '2019-04-24T00:00:00+03:00',
                RecPaymentDateShow: '2019-05-10T00:00:00+03:00',
                SumToPay: 0
              },
            LastPayDate: '0001-01-01T00:00:00'
          },
          ContractStatus: 1,
          AccountNumber: '40817810850030430052',
          CreditLimit: 45000,
          AvailableBalance: 10547.86,
          TotalIndebtedness: 34452.14,
          PrincipalDebtSum: 34452.14,
          PenaltySum: 0,
          InstalmentDebtSum: 0,
          MinMonthDebtAmount: 0,
          OverdueDaysNum: 0,
          MainCardStatus: 2,
          DateSign: '2011-08-20T04:00:00+04:00',
          ProductSet: { '$id': '31', Code: 'Классика', Name: 'Карта "Классика"' },
          MainCardNumber: '406364XXXXXX9567',
          SigningChannel: 2,
          IsPolza: false,
          Colour: 3,
          CreditCardGuiData:
          {
            '$id': '32',
            CreditCardGuiStatus: 1,
            ShowGauge: false,
            DaysLeft: 0,
            DaysLeftWordAgreement: 3,
            DebtDaysWordAgreement: 3,
            PaymentSystem: 1,
            PercentAvailable: 23,
            DisplayOrder: 0,
            ShowTopUpWarning: false
          },
          CardType: 1,
          IsPolzaLkAvalible: true,
          IsActivationAvailable: false,
          MainCardExpDate: '2022-06-30T03:00:00+03:00'
        },
        {
          'account': {
            'balance': -34452.14,
            'creditLimit': 45000,
            'id': '2124296333',
            'instrument': 'RUB',
            'syncID': ['0052', '9567'],
            'title': 'Кредитная карта',
            'type': 'ccard'
          },
          'details': {
            'accountNumber': '40817810850030430052',
            'cardNumber': '406364XXXXXX9567',
            'contractNumber': '2124296333',
            'title': 'Кредитная карта',
            'type': 'CreditCard'
          }
        }
      ]
    ],
  CreditCardTW: []
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
