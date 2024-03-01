import { convertTransaction } from '../../../converters'
import { debitCardGEL } from '../../../common-tests/accounts'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 3445262217,
        externalTransactionId: '6738011881',
        date: 1648324800000,
        description: 'ბარათის (5916) უსაფრთხოების სერვისის 1-ლი წლის მომსახურების საკომისიო',
        status: '3',
        subcategories: [
          {
            id: 16,
            clientSubcategory: false,
            text: 'Fees',
            color: '#4877FE',
            smallIcon: 593108,
            largeIcon: null,
            categoryCode: 'BANK_INSURE_TAX',
            subcategoryCode: 'FEES'
          }
        ],
        amount: -10,
        currency: 'GEL',
        transactionType: 'MEMORIAL_ORDER',
        transactionSubType: '30',
        clientAccountNumber: 'GE59TB7692945061200006',
        partnerAccountName: 'დებიტორები - ბარათის უსაფრთხოების სერვისის საკომისიო',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: 'ბარათის (5916) უსაფრთხოების სერვისის 1-ლი წლის მომსახურების საკომისიო',
        date: new Date('2022-03-26T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '10971234'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -10
          }
        ],
        groupKeys: [
          '6738011881',
          '1648324800000_GEL_10'
        ]
      }
    ],
    [
      {
        id: 3437739879,
        externalTransactionId: '6719714879',
        date: 1648065600000,
        description: 'ბარათის INSTANT DEB-MC (****5916) 1-ლი წლის მომსახურების საკომისიო',
        status: '3',
        subcategories: [
          {
            id: 16,
            clientSubcategory: false,
            text: 'Fees',
            color: '#4877FE',
            smallIcon: 593108,
            largeIcon: null,
            categoryCode: 'BANK_INSURE_TAX',
            subcategoryCode: 'FEES'
          }
        ],
        amount: -20,
        currency: 'GEL',
        transactionType: 'MEMORIAL_ORDER',
        transactionSubType: '30',
        clientAccountNumber: 'GE59TB7692945061200006',
        partnerAccountName: 'დებიტორები - ბარათის მომსახურების საკომისიო',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: 'ბარათის INSTANT DEB-MC (****5916) 1-ლი წლის მომსახურების საკომისიო',
        date: new Date('2022-03-23T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '10971234'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -20
          }
        ],
        groupKeys: [
          '6719714879',
          '1648065600000_GEL_20'
        ]
      }
    ],
    [
      {
        id: 3435454116,
        externalTransactionId: '6714034469',
        date: 1647979200000,
        description: 'თანხის ავტომატური შეგროვება: ანგარიშის გახსნის საკომისიო GE40TB7692936615100045/USD 2022 (68505482)',
        status: '3',
        subcategories: null,
        amount: -10,
        currency: 'GEL',
        transactionType: 'CURR_EXCHANGE',
        transactionSubType: '5',
        clientAccountNumber: 'GE59TB7692945061200006',
        partnerAccountName: 'ი/მ ილია დმიტრიევ',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: 'თანხის ავტომატური შეგროვება: ანგარიშის გახსნის საკომისიო GE40TB7692936615100045/USD 2022 (68505482)',
        date: new Date('2022-03-22T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '10971234'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -10
          }
        ],
        groupKeys: [
          '6714034469',
          '1647979200000_GEL_10'
        ]
      }
    ]
  ])('convert other transactions', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, debitCardGEL)).toEqual(transaction)
  })
})
