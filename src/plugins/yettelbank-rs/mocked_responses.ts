import { AccountInfo, TransactionInfo } from './models'

export const mockedAccountsResponse: AccountInfo[] = [
  {
    id: '115038161634943632',
    title: 'Main account',
    instrument: 'RSD',
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
  }
]
