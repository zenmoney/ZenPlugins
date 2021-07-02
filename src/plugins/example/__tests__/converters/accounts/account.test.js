import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: '4480910C',
          transactionNode: 'p',
          currency: {
            shortName: 'USD',
            symbol: '$',
            rate: 54.60
          },
          product: 'Mastercard World Premium',
          cba: '40817840401000898597',
          moneyAmount: {
            value: 2432.19
          },
          accountBalance: {
            value: 2432.19
          }
        }
      ],
      [
        {
          products: [
            {
              id: '4480910C',
              transactionNode: 'p'
            }
          ],
          account: {
            id: '40817840401000898597',
            title: 'Mastercard World Premium',
            type: 'card',
            instrument: 'USD',
            syncIds: [
              '40817840401000898597'
            ],
            balance: 2432.19,
            creditLimit: 0
          }
        }
      ]
    ]
  ])('converts current account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
