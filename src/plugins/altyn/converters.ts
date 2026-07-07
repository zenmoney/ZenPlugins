import { AccountOrCard, AccountType, Transaction } from '../../types/zenmoney'
import { AltynAccount, AltynTransaction, ConvertResult } from './models'

// Конвертация счетов Алтын в домен zenmoney.
// Каждый счёт → AccountType.checking, валюта и баланс берутся из API напрямую.
export function convertAccounts (apiAccounts: AltynAccount[]): ConvertResult[] {
  return apiAccounts.map((apiAccount) => {
    const account: AccountOrCard = {
      id: apiAccount.account_number,
      type: AccountType.checking,
      title: 'Алтын ' + apiAccount.account_number,
      instrument: apiAccount.currency,
      balance: Number(apiAccount.balance),
      syncIds: [apiAccount.account_number]
    }
    return { account, accountNumber: apiAccount.account_number }
  })
}

// Конвертация операции Алтын в домен zenmoney.
// Импортируем только успешные операции (status === 2); прочие пропускаем.
// Знак суммы определяется типом: deposit → приход (+), withdraw → расход (−).
export function convertTransaction (apiTx: AltynTransaction, account: AccountOrCard): Transaction | null {
  if (apiTx.status !== 2) {
    return null
  }
  const isIncome = apiTx.type === 'deposit'
  const sum = (isIncome ? 1 : -1) * Number(apiTx.amount)
  const merchantTitle = apiTx.label ?? apiTx.details
  return {
    hold: null,
    date: new Date(apiTx.created_at),
    movements: [{
      id: apiTx.token,
      account: { id: account.id },
      // Операция приходит в валюте счёта — invoice не нужен
      invoice: null,
      sum,
      fee: 0
    }],
    merchant: merchantTitle !== null ? { fullTitle: merchantTitle, mcc: null, location: null } : null,
    comment: null
  }
}
