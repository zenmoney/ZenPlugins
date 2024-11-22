import { AccountInfo, TransactionInfo } from './models'

export const mockedAccountsResponse: AccountInfo[] = [{
  id: '4815162342',
  name: 'Main account',
  currency: 'RSD',
  balance: 777
}]

export const mockedTransactionsResponse: TransactionInfo[] = [{
  isPending: false,
  date: new Date(),
  title: 'Biba',
  amount: 10,
  currency: 'RSD'
},
{
  isPending: false,
  date: new Date(),
  title: 'Boba',
  amount: 1000,
  currency: 'RSD'
}]
