import { debitCardGEL, debitCardUSD } from '../../../common-tests/accounts'
import { convertTransaction } from '../../../legacy/converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 3457178216,
        externalTransactionId: '6766672115',
        date: 1648670400000,
        description: ',31/03/2022,ანგარიშზე თანხის შეტანა,GEL',
        status: '3',
        subcategories: [
          {
            id: 31,
            clientSubcategory: false,
            text: 'Other incomes',
            color: '#00A579',
            smallIcon: 593191,
            largeIcon: null,
            categoryCode: 'INCOME',
            subcategoryCode: 'OTHER_INCOMES'
          }
        ],
        amount: 100,
        currency: 'GEL',
        transactionType: 'TRANSFER_GEL',
        transactionSubType: '20',
        clientAccountNumber: 'GE59TB7692945061200006',
        partnerAccountName: 'ტერმინალებში მიღებული თიბისი ბანკის გადახდების სატრანზიტო (პროვაიდერი)',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: null,
        date: new Date('2022-03-30T20:00:00.000Z'),
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
            sum: 100
          },
          {
            account: {
              company: null,
              instrument: 'GEL',
              syncIds: null,
              type: 'cash'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -100
          }
        ],
        groupKeys: [
          '6766672115',
          '1648670400000_GEL_100'
        ]
      }
    ],
    [
      {
        id: 3433392839,
        externalTransactionId: '6708768995',
        date: 1647892800000,
        description: 'ანგარიშზე თანხის შეტანა',
        status: '3',
        subcategories: [
          {
            id: 31,
            clientSubcategory: false,
            text: 'Other incomes',
            color: '#00A579',
            smallIcon: 593191,
            largeIcon: null,
            categoryCode: 'INCOME',
            subcategoryCode: 'OTHER_INCOMES'
          }
        ],
        amount: 50,
        currency: 'GEL',
        transactionType: 'CASH_IN',
        transactionSubType: '20',
        clientAccountNumber: 'GE59TB7692945061200006',
        partnerAccountName: 'ილია დმიტრიევ   16-12-1989',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: null,
        date: new Date('2022-03-21T20:00:00.000Z'),
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
            sum: 50
          },
          {
            account: {
              company: null,
              instrument: 'GEL',
              syncIds: null,
              type: 'cash'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -50
          }
        ],
        groupKeys: [
          '6708768995',
          '1647892800000_GEL_50'
        ]
      }
    ]
  ])('convert cash transfer transactions', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, debitCardGEL)).toEqual(transaction)
  })
})

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 3572932951,
        externalTransactionId: '7050057450',
        date: 1652644800000,
        description: 'ATM CASH - ATM TBC-577 (Vaja-Pshav 71), ტრანზაქციის თანხა 500.00 USD, May 14 2022 5:15PM, , ბარათი MC, 515881******0671',
        status: '3',
        subcategories:
          [
            {
              id: 25643,
              clientSubcategory: false,
              text: 'Cash out',
              color: '#099691',
              smallIcon: 593112,
              largeIcon: null,
              categoryCode: 'CASHOUT',
              subcategoryCode: 'CASHOUT'
            }
          ],
        amount: -500,
        currency: 'USD',
        transactionType: 'TRANSFER_FOREIGN',
        transactionSubType: '30',
        clientAccountNumber: 'GE59TB7692945061654321',
        partnerAccountName: 'თიბისი ბანკის MC ბარათებით ბანკომატებში შესრულებული ტრანზაქციები',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: null,
        date: new Date('2022-05-15T20:00:00.000Z'),
        hold: false,
        merchant: null,
        movements: [
          {
            account: {
              id: '10971235'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -500
          },
          {
            account: {
              company: null,
              instrument: 'USD',
              syncIds: null,
              type: 'cash'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: 500
          }
        ],
        groupKeys: [
          '7050057450',
          '1652644800000_USD_500'
        ]
      }
    ]
  ])('convert USD cash transfer transactions', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, debitCardUSD)).toEqual(transaction)
  })
})
