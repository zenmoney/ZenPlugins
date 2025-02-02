import { convertTransaction } from '../../../converters'

describe('FX income', () => {
  it('FX income', () => {
    expect(convertTransaction({
      ShortAccountNumber: '265100000039246639',
      fwType: 'aoCorporateForeignAccountTurnover',
      ComplaintNumber: '33916800273000002',
      AccountType: 'Devizni tekući računi preduzetnika',
      CreditTurnover: 5000,
      OrganizationUnit: '163',
      ID: -1,
      DebtorCreditorName: 'SOME MERCHANT',
      PaymentCodeDescription: 'Računarske usluge',
      ProcessedDate: '2024-01-03T00:00:00',
      CurrentBalance: 10450,
      NominalInflowAmount: 5000,
      CurrencyCodeNumeric: '840',
      CurrencyCode: 'USD',
      NewBalance: 10450,
      Trnben: 'SOME MERCHANT',
      fwStatus: 1,
      ClientDescription: 'Devizno knjigovodstvo',
      ToDate: '2024-02-10T00:00:00',
      CreditAmount: 5000,
      ContractYear: '-1',
      fwNamespace: 'SagaBG.SeP.CorporateOutput',
      FormCode: '60',
      IBANNumber: 'RS35265100000039246639',
      ClientAddress: 'KRALJICE KATARINE 12A',
      DetailType: 'L',
      ContractNumber: '-1',
      AmountTotal: 15800,
      DebitAmount: 0,
      PreviousBalance: 11000,
      Reference: '1101129842884',
      PaymentCode: ' 302',
      AccountNumber: '265100000039246639',
      FromDate: '2024-01-01T00:00:00',
      DebitTurnover: 5550,
      CompanyIdentityNumber: '4166460428',
      Description: 'Knjiženje priliva po loro doznaci za pravna lica',
      BankAccount: '50022000',
      ClientLocality: '11030 BEOGRAD-ČUKARICA',
      Note: 'INVOICE XXXXX 24/01/03',
      ValueDate: '2024-01-03T00:00:00',
      ChargeBearer: null,
      DomesticAmount: 535000.5,
      ReferenceNumber: null,
      TransactionType: '310111',
      RequestedValueDate: null,
      InoBankCommission: null,
      ProductCodeCore: '120',
      ItemAmount: '5,000.00',
      RequestYear: null,
      RequestNumber: null,
      ClientName: 'SOME NAME',
      TransactionDescription: '\r\nNBS: Slog 60\r\nOsnov 302  5,000.00\r\n Računarske usluge\r\nIznos upucen od strane ino partnera 5,000.00',
      PBO: null
    })).toEqual({
      comment: 'Knjiženje priliva po loro doznaci za pravna lica',
      date: new Date('2024-01-03T00:00:00'),
      hold: false,
      merchant: {
        fullTitle: 'SOME MERCHANT',
        location: null,
        mcc: null
      },
      movements: [
        {
          account: {
            id: '265100000039246639USD'
          },
          fee: 0,
          id: '1101129842884',
          invoice: null,
          sum: 5000
        }
      ]
    })
  })
})
