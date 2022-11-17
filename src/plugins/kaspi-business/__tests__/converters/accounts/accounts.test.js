import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        balance: 570496.14,
        currency: 'KZT',
        id: '397567',
        title: 'KZ20722S000009967687'
      },
      {
        balance: 570496.14,
        id: '397567',
        instrument: 'KZT',
        syncIds: ['397567'],
        title: 'KZ20722S000009967687',
        type: 'ccard'
      }
    ]
  ])('converts account', (apiAccount, account) => {
    expect(convertAccount(apiAccount)).toEqual(account)
  })
})
