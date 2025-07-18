import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  const now = new Date('2020-02-02T00:00:00+03:00')

  it.each([
    [
      [
        {
          id: '341430116S1000270',
          type: 'deposit',
          info:
            {
              title: 'Альфа-Фикс',
              number: 'BY08 ALFA 3414 3011 6S10 0027 0000',
              amount: { amount: 30962.93, currIso: 'USD' }
            }
        }
      ],
      [
        {
          mainProduct: {
            id: '341430116S1000270',
            type: 'deposit'
          },
          products: [],
          account: {
            id: '341430116S1000270',
            type: 'deposit',
            title: 'Альфа-Фикс',
            instrument: 'USD',
            syncID: [
              'BY08ALFA341430116S1000270000'
            ],
            balance: 30962.93,
            startBalance: 0,
            startDate: now,
            capitalization: true,
            percent: 0,
            endDateOffsetInterval: 'month',
            endDateOffset: 1,
            payoffInterval: 'month',
            payoffStep: 1
          }
        }
      ]
    ]
  ])('converts deposit', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts, now)).toEqual(accounts)
  })
})
