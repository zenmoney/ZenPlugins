import { isPOSDateCorrect } from '../tbc-ge/converters'
import { AccountInfo, Preferences, Product, Session, TransactionInfo } from './models'

export const mockedAccountsResponse = [{
    id: '42',
    name: 'Main account',
    currency: 'RSD',
    balance: 777
} as AccountInfo]

export const mockedTransactionsResponse = [{
    isPending: false,
    date: new Date(),
    title: 'Biba',
    amount: 10,
    currency: 'RSD'
} as TransactionInfo,
{
    isPending: false,
    date: new Date(),
    title: 'Boba',
    amount: 1000,
    currency: 'RSD'
}]
