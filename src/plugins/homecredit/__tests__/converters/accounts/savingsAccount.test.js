import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it.each([
    [
      {
        contractUniqueID: 'MjEwLzAyOTM1NjtUVzsxNDYxOzU2NTg3NjI1',
        contractNumber: '210/021234',
        accountNumber: '42303810850640005678',
        depositName: 'Накопительный счет',
        depositType: 'Срочный',
        systemCode: 'TW',
        contractStatus: 'ACTIVE',
        startDate: '2019-03-19T00:00:00+03:00',
        maturityDate: '2020-01-19T00:00:00+03:00',
        runningBalance: 14845.74,
        currency: 'RUR',
        isPossibilityOfPartialWithdrawal: true,
        isPossibilityOfReplenishment: true,
        displayOrder: 0
      },
      {
        account: {
          id: '210/021234',
          syncID: ['1234', '5678'],
          title: 'Накопительный счет Срочный (42303810850640005678)',
          type: 'checking',
          instrument: 'RUR',
          balance: 14845.74
        },
        details: {
          accountNumber: '42303810850640005678',
          cardNumber: undefined,
          contractNumber: '210/021234',
          title: 'Накопительный счет',
          type: 'deposits'
        }
      }
    ]
  ])('converts savingsAccount', (apiAccounts, accounts) => {
    expect(convertAccount(apiAccounts, 'deposits')).toEqual(accounts)
  })
})
