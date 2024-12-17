import { Account, AccountType, Amount, Transaction } from '../../types/zenmoney'
import { getNumber, getOptNumber, getOptString, getString } from '../../types/get'
import { AccountBalanceResponse, ConvertResult, OtpAccount, OtpTransaction } from './models'

export function convertAccounts (apiAccounts: unknown[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount, accountsByCba)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccount (apiAccount: unknown, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = getString(apiAccount, 'cba')
  const balance = getNumber(apiAccount, 'accountBalance.value')
  let newAccount = false
  let account = accountsByCba[cba]
  if (!account) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: getOptString(apiAccount, 'product') ?? cba,
        instrument: getString(apiAccount, 'currency.shortName'),
        balance,
        creditLimit: 0,
        syncIds: [
          cba
        ]
      }
    }
    accountsByCba[cba] = account
    newAccount = true
  }
  account.products.push({
    id: getString(apiAccount, 'id'),
    transactionNode: getString(apiAccount, 'transactionNode')
  })

  const pan = getOptString(apiAccount, 'pan')
  if (pan != null) {
    account.account.syncIds.push(pan)
  }

  const moneyAmount = getOptNumber(apiAccount, 'moneyAmount.value')
  if (moneyAmount != null) {
    account.account.creditLimit = moneyAmount - balance
  }
  return newAccount ? account : null
}

export function convertTransaction (apiTransaction: unknown, account: Account): Transaction {
  const description = getOptString(apiTransaction, 'description')
  const accountAmount = parseAmount(apiTransaction, 'accountAmount')
  const invoice = parseAmount(apiTransaction, 'amount')

  return {
    hold: getString(apiTransaction, 'type') !== 'TRANSACTION',
    date: new Date(getString(apiTransaction, 'operationTime')),
    movements: [
      {
        id: getOptString(apiTransaction, 'id') ?? null,
        account: { id: account.id },
        invoice: accountAmount.instrument === invoice.instrument ? null : invoice,
        sum: accountAmount.sum,
        fee: 0
      }
    ],
    merchant: description != null
      ? {
          fullTitle: description,
          mcc: null,
          location: null
        }
      : null,
    comment: null
  }
}

function parseAmount (data: unknown, path: string): Amount {
  return {
    sum: getNumber(data, `${path}.value`),
    instrument: getString(data, `${path}.currency.shortName`)
  }
}

export function parseAccounts (apiAccounts: string[][]): OtpAccount[] {
  const accounts: OtpAccount[] = []
  for (const apiAccount of apiAccounts) {
    const res = parseAccount(apiAccount)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function parseAccount (apiAccount: string[]): OtpAccount {
  const account: OtpAccount = {
    IBANNumber: apiAccount[1],
    AccountID: parseInt(apiAccount[1]),
    AccountNumber: apiAccount[1],
    CurrencyCode: apiAccount[3],
    Balance: parseInt(apiAccount[4]),
    AvailableBalance: parseInt(apiAccount[5]),
    BlockedAmount: parseInt(apiAccount[19]),
    Description: apiAccount[2],
    CurrencyCodeNumeric: apiAccount[14],
    id: apiAccount[1],
    type: AccountType.checking,
    title: apiAccount[2]
  }
  return account
}

export function parseTransactions (apiTransactions: string[][]): OtpTransaction[] {
  const transactions: OtpTransaction[] = []
  for (const apiTransaction of apiTransactions[1]) {
    const res = parseTransaction(apiTransaction)
    if (res != null) {
      transactions.push(res)
    }
  }
  return transactions
}

function parseTransaction (apiTransaction: string[]): OtpTransaction {
  const otpTransaction: OtpTransaction = {
    date: Date.parse(apiTransaction[3]),
    title: apiTransaction[4],
    amount: parseInt(apiTransaction[9]),
    currency: apiTransaction[2]
  }
  return otpTransaction
}

// CHATGPT

export function convertAccount (account: any[]): ZenmoneyAccount {
  return {
    id: account[1], // Уникальный идентификатор
    title: account[2], // Название аккаунта
    balance: parseFloat(account[4]), // Баланс
    currency: account[3], // Валюта
    type: 'checking', // По умолчанию "checking"
    syncID: [account[1]] // Дополнительный идентификатор для синхронизации
  }
}

/**
 * Метод для перебора массива ответа и конвертации всех аккаунтов
 * @param apiResponse - Ответ от эндпоинта получения аккаунтов
 * @returns Массив аккаунтов в формате Zenmoney
 */
export function convertAllAccounts (apiResponse: any[][]): ZenmoneyAccount[] {
  return apiResponse.map(convertAccount)
}

export function convertTransaction (transaction: any[]): ZenmoneyTransaction {
  return {
    id: transaction[8], // Уникальный идентификатор
    date: transaction[3], // Дата транзакции
    description: transaction[4], // Описание транзакции
    amount: parseFloat(transaction[9]) * -1, // Сумма транзакции (в отрицательном виде для расходов)
    currency: transaction[2], // Валюта транзакции
    accountId: transaction[17], // ID аккаунта
    payee: transaction[25] || '', // Получатель (если есть)
    category: transaction[27] || 'Не указано' // Категория (если есть)
  }
}

/**
 * Конвертация массива транзакций
 * @param transactionsResponse - Массив массивов данных о транзакциях
 * @returns Массив ZenmoneyTransaction
 */
export function convertAllTransactions (transactionsResponse: any[][][]): ZenmoneyTransaction[] {
  const transactions: ZenmoneyTransaction[] = []

  transactionsResponse.forEach((group) => {
    group.forEach((transaction) => {
      transactions.push(convertTransaction(transaction))
    })
  })

  return transactions
}
