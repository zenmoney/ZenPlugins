import { convertCardAccount } from '../../converters'
import { FetchCardAccount } from '../../types/fetch'
import { Account } from '../../../../types/zenmoney'
import { TEST_ACCOUNTS } from '../../__mocks__/accounts.data'

describe('convertCardAccount', () => {
  it.each([
    [
      TEST_ACCOUNTS.CARD[0],
      {
        id: '8479823740280',
        title: 'EUR',
        balance: 7.12,
        instrument: 'EUR',
        syncIds: [
          'BY00POIS00000000000000001111',
          '8479823740280',
          '1111'
        ],
        type: 'ccard'
      } as Account
    ]
  ])('converts  account', (apiAccount: FetchCardAccount, account: Account) => {
    expect(convertCardAccount(apiAccount)).toEqual(account)
  })
})
