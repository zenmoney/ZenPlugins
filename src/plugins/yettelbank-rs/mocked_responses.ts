import { AccountInfo, TransactionInfo } from './models'

export const mockedAccountsResponse: AccountInfo[] = [{
  id: '4815162342',
  name: 'Main account',
  currency: 'RSD',
  balance: 777.42
}]

export const mockedTransactionsResponse: TransactionInfo[] = [{
  isPending: false,
  date: new Date(),
  title: 'Biba',
  amount: 10.76,
  currency: 'RSD'
},
{
  isPending: false,
  date: new Date(),
  title: 'Boba With Long Name',
  amount: 1000.234,
  currency: 'EUR'
}]
