import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        deposits: [],
        credits: [],
        cards: [{
          Access: null,
          AccountName: null,
          Balances: {
            ActualizedTime: null,
            Available: '20000.00',
            HoldAmount: '0.00',
            Ledger: '20000.00',
            Moved: null,
            OverdraftLimit: '0.00',
            ProjectedLedger: '0.00'
          },
          BranchId: '300528',
          Card: {
            AccountId: '10666536',
            Alarmed: '0',
            BranchDesc: 'ÀÒ "ÎÒÏ ÁÀÍÊ"',
            CanUnblock: 'true',
            CardAccount: '262061299728',
            CardId: '0C5D0B6B99D698C0A26368EB64DE01CE',
            CardName: null,
            CardNo: '436323******1365',
            CardStateId: '29',
            Contract: null,
            ContractEndDate: '01-01-2999',
            ContractId: '2124956',
            ContractNumber: '2130591',
            CreditLimit: {
              AllDebtBalance: '0',
              DueDate: '01-10-2020',
              InterestRate: '36.00',
              OutstandingAmount: '0',
              PastDue: '0',
              PastDueInterest: '0',
              Penalty: '0',
              TotalAmount: '20000',
              UsedlAmount: '0'
            },
            CurrencyCode: '980',
            DisplayOrder: '0',
            EmbossedName: 'NIKOLAY NIKOLAEV',
            EndDate: '30-11-2022',
            EnrolledDate: '06-11-2019',
            ExtCardID: '4205137',
            FrontStatusDate: null,
            IBAN: 'UA373005280000000262061299728',
            IsExternal: 'false',
            IsPrimary: 'true',
            LegalContractNumber: '0134/980/1299728/19',
            Loyalty: {
              MastercardRewards: {
                Enabled: 'false',
                EnabledSAML: 'true',
                Points: '0',
                SiteId: null
              },
              Tickets: {
                AvailableBonus: '261.66',
                LoyaltyProgramClientID: null,
                LoyaltyProgramID: '21',
                LoyaltyProgramURL: 'https://avia.tickets.ua/en/login_page?refid=3057',
                LoyaltyProgramURLHint: 'Go to the login page of Tickets personal account.',
                LoyaltyProgramURLText: 'For tickets',
                loyaltyProgramName: 'Ãðóïïà [10], "[141] Travel Card, [161] Travel Card 2,[321] Travel Card 3, [322] Travel Card 4"'
              }
            },
            MainLimitName: 'Êî-áðåíä êàðòà Trave',
            Options: {
              CanAddAppleWallet: 'false',
              CanAddGooglePay: 'false',
              CanAddSMSInfo: 'false',
              CanEditLimits: 'false',
              CanGetRealCardNo: 'true',
              CanRefreshLimits: 'false',
              CanRefreshPINCounter: 'false',
              CanRemoveSMSInfo: 'false',
              CanResetPINCounter: 'false',
              CanSetPIN: 'false',
              CanSetSecretWord: 'false',
              CanShowLimits: 'false',
              CanShowPINCounter: 'false',
              CanShowSMSInfo: 'false'
            },
            OwnFunds: null,
            OwnerIdentifyCode: '1234567890',
            PictureVersion: '1061',
            PinTryCount: '0',
            ProjectName: null,
            ResponseId: '100',
            SavingAccountNo: null,
            ShowCard: 'false',
            SoftStopList: '1',
            State: 'BLOCKED',
            SwitchStatus: 'CANUNBLOCKCARD',
            TempLimitFrom: null,
            TempLimitId: null,
            TempLimitName: null,
            TempLimitTill: null,
            Type: 'VISA Platinum'
          },
          CreditAllowed: 'true',
          Currency: 'UAH',
          DebetAllowed: 'true',
          OwnerAddress: null,
          OwnerName: 'NIKOLAY NIKOLAEV',
          Status: null,
          TxId: '1',
          Type: 'CARD'
        }]
      },
      [
        {
          mainProduct: {
            cardIds: ['0C5D0B6B99D698C0A26368EB64DE01CE'],
            type: 'ccard',
            id: '0C5D0B6B99D698C0A26368EB64DE01CE'
          },
          account: {
            id: '0C5D0B6B99D698C0A26368EB64DE01CE',
            type: 'ccard',
            title: '*1365',
            instrument: 'UAH',
            syncID: [
              '436323******1365',
              'UA373005280000000262061299728'
            ],
            available: 20000,
            creditLimit: 20000,
            archive: true
          }
        }
      ]
    ],
    [
      {
        deposits: [],
        credits: [],
        cards: [
          {
            Type: null,
            OwnerName: null,
            OwnerAddress: null,
            Status: null,
            Access: null,
            TxId: '2',
            Currency: 'UAH',
            BranchId: null,
            AccountName: null,
            Card:
            {
              Loyalty: null,
              EndDate: null,
              CardAccount: null,
              AccountId: null,
              CardNo: '496680******3113',
              ExtCardID: null,
              Contract: null,
              EmbossedName: null,
              State: 'ACTIVE',
              ContractId: null,
              IsPrimary: 'false',
              Type: null,
              CurrencyCode: '980',
              Alarmed: null,
              OwnerIdentifyCode: null,
              BranchDesc: null,
              CardName: 'gaz',
              TempLimitId: null,
              TempLimitFrom: null,
              TempLimitTill: null,
              TempLimitName: null,
              MainLimitName: null,
              SavingAccountNo: null,
              CardId: '810F910F24A04AB54E09DB378BA27461',
              CardStateId: '0',
              SoftStopList: null,
              ResponseId: null,
              SwitchStatus: null,
              ShowCard: 'true',
              PictureVersion: null,
              CanUnblock: null,
              IsExternal: 'true',
              ContractNumber: null,
              EnrolledDate: null,
              DisplayOrder: '0',
              LegalContractNumber: null,
              FrontStatusDate: null,
              OwnFunds: null,
              PinTryCount: null,
              IBAN: null,
              ContractEndDate: null,
              ProjectName: null
            },
            DebetAllowed: 'true',
            CreditAllowed: 'true'
          }
        ]
      },
      [
        {
          mainProduct: {
            cardIds: ['810F910F24A04AB54E09DB378BA27461'],
            type: 'ccard',
            id: '810F910F24A04AB54E09DB378BA27461'
          },
          account: {
            id: '810F910F24A04AB54E09DB378BA27461',
            type: 'ccard',
            title: '*3113',
            instrument: 'UAH',
            syncID: [
              '496680******3113'
            ],
            balance: 0
          }
        }
      ]
    ],
    [
      {
        deposits: [],
        credits: [],
        cards: [
          {
            Balances:
            {
              Ledger: '1606.61',
              Available: '1606.61',
              ProjectedLedger: '0.00',
              OverdraftLimit: '0.00',
              HoldAmount: '0.00',
              Moved: null,
              ActualizedTime: null
            },
            Type: 'CARD',
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerAddress: null,
            Status: null,
            Access: null,
            TxId: '1',
            Currency: 'UAH',
            BranchId: '300528',
            AccountName: null,
            Card:
            {
              Options:
              {
                CanShowLimits: 'false',
                CanRefreshLimits: 'false',
                CanEditLimits: 'false',
                CanShowSMSInfo: 'false',
                CanAddSMSInfo: 'false',
                CanRemoveSMSInfo: 'false',
                CanShowPINCounter: 'false',
                CanRefreshPINCounter: 'false',
                CanResetPINCounter: 'false',
                CanSetPIN: 'true',
                CanAddAppleWallet: 'true',
                CanSetSecretWord: 'false',
                CanAddGooglePay: 'true',
                CanGetRealCardNo: 'true'
              },
              Loyalty:
              {
                MastercardRewards:
                {
                  Enabled: 'true',
                  Points: '0',
                  EnabledSAML: 'true',
                  SiteId: 'otprewards'
                }
              },
              EndDate: '30-09-2023',
              CardAccount: '262080582458',
              AccountId: '5091823',
              CardNo: '516887******1457',
              ExtCardID: '5438528',
              Contract: null,
              EmbossedName: 'NIKOLAY NIKOLAEV',
              State: 'ACTIVE',
              ContractId: '1081605',
              IsPrimary: 'true',
              Type: 'MasterCard Debit',
              CurrencyCode: '980',
              Alarmed: '0',
              OwnerIdentifyCode: '1234567890',
              BranchDesc: 'АТ "ОТП БАНК"',
              CardName: null,
              TempLimitId: null,
              TempLimitFrom: null,
              TempLimitTill: null,
              TempLimitName: null,
              MainLimitName: 'Зарплатна карта MC M',
              SavingAccountNo: null,
              CardId: 'A91B3DD468DB05C9A799C4A9393A064E',
              CardStateId: '0',
              SoftStopList: '0',
              ResponseId: null,
              SwitchStatus: 'CANBLOCKCARD',
              ShowCard: 'true',
              PictureVersion: '1281',
              CanUnblock: 'false',
              IsExternal: 'false',
              ContractNumber: '1082770',
              EnrolledDate: '14-08-2017',
              DisplayOrder: '0',
              LegalContractNumber: '243/980/011516466/17',
              FrontStatusDate: null,
              OwnFunds: null,
              PinTryCount: '0',
              IBAN: 'UA533005280000000262080582458',
              ContractEndDate: null,
              ProjectName: '"IT DISTRIBUTION", LIMITED LIABILITY COMPANY 91699'
            },
            DebetAllowed: 'true',
            CreditAllowed: 'true'
          },
          {
            Balances:
            {
              Ledger: '1606.61',
              Available: '1606.61',
              ProjectedLedger: '0.00',
              OverdraftLimit: '0.00',
              HoldAmount: '0.00',
              Moved: null,
              ActualizedTime: null
            },
            Type: 'CARD',
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerAddress: null,
            Status: null,
            Access: null,
            TxId: '2',
            Currency: 'UAH',
            BranchId: '300528',
            AccountName: null,
            Card:
            {
              Options:
              {
                CanShowLimits: 'false',
                CanRefreshLimits: 'false',
                CanEditLimits: 'false',
                CanShowSMSInfo: 'false',
                CanAddSMSInfo: 'false',
                CanRemoveSMSInfo: 'false',
                CanShowPINCounter: 'false',
                CanRefreshPINCounter: 'false',
                CanResetPINCounter: 'false',
                CanSetPIN: 'false',
                CanAddAppleWallet: 'false',
                CanSetSecretWord: 'false',
                CanAddGooglePay: 'false',
                CanGetRealCardNo: 'true'
              },
              Loyalty:
              {
                MastercardRewards:
                {
                  Enabled: 'false',
                  Points: '0',
                  EnabledSAML: 'true',
                  SiteId: 'otprewards'
                }
              },
              EndDate: '30-09-2020',
              CardAccount: '262080582458',
              AccountId: '5091823',
              CardNo: '406759******0437',
              ExtCardID: '2266109',
              Contract: null,
              EmbossedName: 'NIKOLAY NIKOLAEV',
              State: 'CANCELED',
              ContractId: '1081605',
              IsPrimary: 'true',
              Type: 'VISA Electron',
              CurrencyCode: '980',
              Alarmed: '0',
              OwnerIdentifyCode: '1234567890',
              BranchDesc: 'АТ "ОТП БАНК"',
              CardName: null,
              TempLimitId: null,
              TempLimitFrom: null,
              TempLimitTill: null,
              TempLimitName: null,
              MainLimitName: 'Зарплатна карта Visa',
              SavingAccountNo: null,
              CardId: 'DF3791C072F15EE9902E8BEDD73A25FE',
              CardStateId: '2',
              SoftStopList: '0',
              ResponseId: null,
              SwitchStatus: 'NOTHING_TO_DO',
              ShowCard: 'false',
              PictureVersion: '1106',
              CanUnblock: 'false',
              IsExternal: 'false',
              ContractNumber: '1082770',
              EnrolledDate: '14-08-2017',
              DisplayOrder: '0',
              LegalContractNumber: '243/980/011516466/17',
              FrontStatusDate: null,
              OwnFunds: null,
              PinTryCount: '0',
              IBAN: 'UA533005280000000262080582458',
              ContractEndDate: null,
              ProjectName: '"IT DISTRIBUTION", LIMITED LIABILITY COMPANY 91699'
            },
            DebetAllowed: 'true',
            CreditAllowed: 'true'
          }
        ]
      },
      [
        {
          mainProduct: {
            cardIds: ['A91B3DD468DB05C9A799C4A9393A064E', 'DF3791C072F15EE9902E8BEDD73A25FE'],
            type: 'ccard',
            id: '82458'
          },
          account: {
            id: '82458',
            type: 'ccard',
            title: '*2458',
            instrument: 'UAH',
            syncID: [
              '516887******1457',
              '406759******0437',
              'UA533005280000000262080582458'
            ],
            balance: 1606.61
          }
        }
      ]
    ],
    [
      {
        deposits: [],
        credits: [],
        cards: [
          {
            Balances:
              {
                Ledger: '-100.00',
                Available: '-100.00',
                ProjectedLedger: '0.00',
                OverdraftLimit: '0.00',
                HoldAmount: '0.00',
                Moved: null,
                ActualizedTime: null
              },
            Type: 'CARD',
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerAddress: null,
            Status: null,
            Access: null,
            TxId: '5',
            Currency: 'UAH',
            BranchId: '300528',
            AccountName: null,
            Card:
              {
                Options:
                  {
                    CanShowLimits: 'false',
                    CanRefreshLimits: 'false',
                    CanEditLimits: 'false',
                    CanShowSMSInfo: 'false',
                    CanAddSMSInfo: 'false',
                    CanRemoveSMSInfo: 'false',
                    CanShowPINCounter: 'false',
                    CanRefreshPINCounter: 'false',
                    CanResetPINCounter: 'false',
                    CanSetPIN: 'false',
                    CanAddAppleWallet: 'false',
                    CanSetSecretWord: 'false',
                    CanAddGooglePay: 'false',
                    CanGetRealCardNo: 'true',
                    CanShowAuthRules: 'false',
                    CanEditAuthRules: 'false'
                  },
                Loyalty:
                  {
                    MastercardRewards:
                      {
                        Enabled: 'false',
                        Points: '0',
                        EnabledSAML: 'true',
                        SiteId: null
                      }
                  },
                EndDate: '30-11-2018',
                CardAccount: '26252011308358',
                AccountId: '2029537',
                CardNo: '510093******3802',
                ExtCardID: '1240920',
                Contract: null,
                EmbossedName: 'NIKOLAY NIKOLAEV',
                State: 'CANCELED',
                ContractId: '587961',
                IsPrimary: 'false',
                Type: 'MasterCard Standard',
                CurrencyCode: '980',
                Alarmed: '0',
                OwnerIdentifyCode: '1234567890',
                BranchDesc: 'АТ "ОТП БАНК"',
                CardName: null,
                TempLimitId: null,
                TempLimitFrom: null,
                TempLimitTill: null,
                TempLimitName: null,
                MainLimitName: 'Дебетна карта депози',
                SavingAccountNo: null,
                CardId: '54370F40231615320CB7D44CFA5A7A00',
                CardStateId: '2',
                SoftStopList: '1',
                ResponseId: '100',
                SwitchStatus: 'NOTHING_TO_DO',
                ShowCard: 'false',
                PictureVersion: '1280',
                CanUnblock: 'false',
                IsExternal: 'false',
                ContractNumber: '588006',
                EnrolledDate: '23-11-2015',
                DisplayOrder: '0',
                LegalContractNumber: '098/980/011308358/15',
                FrontStatusDate: null,
                OwnFunds: null,
                PinTryCount: '0',
                IBAN: null,
                ContractEndDate: null,
                ProjectName: null
              },
            DebetAllowed: 'true',
            CreditAllowed: 'true'
          },
          {
            Balances:
              {
                Ledger: '-100.00',
                Available: '-100.00',
                ProjectedLedger: '0.00',
                OverdraftLimit: '0.00',
                HoldAmount: '0.00',
                Moved: null,
                ActualizedTime: null
              },
            Type: 'CARD',
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerAddress: null,
            Status: null,
            Access: null,
            TxId: '6',
            Currency: 'UAH',
            BranchId: '300528',
            AccountName: null,
            Card:
              {
                Options:
                  {
                    CanShowLimits: 'false',
                    CanRefreshLimits: 'false',
                    CanEditLimits: 'false',
                    CanShowSMSInfo: 'false',
                    CanAddSMSInfo: 'false',
                    CanRemoveSMSInfo: 'false',
                    CanShowPINCounter: 'false',
                    CanRefreshPINCounter: 'false',
                    CanResetPINCounter: 'false',
                    CanSetPIN: 'false',
                    CanAddAppleWallet: 'false',
                    CanSetSecretWord: 'false',
                    CanAddGooglePay: 'false',
                    CanGetRealCardNo: 'true',
                    CanShowAuthRules: 'false',
                    CanEditAuthRules: 'false'
                  },
                Loyalty:
                  {
                    MastercardRewards:
                      {
                        Enabled: 'false',
                        Points: '0',
                        EnabledSAML: 'true',
                        SiteId: null
                      }
                  },
                EndDate: '31-07-2020',
                CardAccount: '26252011308358',
                AccountId: '2029537',
                CardNo: '510093******2110',
                ExtCardID: '2239184',
                Contract: null,
                EmbossedName: 'NIKOLAY NIKOLAEV',
                State: 'CANCELED',
                ContractId: '587961',
                IsPrimary: 'true',
                Type: 'MasterCard Standard',
                CurrencyCode: '980',
                Alarmed: '0',
                OwnerIdentifyCode: '1234567890',
                BranchDesc: 'АТ "ОТП БАНК"',
                CardName: null,
                TempLimitId: null,
                TempLimitFrom: null,
                TempLimitTill: null,
                TempLimitName: null,
                MainLimitName: 'Дебетна карта депози',
                SavingAccountNo: null,
                CardId: 'BEAFF83F1BB2F6B9E76AE11EBA1D7B75',
                CardStateId: '2',
                SoftStopList: '0',
                ResponseId: null,
                SwitchStatus: 'NOTHING_TO_DO',
                ShowCard: 'false',
                PictureVersion: '1280',
                CanUnblock: 'false',
                IsExternal: 'false',
                ContractNumber: '588006',
                EnrolledDate: '23-11-2015',
                DisplayOrder: '0',
                LegalContractNumber: '098/980/011308358/15',
                FrontStatusDate: null,
                OwnFunds: null,
                PinTryCount: '0',
                IBAN: null,
                ContractEndDate: null,
                ProjectName: null
              },
            DebetAllowed: 'true',
            CreditAllowed: 'true'
          },
          {
            Balances:
              {
                Ledger: '-100.00',
                Available: '-100.00',
                ProjectedLedger: '0.00',
                OverdraftLimit: '0.00',
                HoldAmount: '0.00',
                Moved: null,
                ActualizedTime: null
              },
            Type: 'CARD',
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerAddress: null,
            Status: null,
            Access: null,
            TxId: '7',
            Currency: 'UAH',
            BranchId: '300528',
            AccountName: null,
            Card:
              {
                Options:
                  {
                    CanShowLimits: 'false',
                    CanRefreshLimits: 'false',
                    CanEditLimits: 'false',
                    CanShowSMSInfo: 'false',
                    CanAddSMSInfo: 'false',
                    CanRemoveSMSInfo: 'false',
                    CanShowPINCounter: 'false',
                    CanRefreshPINCounter: 'false',
                    CanResetPINCounter: 'false',
                    CanSetPIN: 'false',
                    CanAddAppleWallet: 'false',
                    CanSetSecretWord: 'false',
                    CanAddGooglePay: 'false',
                    CanGetRealCardNo: 'true',
                    CanShowAuthRules: 'false',
                    CanEditAuthRules: 'false'
                  },
                Loyalty:
                  {
                    MastercardRewards:
                      {
                        Enabled: 'false',
                        Points: '0',
                        EnabledSAML: 'true',
                        SiteId: null
                      }
                  },
                EndDate: '30-11-2018',
                CardAccount: '26252011308358',
                AccountId: '2029537',
                CardNo: '510093******3794',
                ExtCardID: '1240917',
                Contract: null,
                EmbossedName: 'NIKOLAY NIKOLAEV',
                State: 'CANCELED',
                ContractId: '587961',
                IsPrimary: 'true',
                Type: 'MasterCard Standard',
                CurrencyCode: '980',
                Alarmed: '0',
                OwnerIdentifyCode: '1234567890',
                BranchDesc: 'АТ "ОТП БАНК"',
                CardName: null,
                TempLimitId: null,
                TempLimitFrom: null,
                TempLimitTill: null,
                TempLimitName: null,
                MainLimitName: 'Дебетна карта депози',
                SavingAccountNo: null,
                CardId: 'A6ABE9FF341F2671FCBABE0C134CD8EE',
                CardStateId: '2',
                SoftStopList: '0',
                ResponseId: null,
                SwitchStatus: 'NOTHING_TO_DO',
                ShowCard: 'false',
                PictureVersion: '1280',
                CanUnblock: 'false',
                IsExternal: 'false',
                ContractNumber: '588006',
                EnrolledDate: '23-11-2015',
                DisplayOrder: '0',
                LegalContractNumber: '098/980/011308358/15',
                FrontStatusDate: null,
                OwnFunds: null,
                PinTryCount: '0',
                IBAN: null,
                ContractEndDate: null,
                ProjectName: null
              },
            DebetAllowed: 'true',
            CreditAllowed: 'true'
          }]
      },
      [{
        mainProduct: {
          cardIds: ['54370F40231615320CB7D44CFA5A7A00', 'BEAFF83F1BB2F6B9E76AE11EBA1D7B75', 'A6ABE9FF341F2671FCBABE0C134CD8EE'],
          type: 'ccard',
          id: '08358'
        },
        account: {
          id: '08358',
          type: 'ccard',
          title: '*08358',
          instrument: 'UAH',
          syncID: [
            '510093******3802',
            '510093******2110',
            '510093******3794'
          ],
          archive: true,
          balance: -100
        }
      }]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
