import { AccountType } from '../../../../../types/zenmoney'
import { convertAccounts } from '../../../ether/converters'

describe('convertAccounts', () => {
  it.each([
    [
      [
        {
          account: '0xe61289f5dc092d685e6e918b6624e273b42b6730',
          balance: '2000000000000000000'
        },
        {
          account: '0xe61289f5dc092d685e6e918b6624e273b42b6740',
          balance: '0'
        }
      ],
      [
        {
          id: '0xe61289f5dc092d685e6e918b6624e273b42b6730',
          type: AccountType.checking,
          title: '0xe61289f5dc092d685e6e918b6624e273b42b6730',
          instrument: 'μETH',
          balance: 2000000,
          syncIds: ['0xe61289f5dc092d685e6e918b6624e273b42b6730']
        },
        {
          id: '0xe61289f5dc092d685e6e918b6624e273b42b6740',
          type: AccountType.checking,
          title: '0xe61289f5dc092d685e6e918b6624e273b42b6740',
          instrument: 'μETH',
          balance: 0,
          syncIds: ['0xe61289f5dc092d685e6e918b6624e273b42b6740']
        }
      ]
    ]
  ])('converts current account', (apiAccounts, accounts) => {
    expect(convertAccounts(apiAccounts)).toEqual(accounts)
  })
})
