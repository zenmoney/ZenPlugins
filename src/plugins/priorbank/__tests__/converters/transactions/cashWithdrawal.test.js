import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        postingDate: '2020-09-07T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-09-07T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '08:35:13',
        transCurrIso: 'BYN',
        amount: -90,
        feeAmount: 0,
        accountAmount: -90,
        transDetails: 'ATM BLR MINSK ATMBVB HO27 KARBYSHEVA ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-09-07T08:35:13+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: null,
            sum: -90,
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
            sum: 90,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'BLR MINSK ATMBVB HO27 KARBYSHEVA'
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'BYN', id: 'account' } }, true)).toEqual(transaction)
  })

  it.each([
    [
      {
        postingDate: '2020-11-06T00:00:00+03:00',
        postingDateSpecified: true,
        transDate: '2020-11-06T00:00:00+03:00',
        transDateSpecified: true,
        transTime: '17:01:33',
        transCurrIso: 'BYN',
        amount: -200,
        feeAmount: 0,
        accountAmount: -77.97,
        transDetails: 'ATM BLR MINSK ATM 638 PVT ',
        hce: false
      },
      {
        hold: false,
        date: new Date('2020-11-06T17:01:33+03:00'),
        movements: [
          {
            id: null,
            account: { id: 'account' },
            invoice: { sum: -200, instrument: 'BYN' },
            sum: -77.97,
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
            sum: 200,
            fee: 0
          }
        ],
        merchant: null,
        comment: 'BLR MINSK ATM 638 PVT'
      }
    ]
  ])('converts cash withdrawal', (apiTransaction, transaction) => {
    expect(convertTransaction(apiTransaction, { account: { instrument: 'USD', id: 'account' } }, true)).toEqual(transaction)
  })
})
