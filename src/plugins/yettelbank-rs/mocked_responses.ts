import { AccountInfo, TransactionInfo } from './models'

export const mockedAccountsResponse: AccountInfo[] = [
  {
    id: '115038161634943632',
    title: 'Main account',
    currency: 'RSD',
    syncIds: ['115038161634943632'],
    balance: 1000
  }
]

export const mockedTransactionsResponse: TransactionInfo[] = [
  {
    isPending: false,
    date: new Date('2023-01-01'),
    title: 'Payment',
    amount: 100,
    currency: 'RSD'
  },
  {
    isPending: false,
    date: new Date(),
    title: 'Boba With Long Name',
    amount: 1000.234,
    currency: 'EUR'
  }
]
