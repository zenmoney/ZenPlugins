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
    isPending: true,
    date: new Date('2023-01-02'),
    title: 'Pending Payment',
    amount: -50,
    currency: 'RSD'
  },
  {
    isPending: false,
    date: new Date('2023-01-03'),
    title: 'Deposit',
    amount: 200,
    currency: 'RSD'
  }
]
