import { convertTransaction } from '../../../converters'

describe('Payment', () => {
  it('Payment', () => {
    expect(convertTransaction({
      DebitAmount: 676,
      ComplaintNumber: '10304532419181000004',
      AccountType: 'Transakcioni depoziti preduzetnika',
      CreditTurnover: 16073.35,
      RejectionReason: '810711',
      ID: -1,
      DebtorCreditorName: 'SRBIJA VOZ AD SRB BEOGRAD',
      PaymentCodeDescription: null,
      CurrentBalance: 23484.52,
      AccountNumber: '265163031000946641',
      NewBalance: 23484.52,
      Trnben: 'SRBIJA VOZ AD SRB BEOGRAD',
      fwStatus: 1,
      Locality: null,
      ToDate: '2024-02-10T00:00:00',
      CreditAmount: 0,
      PBO: null,
      fwNamespace: 'SagaBG.SeP.eBankingRajfModel',
      ClientName: 'ARSENII KRASNOV PR BEOGRAD',
      PBZ: null,
      CreditorModel: null,
      ClientDescription: 'DINARSKO KNJIGOVODSTVO',
      PreviousBalance: 14593.17,
      Reference: '324395963351',
      PaymentCode: null,
      FromDate: '2024-02-09T00:00:00',
      DebitTurnover: 7182,
      CompanyIdentityNumber: '4166460428',
      Description: '989115******9886 / Iznos transakcije: 676.00 u valuti RSD  Iznos u obraeunskoj valuti: 676.00 u valuti RSD',
      ClientLocality: '11030 BEOGRAD-ČUKARICA',
      end2endID: null,
      DebtorModel: null,
      ValueDate: '2024-02-09T00:00:00',
      ReferenceNumber: null,
      ClientAddress: 'KRALJICE KATARINE 12A',
      ProductCodeCore: '501',
      AmountTotal: 24631.07,
      DebitCreditAccount: null,
      fwType: 'aoCorporateDomesticAccountTurnover',
      Note: null,
      CurrencyCode: 'RSD',
      CurrencyCodeNumeric: '941'
    })).toEqual({
      comment: '989115******9886 / Iznos transakcije: 676.00 u valuti RSD  Iznos u obraeunskoj valuti: 676.00 u valuti RSD',
      date: new Date('2024-02-09T00:00:00'),
      hold: false,
      merchant: {
        fullTitle: 'SRBIJA VOZ AD SRB BEOGRAD',
        location: null,
        mcc: null
      },
      movements: [
        {
          account: {
            id: '265163031000946641RSD'
          },
          fee: 0,
          id: '324395963351',
          invoice: null,
          sum: -676
        }
      ]
    })
  })
})
