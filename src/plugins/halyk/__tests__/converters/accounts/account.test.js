/* eslint-disable no-irregular-whitespace */
import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          accountNumber: 'KZ396010012008472873',
          available: '27 479,64',
          balance: '27 479,64',
          cardNumber: '440563******6723',
          currency: 'KZT',
          statementDate: '03.10.2024'
        }
      ],
      [
        {
          account: {
            id: 'KZ396010012008472873',
            type: 'ccard',
            title: 'KZ396010012008472873',
            instrument: 'KZT',
            syncIds: [
              'KZ396010012008472873',
              '440563******6723'
            ],
            balance: 27479.64,
            creditLimit: 0
          },
          statementDate: new Date('2024-10-03'),
          apiTransactions: []
        }
      ]
    ]
  ])('converts account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
