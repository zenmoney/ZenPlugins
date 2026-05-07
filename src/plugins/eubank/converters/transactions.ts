import { Movement, AccountType } from '../../../types/zenmoney'
import { ConvertedTransaction, ConvertedAccount, StatementTransaction } from '../models'

function getAccountIdByInstrument (accounts: ConvertedAccount[], instrument: string): string {
  const account = accounts.find(a => a.account.instrument === instrument)
  assert(account != null, `Can't find account for instrument ${instrument}`)
  return account.account.id
}

function isFinanceTransfer (category: string): boolean {
  return category === 'Финансы'
}

function isCashTopup (category: string, details: string): boolean {
  return category === 'Пополнение' && /В терминале/i.test(details)
}

function isBonusTopup (category: string, details: string): boolean {
  return category === 'Пополнение' && /Пополнение с\s*Бонусов/i.test(details)
}

function isIncomingTransfer (details: string): boolean {
  return /^(Депозит|Текущий счет)$/i.test(details.trim())
}

export function convertPdfStatementTransaction (
  rawTransaction: StatementTransaction,
  accounts: ConvertedAccount[]
): ConvertedTransaction | null {
  if (rawTransaction.amount === 0) {
    return null
  }

  const accountId = getAccountIdByInstrument(accounts, rawTransaction.instrument)

  const isIncome = isFinanceTransfer(rawTransaction.category) && isIncomingTransfer(rawTransaction.details)
  const isCash = isCashTopup(rawTransaction.category, rawTransaction.details)
  const isBonus = isBonusTopup(rawTransaction.category, rawTransaction.details)
  const isFinance = isFinanceTransfer(rawTransaction.category)

  let sum: number
  if (isIncome || isCash || isBonus) {
    sum = Math.abs(rawTransaction.amount)
  } else {
    sum = -Math.abs(rawTransaction.amount)
  }

  const movements: [Movement] | [Movement, Movement] = [
    {
      id: null,
      account: { id: accountId },
      invoice: null,
      sum,
      fee: 0
    }
  ]

  if (isCash) {
    movements.push({
      id: null,
      account: {
        type: AccountType.cash,
        instrument: rawTransaction.instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -sum,
      fee: 0
    })
  }

  let merchant = null
  let comment = null

  if (!isFinance && !isCash && !isBonus && rawTransaction.category !== 'Пополнение') {
    const merchantTitle = rawTransaction.details.trim()
    if (merchantTitle !== '') {
      merchant = {
        fullTitle: merchantTitle,
        mcc: null,
        location: null
      }
    }
  } else if (isFinance && !isIncome) {
    comment = `${rawTransaction.category}: ${rawTransaction.details}`
  } else if (isBonus) {
    comment = 'Пополнение с Бонусов'
  } else if (isIncome) {
    comment = rawTransaction.details
  }

  const dateStr = rawTransaction.date.replace('T00:00:00.000', `T${rawTransaction.time}.000`)

  return {
    statementUid: rawTransaction.statementUid,
    transaction: {
      hold: false,
      date: new Date(dateStr),
      movements,
      merchant,
      comment
    }
  }
}
