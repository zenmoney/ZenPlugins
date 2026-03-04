import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          id: 2457439,
          account20: '1025604853',
          currency: 'KZT',
          module: '63',
          note: '',
          iin: '751101400945',
          access_level: 2,
          visible: true,
          balance: '6840.14',
          structType: 'broker'
        }
      ],
      [
        {
          product: {
            productId: '2457439',
            productType: 'investment'
          },
          accounts: [
            {
              balance: 6840.14,
              id: '2457439',
              instrument: 'KZT',
              syncIds: [
                '1025604853'
              ],
              title: 'Брокерский счёт',
              type: 'investment'
            }
          ]
        }
      ]
    ],
    [
      [
        {
          id: 2457439,
          account20: '1025604853',
          currency: 'KZT',
          module: '63',
          note: '',
          iin: '751101400945',
          access_level: 2,
          visible: true,
          balance: 'Нет данных',
          structType: 'broker'
        }
      ],
      [
        {
          product: {
            productId: '2457439',
            productType: 'investment'
          },
          accounts: [
            {
              id: '2457439',
              type: 'investment',
              title: 'Брокерский счёт',
              instrument: 'KZT',
              syncIds: ['1025604853'],
              balance: null
            }
          ]
        }
      ]
    ]
  ])('converts broker account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
