import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        postingDate: '2020-11-03T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-11-03T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '11:31:32',
        transCurrIso: 'BYN',
        amount: 200,
        feeAmount: 0,
        accountAmount: 200,
        transDetails: 'Credit BLR GRODNO CASH-IN 604 ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-11-03T11:31:32+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: 200,
            fee: 0
          },
          {
            id: null,
            account: {
              type: 'cash',
              instrument: 'BYN',
              company: null,
              syncIds: null
            },
            invoice: null,
            sum: -200,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'BLR GRODNO CASH-IN 604'
      }
    ]
  ])('converts cash replenishment', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(transaction)
  })
})
