import { convertPdfStatementAccount } from '../../converters/accounts'
import { StatementAccount } from '../../models'
import { AccountType } from '../../../../types/zenmoney'

it.each([
  [
    {
      balance: 80995.97,
      id: 'KZ11111',
      instrument: 'KZT',
      title: 'KASPI GOLD *0111',
      date: new Date('2022-10-31T21:00:00.000Z')
    },
    {
      account: {
        balance: 80995.97,
        id: 'KZ11111',
        instrument: 'KZT',
        title: 'KASPI GOLD *0111',
        syncIds: ['KZ11111'],
        type: AccountType.ccard
      },
      date: new Date('2022-10-31T21:00:00.000Z')
    }
  ]
])('converts account parsed from pdf statement', (rawAccount: StatementAccount, account: unknown) => {
  expect(convertPdfStatementAccount(rawAccount)).toEqual(account)
})
