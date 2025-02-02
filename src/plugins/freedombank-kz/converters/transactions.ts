import { flatten } from 'lodash'
import { Movement, AccountType, AccountOrCard } from '../../../types/zenmoney'
import { ConvertedTransaction, StatementTransaction } from '../models'

export const transactionType = {
  INCOME: 'income',
  OUTCOME: 'outcome',
  TRANSFER: 'transfer',
  CASH: 'cash'
}

const transactionTypeStrings = {
  TRANSFER: ['Перевод', 'Между своими счетами', 'С карты другого банка', 'Со счета другого банка', 'From an account in another bank', 'Басқа банктің шотынан'],
  INCOME: ['Пополнение', 'Вознаграждение', 'Replenishment', 'Толықтыру'],
  OUTCOME: ['Покупка', 'Purchases', 'Зат сатып алу'],
  CASH: ['Снятие', 'Withdrawals', 'Ақша алу']
}

function parseTransactionType (text: string): string | null {
  if (transactionTypeStrings.OUTCOME.some(str => text.includes(str)) || /плата/i.test(text)) {
    return transactionType.OUTCOME
  }
  if (transactionTypeStrings.TRANSFER.some(str => text.includes(str)) || /(\w|[^\d\s])+\s[^\d\s]\./.test(text)) {
    return transactionType.TRANSFER
  }
  if (transactionTypeStrings.CASH.some(str => text.includes(str)) || /анкомат|atm/i.test(text)) {
    return transactionType.CASH
  }
  if (transactionTypeStrings.INCOME.some(str => text.includes(str))) {
    return transactionType.INCOME
  }
  return null
}

function cleanMerchantTitle (text: string | null): string | null {
  if (text == null || text.trim() === '') return null

  const keywordsToRemove = [...flatten(Object.values(transactionTypeStrings)), '₸']
  let cleanedText = text

  for (const keyword of keywordsToRemove) {
    cleanedText = cleanedText.replace(new RegExp(keyword, 'gi'), '')
  }

  cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim() // Убираем лишние пробелы

  // Remove trailing periods and text after the first period
  cleanedText = cleanedText.replace(/\.\s*.*$/, '')

  return cleanedText.length > 0 ? cleanedText : null
}

export function convertPdfStatementTransaction (rawTransaction: StatementTransaction, rawAccount: AccountOrCard): ConvertedTransaction {
  const sum = parseFloat(rawTransaction.amount.replace(',', '.').replace(/[\s+$]/g, ''))
  let instrument = 'KZT'
  if (rawTransaction.originalAmount !== null) {
    instrument = rawTransaction.originalAmount?.match(/[A-Z]{3}/)?.[0] ?? 'KZT'
  } else if (rawAccount.instrument !== null) {
    instrument = rawAccount.instrument
  }

  let invoice = rawTransaction.originalAmount !== null
    ? {
        sum: parseFloat(rawTransaction.originalAmount.replace(',', '.').replace(/[^\d.-]/g, '')),
        instrument
      }
    : null

  if (invoice && invoice.sum === sum && instrument === rawAccount.instrument) {
    invoice = null
  }

  const baseMovement: Movement = {
    id: null,
    account: { id: rawAccount.id },
    invoice,
    sum,
    fee: 0
  }

  const parsedType = parseTransactionType(rawTransaction.originString)
  let movements: [Movement] | [Movement, Movement]

  if (parsedType !== null && [transactionType.CASH, transactionType.TRANSFER].includes(parsedType)) {
    let type
    if (parsedType === transactionType.CASH) {
      type = AccountType.cash
    } else if (parsedType === transactionType.TRANSFER && rawTransaction.description !== null && rawTransaction.description?.includes('KOPILKA')) {
      type = AccountType.deposit
    } else {
      type = AccountType.ccard
    }
    const secondMovement: Movement = {
      id: null,
      account: {
        type,
        instrument,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -sum,
      fee: 0
    }
    movements = [baseMovement, secondMovement]
  } else {
    movements = [baseMovement]
  }

  const merchantFullTitle = cleanMerchantTitle(rawTransaction.description)
  let comment = null

  if (merchantFullTitle !== null) {
    const commentStrs = ['по номеру счета', 'by account number']
    for (const commentStr of commentStrs) {
      if (merchantFullTitle.includes(commentStr)) {
        comment = commentStr
        break
      }
    }
  }

  return {
    statementUid: rawTransaction.statementUid,
    transaction: {
      comment,
      movements,
      hold: rawTransaction.hold,
      date: new Date(rawTransaction.date),
      merchant: merchantFullTitle !== null
        ? {
            fullTitle: merchantFullTitle,
            mcc: null,
            location: null
          }
        : null
    }
  }
}
