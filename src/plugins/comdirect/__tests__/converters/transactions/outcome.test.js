import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        reference: '404F086BD88329D9/34021',
        bookingStatus: 'BOOKED',
        bookingDate: '2020-05-18',
        amount: {
          value: '-29.99',
          unit: 'EUR'
        },
        remitter: {
          holderName: 'German Germany Atta Ta-Ta-Da'
        },
        deptor: null,
        creditor: null,
        valutaDate: '2020-05-18',
        directDebitCreditorId: 'DE9550010517384296',
        directDebitMandateId: 'T2312341B812413115365260',
        endToEndReference: '6786327315204905664620385505RCUR',
        newTransaction: false,
        remittanceInfo: '01Kd-Nr.: 5103930823, Rg-Nr.: 781071202580/6, Ihre Superrechnung          03End-to-End-Ref.:                   046786327315204905664620385505RCUR   05CORE / Mandatsref.:                06T2312341B812413115365260           07Gläubiger-ID:                      08DE9550010517384296                 ',
        transactionType: {
          key: 'DIRECT_DEBIT',
          text: 'Direct Debit'
        }
      },
      {
        hold: true,
        date: new Date('2020-05-18'),
        movements: [
          {
            id: '404F086BD88329D9/34021',
            account: { id: 'account' },
            invoice: null,
            sum: -29.99,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'German Germany Atta Ta-Ta-Da',
          location: null,
          mcc: null
        },
        comment: '[Direct Debit] Kd-Nr.: 5103930823, Rg-Nr.: 7810712580/6, Ihre Superrechnung'
      }
    ],
    [
      {
        reference: 'IL22113853140693/23333',
        bookingStatus: 'BOOKED',
        bookingDate: '2021-05-18',
        amount: { value: '-8.85', unit: 'EUR' },
        remitter: { holderName: 'DM-DROGERIE MARKT' },
        deptor: null,
        creditor: null,
        valutaDate: '2021-05-18',
        directDebitCreditorId: null,
        directDebitMandateId: null,
        endToEndReference: null,
        newTransaction: false,
        remittanceInfo: '01DM-DROGERIE MARKT 02BERLIN 03KARTE 6235 04KDN-REF 000000076450 ',
        // '01ROSSMANN 2524 02BERLIN 03KARTE 6235 04KDN-REF 000000080406 '
        transactionType: { key: 'DIRECT_DEBIT', text: 'Direct Debit' }
      },
      {
        hold: true,
        date: new Date('2021-05-18'),
        movements: [
          {
            id: 'IL22113853140693/23333',
            account: { id: 'account' },
            invoice: null,
            sum: -8.85,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'DM-DROGERIE MARKT',
          location: null,
          mcc: null
        },
        comment: '[Direct Debit] DM-DROGERIE MARKT 02BERLIN 03KARTE 35 04KDN-REF 000000076450'
      }
    ],
    [
      {
        reference: 'HR22113773322148/5570',
        bookingStatus: 'BOOKED',
        bookingDate: '2021-05-18',
        amount: { value: '-2.6', unit: 'EUR' },
        remitter: { holderName: 'Lotto24 by Adyen' },
        deptor: null,
        creditor: null,
        valutaDate: '2021-05-18',
        directDebitCreditorId: 'NL48ZZZ342764500000', // ???
        directDebitMandateId: '1529210642503417', // ???
        endToEndReference: 'C7429210642556801C', // ???
        newTransaction: false,
        remittanceInfo: '01Lotto24 C91937676 T109534714116 02End-to-End-Ref.: 03C7429210642556801C 04CORE / Mandatsref.: 051529210642503417 06Gläubiger-ID: 07NL48ZZZ342764500000 ', // ???
        // '01Lotto24 C91937676 T335692089204 02End-to-End-Ref.: 03C7429198590415130C 04CORE / Mandatsref.: 051829198590360970 06Gläubiger-ID: 07NL48ZZZ342764500000 '
        transactionType: { key: 'DIRECT_DEBIT', text: 'Direct Debit' }
      },
      {
        hold: true,
        date: new Date('2021-05-18'),
        movements: [
          {
            id: 'HR22113773322148/5570',
            account: { id: 'account' },
            invoice: null,
            sum: -2.6,
            fee: 0
          }
        ],
        merchant: {
          fullTitle: 'Lotto24 by Adyen',
          location: null,
          mcc: null
        },
        comment: '[Direct Debit] Lotto24 C91937676 T109534714116 02E-to-End-Ref.: 03C7429210642556801C CORE / Mandatsref.: 0515292106425037 06Gläubiger-ID: 07NL48ZZZ3427645000'
      }
    ]
  ])('should convert a Direct Debit transaction', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'EUR' })).toEqual(transaction)
  })
})
