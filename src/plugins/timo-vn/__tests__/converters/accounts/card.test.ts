import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          no: '9021808997832',
          accountType: '1025',
          name: 'Spend Account',
          balance: 2432632,
          limitAmount: 0,
          accountBalance: 2432632,
          workingBalance: 2432632,
          availableAmount: 2432632,
          quantity: 0,
          order: 1,
          products: [],
          aliasType: 'Account',
          isOverDraftUser: false
        }
      ],
      [
        {
          products: [
            {
              id: '9021808997832',
              accountType: '1025'
            }
          ],
          account: {
            id: '9021808997832',
            title: 'Spend Account',
            type: 'ccard',
            instrument: 'VND',
            syncIds: [
              '9021808997832'
            ],
            balance: 2432632,
            creditLimit: 0
          }
        }
      ]
    ]
  ])('converts card', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
