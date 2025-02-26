import { convertAccount } from '../../../converters'
import { mockedAccountsResponse } from '../../../mocked_responses'
import { Account, AccountType } from '../../../../../types/zenmoney'

describe('account converter', () => {
  it('should convert account', () => {
    const account = convertAccount(mockedAccountsResponse[0])

    const expectedAccount: Account = {
      id: mockedAccountsResponse[0].id,
      type: AccountType.ccard,
      title: mockedAccountsResponse[0].title,
      syncIds: mockedAccountsResponse[0].syncIds,
      instrument: mockedAccountsResponse[0].instrument,
      balance: mockedAccountsResponse[0].balance
    }

    expect(account).toEqual(expectedAccount)
  })
})
