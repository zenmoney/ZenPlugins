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
      date: '2022-10-31T00:00:00.000',
      type: 'gold',
      startDate: null,
      startBalance: null,
      capitalization: null,
      endDate: null
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
      date: new Date('2022-10-31T00:00:00.000')
    }
  ],
  [
    {
      balance: 1112.06,
      id: 'KZ31722',
      instrument: 'USD',
      title: 'Депозит *7111',
      date: '2023-06-25T00:00:00.000',
      type: 'deposit',
      startDate: '2022-03-05T00:00:00.000',
      startBalance: 0,
      capitalization: '1%',
      endDate: '2022-06-08T00:00:00.000'
    },
    {
      account: {
        balance: 1112.06,
        id: 'KZ31722',
        instrument: 'USD',
        title: 'Депозит *7111',
        syncIds: ['KZ31722'],
        type: AccountType.deposit,
        startDate: new Date('2022-03-05T00:00:00.000'),
        startBalance: 0,
        capitalization: true,
        percent: 1,
        endDateOffsetInterval: 'month',
        endDateOffset: 3,
        payoffInterval: null,
        payoffStep: 0
      },
      date: new Date('2023-06-25T00:00:00.000')
    }
  ]
])('converts account parsed from pdf statement', (rawAccount: StatementAccount, account: unknown) => {
  expect(convertPdfStatementAccount(rawAccount)).toEqual(account)
})
