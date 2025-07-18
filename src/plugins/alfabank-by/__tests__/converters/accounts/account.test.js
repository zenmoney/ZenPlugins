import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: '30146065960010270',
          type: 'account',
          info:
            {
              title: 'Текущий счет',
              number: 'BY89 ALFA 3014 6065 9600 1027 0000',
              amount: { amount: 0, currIso: 'BYN' }
            }
        }
      ],
      [
        {
          mainProduct: {
            id: '30146065960010270',
            type: 'account'
          },
          products: [],
          account: {
            id: '30146065960010270',
            type: 'checking',
            title: 'Текущий счет',
            instrument: 'BYN',
            syncID: [
              'BY89ALFA30146065960010270000'
            ],
            balance: 0
          }
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
