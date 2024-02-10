import { convertTransactions } from '../../../converters'

describe('Test transfer', () => {
  it('Test transfer', () => {
    expect(
      convertTransactions(
        [
          {
            DebitAmount: 0,
            ComplaintNumber: '1897240037389693000002',
            AccountType: 'Transakcioni depoziti preduzetnika',
            CreditTurnover: 588380.85,
            RejectionReason: '500214',
            ID: -1,
            DebtorCreditorName: 'RAIFFEISEN BANKA',
            PaymentCodeDescription: 'Kupoprodaja deviza',
            CurrentBalance: 23484.52,
            AccountNumber: '265163031000946641',
            NewBalance: 23484.52,
            Trnben: 'Prodaja deviza',
            fwStatus: 1,
            Locality: 'BEOGRAD-NOVI BEOGRAD',
            ToDate: '2024-02-10T00:00:00',
            CreditAmount: 21183.8,
            PBO: '33-931589705508',
            fwNamespace: 'SagaBG.SeP.eBankingRajfModel',
            ClientName: 'SOME NAME',
            PBZ: '95-265100000039246736',
            CreditorModel: '97',
            ClientDescription: 'DINARSKO KNJIGOVODSTVO',
            PreviousBalance: 67223.21,
            Reference: '5897240037389539',
            PaymentCode: 286,
            FromDate: '2024-01-01T00:00:00',
            DebitTurnover: 632119.54,
            CompanyIdentityNumber: '4166460428',
            Description: 'Isplata dinarske protivvrednosti po otkupu USD 200,00 referenca 931589705508',
            ClientLocality: '11030 BEOGRAD-ČUKARICA',
            end2endID: null,
            DebtorModel: '97',
            ValueDate: '2024-01-03T00:00:00',
            ReferenceNumber: null,
            ClientAddress: 'SOME ADDRESS',
            ProductCodeCore: '501',
            AmountTotal: 32617.69,
            DebitCreditAccount: '265110032000000209',
            fwType: 'aoCorporateDomesticAccountTurnover',
            Note: null,
            CurrencyCode: 'RSD',
            CurrencyCodeNumeric: '941'
          },
          {
            ShortAccountNumber: '265100000039246639',
            fwType: 'aoCorporateForeignAccountTurnover',
            ComplaintNumber: '1897240037389480000004',
            AccountType: 'Devizni tekući računi preduzetnika',
            CreditTurnover: 5000,
            OrganizationUnit: '163',
            ID: -1,
            DebtorCreditorName: 'ARSENII KRASNOV PR BEOGRAD/RS',
            PaymentCodeDescription: null,
            ProcessedDate: '2024-01-03T00:00:00',
            CurrentBalance: 10450,
            NominalInflowAmount: null,
            CurrencyCodeNumeric: '840',
            CurrencyCode: 'USD',
            NewBalance: 10450,
            Trnben: 'Prodaja deviza',
            fwStatus: 1,
            ClientDescription: 'Devizno knjigovodstvo',
            ToDate: '2024-02-10T00:00:00',
            CreditAmount: 0,
            ContractYear: null,
            fwNamespace: 'SagaBG.SeP.CorporateOutput',
            FormCode: '77',
            IBANNumber: 'RS35265100000039246639',
            ClientAddress: 'SOME ADDRESS',
            DetailType: 'O',
            ContractNumber: null,
            AmountTotal: 10800,
            DebitAmount: 200,
            PreviousBalance: 11000,
            Reference: '931589705508',
            PaymentCode: null,
            AccountNumber: '265100000039246639',
            FromDate: '2024-01-01T00:00:00',
            DebitTurnover: 5550,
            CompanyIdentityNumber: '4166460428',
            Description: null,
            BankAccount: '50022000',
            ClientLocality: '11030 BEOGRAD-ČUKARICA',
            Note: 'Isplata protivvrednosti za otkup 200,00 USD po kursu USD=105.919',
            ValueDate: '2024-01-03T00:00:00',
            ChargeBearer: null,
            DomesticAmount: 21400.02,
            ReferenceNumber: null,
            TransactionType: '281121',
            RequestedValueDate: null,
            InoBankCommission: null,
            ProductCodeCore: '120',
            ItemAmount: '200.00',
            RequestYear: null,
            RequestNumber: null,
            ClientName: 'SOME NAME',
            TransactionDescription: '\r\nNBS: Slog 77',
            PBO: null
          }
        ]
      )).toEqual([
      {
        hold: false,
        date: new Date('2024-01-02T23:00:00.000Z'),
        movements: [
          {
            id: '5897240037389539',
            account: {
              id: '265163031000946641RSD'
            },
            invoice: null,
            sum: 21183.8,
            fee: 0
          },
          {
            id: '931589705508',
            account: {
              id: '265100000039246639USD'
            },
            invoice: null,
            sum: -200,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'Isplata dinarske protivvrednosti po otkupu USD 200,00 referenca 931589705508'
      }
    ])
  })
})
