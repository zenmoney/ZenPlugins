import { convertAccounts } from '../../../converters.js'

describe('convertAccounts', () => {
  it.each([
    [
      {
        deposits: [
          {
            Access: 'FULL',
            AgreementTypeId: '393',
            Balances: {
              ActualizedTime: null,
              Available: null,
              HoldAmount: '0.00',
              Ledger: '24.92',
              Moved: null,
              OverdraftLimit: '0.00',
              ProjectedLedger: '0.00'
            },
            BranchDesc: 'ÀÒ "ÎÒÏ ÁÀÍÊ"',
            BranchId: '300528',
            Currency: 'UAH',
            DealId: '565013',
            DealName: null,
            Deposit: {
              AccountClass: 'false',
              AccountClassNote: null,
              AccruedInterestSum: '0.03',
              AccruedInterestWithdrawed: '0.00',
              AgreementDate: '15-11-2019',
              AgreementNo: 'IB/108989/19',
              Alarmed: '0',
              AutoProlongForDepositTypeCanBeSet: 'NO',
              CorrAccountNo: null,
              CorrIBAN: null,
              DealAutoProlongEnabled: 'NO',
              DealOperation: null,
              EndDate: null,
              FeeAccountNo: '26207455472442',
              FeeIBAN: 'UA893005280000026207455472442',
              InterestAccountNo: '26207455472442',
              InterestRate: '5.5',
              NextAccruedInterestDate: '14-10-2020',
              NextPaymentAmount: '0.03',
              OpenDate: '15-11-2019',
              Operations: {
                Credit: 'true',
                Debit: 'true',
                Renew: 'false'
              },
              PayPercentType: '1',
              PenaltyInterestRateMoment: null,
              PrincipalAccountNo: '26207455472442',
              PrincipalIBAN: 'UA893005280000026207455472442',
              RepaymentTermType: 'M'
            },
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerTaxId: '1234567890',
            ProductName: 'Campaign deposit with free withdrawal and replenishment option «Accessible money»',
            Status: 'ACTIVE',
            TxId: '1',
            Type: 'DEPOSIT',
            Visible: 'true'
          },
          {
            Access: 'FULL',
            AgreementTypeId: '61',
            Balances: {
              ActualizedTime: null,
              Available: null,
              HoldAmount: '0.00',
              Ledger: '0.00',
              Moved: null,
              OverdraftLimit: '0.00',
              ProjectedLedger: '0.00'
            },
            BranchDesc: 'ÀÒ "ÎÒÏ ÁÀÍÊ"',
            BranchId: '300528',
            Currency: 'UAH',
            DealId: '564607',
            DealName: null,
            Deposit: {
              AccountClass: 'false',
              AccountClassNote: null,
              AccruedInterestSum: '0.00',
              AccruedInterestWithdrawed: '0.00',
              AgreementDate: '04-11-2019',
              AgreementNo: '703/001684/19',
              Alarmed: '0',
              AutoProlongForDepositTypeCanBeSet: 'NO',
              CorrAccountNo: '26200455467915',
              CorrIBAN: 'UA253005280000026200455467915',
              DealAutoProlongEnabled: 'NO',
              DealOperation: null,
              EndDate: '02-05-2020',
              FeeAccountNo: '26200455467915',
              FeeIBAN: 'UA253005280000026200455467915',
              InterestAccountNo: '26200455467915',
              InterestRate: '10.5',
              NextAccruedInterestDate: null,
              NextPaymentAmount: '0.00',
              OpenDate: '04-11-2019',
              Operations: {
                Credit: 'false',
                Debit: 'false',
                Renew: 'false'
              },
              PayPercentType: '0',
              PenaltyInterestRateMoment: '1.5',
              PrincipalAccountNo: '26302455260173',
              PrincipalIBAN: 'UA033005280000026302455260173',
              RepaymentTermType: 'E'
            },
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerTaxId: '1234567890',
            ProductName: 'Term deposit with interest repayment after maturity date',
            Status: 'CLOSES',
            TxId: '2',
            Type: 'DEPOSIT',
            Visible: 'true'
          },
          {
            Access: 'FULL',
            AgreementTypeId: '61',
            Balances: {
              ActualizedTime: null,
              Available: null,
              HoldAmount: '0.00',
              Ledger: '0.00',
              Moved: null,
              OverdraftLimit: '0.00',
              ProjectedLedger: '0.00'
            },
            BranchDesc: 'ÀÒ "ÎÒÏ ÁÀÍÊ"',
            BranchId: '300528',
            Currency: 'UAH',
            DealId: '572037',
            DealName: null,
            Deposit: {
              AccountClass: 'false',
              AccountClassNote: null,
              AccruedInterestSum: '0.00',
              AccruedInterestWithdrawed: '0.00',
              AgreementDate: '26-11-2019',
              AgreementNo: 'IB/110111/19',
              Alarmed: '0',
              AutoProlongForDepositTypeCanBeSet: 'NO',
              CorrAccountNo: '37394455003207',
              CorrIBAN: 'UA853005280000037394455003207',
              DealAutoProlongEnabled: 'NO',
              DealOperation: null,
              EndDate: '24-02-2020',
              FeeAccountNo: '26307455264237',
              FeeIBAN: 'UA483005280000026307455264237',
              InterestAccountNo: '37395455003206',
              InterestRate: '12',
              NextAccruedInterestDate: null,
              NextPaymentAmount: '0.00',
              OpenDate: '26-11-2019',
              Operations: {
                Credit: 'false',
                Debit: 'false',
                Renew: 'false'
              },
              PayPercentType: '0',
              PenaltyInterestRateMoment: '1.5',
              PrincipalAccountNo: '26307455264237',
              PrincipalIBAN: 'UA483005280000026307455264237',
              RepaymentTermType: 'E'
            },
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerTaxId: '1234567890',
            ProductName: 'Term deposit with interest repayment after maturity date',
            Status: 'CLOSES',
            TxId: '3',
            Type: 'DEPOSIT',
            Visible: 'true'
          }
        ],
        credits: [],
        cards: []
      },
      [
        {
          mainProduct: {
            branchId: '300528',
            dealId: '565013',
            type: 'deposit'
          },
          account: {
            id: '565013',
            type: 'deposit',
            title: '*2442',
            instrument: 'UAH',
            syncID: [
              '26207455472442',
              'UA893005280000026207455472442'
            ],
            balance: 24.92,
            startBalance: 0,
            startDate: new Date('2019-11-14T22:00:00.000Z'),
            percent: 5.5,
            capitalization: true,
            endDateOffsetInterval: 'year',
            endDateOffset: 1,
            payoffInterval: 'month',
            payoffStep: 1
          }
        },
        {
          account: {
            id: '564607',
            type: 'deposit',
            title: '*0173',
            instrument: 'UAH',
            syncID: [
              '26302455260173',
              'UA033005280000026302455260173'
            ],
            balance: 0,
            startBalance: 0,
            startDate: new Date('2019-11-03T22:00:00.000Z'),
            percent: 10.5,
            capitalization: true,
            endDateOffsetInterval: 'day',
            endDateOffset: 179,
            payoffInterval: 'month',
            payoffStep: 1,
            archive: true
          }
        },
        {
          account: {
            id: '572037',
            type: 'deposit',
            title: '*4237',
            instrument: 'UAH',
            syncID: [
              '26307455264237',
              'UA483005280000026307455264237'
            ],
            balance: 0,
            startBalance: 0,
            startDate: new Date('2019-11-25T22:00:00.000Z'),
            percent: 12,
            capitalization: true,
            endDateOffsetInterval: 'day',
            endDateOffset: 90,
            payoffInterval: 'month',
            payoffStep: 1,
            archive: true
          }
        }
      ]
    ],
    [
      {
        deposits: [
          {
            Balances:
              {
                Ledger: '0.00',
                Available: null,
                ProjectedLedger: '0.00',
                OverdraftLimit: '0.00',
                HoldAmount: '0.00',
                Moved: null,
                ActualizedTime: null,
                BlockedAmount: null
              },
            Type: 'DEPOSIT',
            OwnerName: 'NIKOLAY NIKOLAEV',
            OwnerSName: 'NIKOLAY NIKOLAEV',
            CountryId: '804',
            Country: 'Україна',
            Status: 'CLOSES',
            Access: 'FULL',
            TxId: '31',
            BranchId: '300528',
            BranchDesc: 'АТ "ОТП БАНК"',
            ProductName: null,
            AgreementTypeId: '61',
            DealId: '342711',
            OwnerTaxId: '1234567890',
            Currency: 'UAH',
            DealName: '[CLOSED] Акційний №2',
            Visible: 'true',
            Deposit:
              {
                AgreementDate: '05-11-2018',
                OpenDate: '05-11-2018',
                EndDate: '05-03-2019',
                InterestRate: '12',
                AgreementNo: 'IB/065708/18',
                Alarmed: '0',
                AccountClass: 'false',
                AccountClassNote: null,
                FeeIBAN: 'UA353005280000026205001677897',
                PrincipalIBAN: null,
                CorrIBAN: 'UA353005280000026205001677897',
                Operations: {
                  Credit: 'false',
                  Debit: 'false',
                  Renew: 'false'
                },
                FeeAccountNo: '26205001677897',
                PayPercentType: '0',
                RepaymentTermType: 'E',
                PrincipalAccountNo: '26306455204878',
                NextAccruedInterestDate: null,
                NextPaymentAmount: '0.00',
                AccruedInterestSum: '0.00',
                AccruedInterestWithdrawed: '0.00',
                DealOperation: null,
                InterestAccountNo: '26205001677897',
                CorrAccountNo: '26205001677897',
                PenaltyInterestRateMoment: '1.5',
                AutoProlongForDepositTypeCanBeSet: 'NO',
                DealAutoProlongEnabled: 'NO'
              }
          }
        ],
        credits: [],
        cards: []
      },
      [
        {
          account: {
            id: '342711',
            type: 'deposit',
            title: '*4878',
            instrument: 'UAH',
            syncID: ['26306455204878'],
            balance: 0,
            startBalance: 0,
            startDate: new Date('2018-11-05T00:00:00+02:00'),
            percent: 12,
            capitalization: true,
            endDateOffsetInterval: 'month',
            endDateOffset: 4,
            payoffInterval: 'month',
            payoffStep: 1,
            archive: true
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
