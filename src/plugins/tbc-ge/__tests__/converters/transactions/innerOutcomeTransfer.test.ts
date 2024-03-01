import { convertTransaction } from '../../../converters'
import { debitCardGEL } from '../../../common-tests/accounts'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 3558518424,
        externalTransactionId: '7014227455',
        date: 1652126400000,
        description: 'N1 Supplemental Pay/Idar Nagoev',
        status: '3',
        subcategories: null,
        amount: -2997.92,
        currency: 'GEL',
        transactionType: 'CURR_EXCHANGE',
        transactionSubType: '5',
        clientAccountNumber: 'GE59TB7692945061654321',
        partnerAccountName: 'იდარ ნაგოევ',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: 'N1 Supplemental Pay/Idar Nagoev',
        date: new Date('2022-05-09T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '10971234' },
            fee: 0,
            id: null,
            invoice: null,
            sum: -2997.92
          }
        ],
        groupKeys: [
          '7014227455',
          '1652126400000_GEL_2997.92'
        ]
      }
    ]
  ])('convert inner Out transactions debitCardGEL-debitCardUSD', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, debitCardGEL)).toEqual(transaction)
  })

  it.each([
    [
      {
        id: 3967869026,
        externalTransactionId: '8009407432',
        date: 1665086400000,
        description: 'დეპოზიტზე თანხის ჩარიცხვა (ხელშ. #003508134-007860859)',
        status: '3',
        subcategories: null,
        amount: -20000,
        currency: 'GEL',
        transactionType: 'TRANSFER_GEL',
        transactionSubType: '1',
        clientAccountNumber: 'GE59TB7692945061654321',
        partnerAccountName: 'პეტრ ბისტროვ',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: 'დეპოზიტზე თანხის ჩარიცხვა (ხელშ. #003508134-007860859)',
        date: new Date('2022-10-06T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '10971234' },
            fee: 0,
            id: null,
            invoice: null,
            sum: -20000
          }
        ],
        groupKeys: [
          '8009407432',
          '1665086400000_GEL_20000'
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
        date: new Date('2022-03-22T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '10971234' },
            fee: 0,
            id: null,
            invoice: null,
            sum: -10
          }
        ],
        comment: 'თანხის ავტომატური შეგროვება: ანგარიშის გახსნის საკომისიო GE40TB7692936615100045/USD 2022 (68505482)',
        groupKeys: [
          '6714034469',
          '1647979200000_GEL_10'
        ]
      }
    ]
  ])('convert inner Out transactions debitCardGEL-depositGEL', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, debitCardGEL)).toEqual(transaction)
  })
})
