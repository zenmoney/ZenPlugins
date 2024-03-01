import { convertTransaction } from '../../../legacy/converters'
import { debitCardGEL } from '../../../common-tests/accounts'

describe('convertTransaction', () => {
  it.each([
    [
      {
        id: 3465803051,
        externalTransactionId: '6788174424',
        date: 1649016000000,
        description: 'POS - BOLT OPERATIONS OU,  თანხა 4.80 GEL, Apr  1 2022  6:31PM,  ტრანსპორტი, MCC: 4121, ბარათი MC, 528058******5916',
        status: '3',
        subcategories: [
          {
            id: 36,
            clientSubcategory: false,
            text: 'Public transport and taxi',
            color: '#6339ED',
            smallIcon: 593149,
            largeIcon: null,
            categoryCode: 'TRANSPORT',
            subcategoryCode: 'PUBLIC_TRANSPORT_TAXI'
          }
        ],
        amount: -4.8,
        currency: 'GEL',
        transactionType: 'TRANSFER_GEL',
        transactionSubType: '30',
        clientAccountNumber: 'GE59TB7692945061200006',
        partnerAccountName: 'თიბისი ბანკის MC ბარათებით სავაჭრო ობიექტებში სხვა ბანკის ტერმინალებში',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: null,
        date: new Date('2022-04-01T14:31:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: 4121,
          title: 'BOLT OPERATIONS OU'
        },
        movements: [
          {
            account: {
              id: '10971234'
            },
            fee: 0,
            id: null,
            invoice: null,
            sum: -4.8
          }
        ],
        groupKeys: [
          '6788174424',
          '1649016000000_GEL_4.8'
        ]
      }
    ],
    [
      {
        id: 3429409015,
        externalTransactionId: '6699183805',
        date: 1647720000000,
        description: 'POS - EL AL, ბარათი VISA, თანხა 4612.00 GEL, Mar 18 2022 12:21AM, კონვერტაცია, მოგზაურობა, დასვენება, MCC: 4511',
        status: '3',
        subcategories:
          [
            {
              id: 43,
              clientSubcategory: false,
              text: 'Transportation',
              color: '#16A4E3',
              smallIcon: 593155,
              largeIcon: null,
              categoryCode: 'TRAVEL_LEISURE',
              subcategoryCode: 'TRANSPORTATION'
            }
          ],
        amount: -4612,
        currency: 'GEL',
        transactionType: 'CURR_EXCHANGE',
        transactionSubType: '30',
        clientAccountNumber: 'GE72TB7846645063400001',
        partnerAccountName: 'თიბისი ბანკის VISA ბარათებით სავაჭრო ობიექტებში სხვა ბანკის ტერმინალებში შესრულებული ტრანზაქციები',
        clientAccountExternalId: null,
        displayAsHidden: false,
        parentExternalTransactionId: null
      },
      {
        comment: null,
        date: new Date('2022-03-17T20:21:00.000Z'),
        hold: false,
        merchant: {
          city: null,
          country: null,
          location: null,
          mcc: 4511,
          title: 'EL AL'
        },
        movements: [
          {
            account: { id: '10971234' },
            fee: 0,
            id: null,
            invoice: null,
            sum: -4612
          }
        ],
        groupKeys: [
          '6699183805',
          '1647720000000_GEL_4612'
        ]
      }
    ]
  ])('convert pos transactions', (apiTransaction: unknown, transaction: unknown) => {
    expect(convertTransaction(apiTransaction, debitCardGEL)).toEqual(transaction)
  })
})
