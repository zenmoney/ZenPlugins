import { convertTransaction } from '../../../converters'
import { debitCardUSD, depositGEL } from '../../../common-tests/accounts'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 3558518423,
        externalTransactionId: '7014227456',
        date: 1652126400000,
        description: 'N1 Supplemental Pay/Idar Nagoev',
        status: '3',
        subcategories: null,
        amount: 988.83,
        currency: 'USD',
        transactionType: 'CURR_EXCHANGE',
        transactionSubType: '5',
        clientAccountNumber: 'GE59TB7692945061654321',
        partnerAccountName: 'იდარ ნაგოევ',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: 7014227455
      },
      {
        comment: 'N1 Supplemental Pay/Idar Nagoev',
        date: new Date('2022-05-09T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '10971235' },
            fee: 0,
            id: null,
            invoice: null,
            sum: 988.83
          }
        ],
        groupKeys: [
          '7014227455',
          '1652126400000_USD_988.83'
        ]
      }
    ],
    [
      {
        id: 3435454118,
        externalTransactionId: '6714034470',
        date: 1647979200000,
        description: 'თანხის ავტომატური შეგროვება: ანგარიშის გახსნის საკომისიო GE40TB7692936615100045/USD 2022 (68505482)',
        status: '3',
        subcategories: null,
        amount: 3.09,
        currency: 'USD',
        transactionType: 'CURR_EXCHANGE',
        transactionSubType: '5',
        clientAccountNumber: 'GE40TB7692936615100045',
        partnerAccountName: 'ილია დმიტრიევ',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: 6714034469
      },
      {
        date: new Date('2022-03-22T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [{ account: { id: '10971235' }, fee: 0, id: null, invoice: null, sum: 3.09 }],
        comment: 'თანხის ავტომატური შეგროვება: ანგარიშის გახსნის საკომისიო GE40TB7692936615100045/USD 2022 (68505482)',
        groupKeys: [
          '6714034469',
          '1647979200000_USD_3.09'
        ]
      }
    ]
  ])('convert inner In transactions debitCardGEL-debitCardUSD', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, debitCardUSD)).toEqual(transaction)
  })

  it.each([
    [
      {
        movementDate: 1665086400000,
        depositAmount: 20000,
        interestedAmount: 0,
        withdrawnDepositAmount: 0,
        balance: 20000
      },
      {
        comment: null,
        date: new Date('2022-10-06T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: { id: '11225773' },
            fee: 0,
            id: null,
            invoice: null,
            sum: 20000
          }
        ],
        groupKeys: [
          '11225773',
          '1665086400000_GEL_20000'
        ]
      }
    ]
  ])('convert inner In transactions debitCardGEL-depositGEL', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, depositGEL)).toEqual(transaction)
  })
})
