import { parseAccounts } from '../../../converters'

describe('parseAccounts', () => {
  it.each([
    [
      require('./accounts.html'),
      [
        {
          balance: 570496.14,
          currency: 'KZT',
          id: '397567',
          title: 'KZ20722S000009967687'
        }
      ]
    ]
  ])('converts html accounts', (html, accounts) => {
    expect(parseAccounts(html)).toEqual(accounts)
  })
})
