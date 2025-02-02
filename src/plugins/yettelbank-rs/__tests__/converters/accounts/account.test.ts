import { convertAccounts } from '../../../converters'
import { mockedAccountsResponse } from '../../../mocked_responses'

describe('convertAccounts', () => {
  it.each([
    [
      mockedAccountsResponse,
      [
        {
          products: [
            {
              id: mockedAccountsResponse[0].id,
              transactionNode: ''
            }
          ],
          account: {
            id: mockedAccountsResponse[0].id,
            title: mockedAccountsResponse[0].name,
            type: 'ccard',
            instrument: mockedAccountsResponse[0].currency,
            syncIds: [
              mockedAccountsResponse[0].id
            ],
            balance: mockedAccountsResponse[0].balance,
            creditLimit: 0
          }
        }
      ]
    ]
  ])('converts current account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
