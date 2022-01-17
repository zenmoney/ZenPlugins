import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          OrderNumber: 10,
          AccountNumber: 'UA000000000000000000000000001',
          ContractNumber: '100000001',
          PassiveAmount: 50000,
          AvailableAmount: 100000,
          HoldAmount: 0,
          Limit: 100000,
          ContractDate: '2020-01-01T00:00:00',
          CardNumber: '516800******0000',
          ExpireDate: '2026-01-29T00:00:00',
          BaseSuppName: 'Основная',
          StatusName: 'Активная',
          StatusId: 0,
          ResponseId: 0,
          RenewId: '07',
          CardId: 10000001,
          ProductName: 'КОКО КАРД (Кредитна картка)',
          Currency: 'UAH',
          Type: 'MASTERCARD',
          BankId: '000000',
          Account: {
            DealId: 22022376,
            PrincipalAccountNumber: 'UA000000000000000000000000001',
            DealNumber: '100000001',
            DealState: 'ACTIVE',
            InputDate: '2021-02-03T13:52:58',
            DealDate: '2020-01-01T00:00:00',
            ExpectedCloseDate: '2022-03-03T00:00:00',
            CloseDate: null,
            Currency: 'UAH',
            ProductTypeId: 570,
            ProductTypeDescription: 'KOKO КАРД (Кредитна картка)',
            Balance: 50000,
            PlannedBalance: 0,
            Limit: 0,
            LastActive: null,
            Name: 'KOKO КАРД (Кредитна картка)',
            AccountType: 'CARD',
            BankId: 0,
            CardOmp: 0.0,
            RestCardOmp: 0.0,
            RestForGrace: null,
            DateCardOmp: '2021-02-03T00:00:00',
            LastSyncDate: '2021-01-08T00:00:00',
            CardType: 'Credit',
            InterestAccrualState: 'Enabled'
          },
          IsSmsServiceEnabled: true,
          Reissuable: true,
          PhoneNumber: '0980000000',
          State: 'Active',
          StateOptions: {
            StateId: 0,
            Transactions: true,
            Limits: true,
            Block: true,
            Statement: true,
            Details: true,
            SmsService: true,
            Reissue: false,
            Tariffs: true,
            Tokenize: true,
            Activate: false,
            ChangePin: true
          },
          IsLoanPartAllowed: true
        }
      ],
      [
        {
          products: [
            {
              id: 10000001
            }
          ],
          account: {
            id: 'UA000000000000000000000000001',
            type: 'ccard',
            title: 'КОКО КАРД (Кредитна картка)',
            instrument: 'UAH',
            syncIds: [
              'UA000000000000000000000000001',
              '10000001',
              '516800******0000'
            ],
            balance: 500.00,
            creditLimit: 1000
          }
        }
      ]
    ]
  ])('converts card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
