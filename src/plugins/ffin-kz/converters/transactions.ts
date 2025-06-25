import { flatten } from 'lodash'
import { Movement, AccountType, AccountOrCard } from '../../../types/zenmoney'
import { ConvertedTransaction, StatementTransaction } from '../models'
import { ExchangeRate } from '../api'

export const transactionType = {
  INCOME: 'income',
  OUTCOME: 'outcome',
  TRANSFER: 'transfer',
  CASH: 'cash'
}

const transactionTypeStrings = {
  TRANSFER: ['Перевод', 'Между своими счетами', 'С карты другого банка', 'Выплата вклада по Договору', 'Со счета другого банка', 'Прием вклада по договору', 'Басқа банктің шотынан'],
  INCOME: ['Пополнение', 'Вознаграждение', 'Replenishment', 'Толықтыру'],
  OUTCOME: ['Покупка', 'Платеж'],
  CASH: ['Снятие', 'Withdrawals', 'Ақша алу']
}

function parseTransactionType (text: string): string | null {
  if (transactionTypeStrings.OUTCOME.some(str => text.includes(str))) {
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

  // Удаляем сообщения типа "Другое Плательщик:... Получатель:... Назначение: ..."
  if (/^Другое\s+Плательщик:.*Получатель:.*Назначение:/i.test(text)) {
    return null
  }
  if (/^с карты на карту/i.test(text)) {
    return null
  }
  if (/^Принят.*/i.test(text)) {
    return null
  }

  const keywordsToRemove = [...flatten(Object.values(transactionTypeStrings)), '₸']
  let cleanedText = text

  for (const keyword of keywordsToRemove) {
    cleanedText = cleanedText.replace(new RegExp(keyword, 'gi'), '')
  }

  cleanedText = cleanedText.replace(/\s{2,}/g, ' ').trim() // Убираем лишние пробелы

  return cleanedText.length > 0 ? cleanedText : null
}

function convertCurrency (currencyRates: Record<string, ExchangeRate>, amount: number, fromCurrency: string, toCurrency: string): number {
  const rates: Record<string, ExchangeRate> = currencyRates
  if (fromCurrency === toCurrency) {
    return amount
  }
  const key = `${fromCurrency}_${toCurrency}`
  const reverseKey = `${toCurrency}_${fromCurrency}`

  if (Object.prototype.hasOwnProperty.call(rates, key) && rates[key] !== undefined) {
    // Покупаем toCurrency за fromCurrency, используем sellRate
    return amount * rates[key].sellRate
  }
  if (Object.prototype.hasOwnProperty.call(rates, reverseKey) && rates[reverseKey] !== undefined) {
    // Продаём toCurrency за fromCurrency, используем buyRate
    return amount / rates[reverseKey].buyRate
  }
  throw new Error(`Нет курса для конвертации из ${fromCurrency} в ${toCurrency}`)
}

function isTransactionToSkip (rawTransaction: StatementTransaction): boolean {
  if (rawTransaction.description === null || rawTransaction.description.trim() === '') {
    return false
  }
  // Пропускаем транзакции с описанием "ETN_SUPERAPP продажа"
  if (rawTransaction.description.includes('ETN_SUPERAPP продажа')) {
    return true
  }

  // Пропускаем только те "Прием вклада по договору", где сумма вклада имеет тыины (дробная часть)
  if (/Прием вклада по договору.*в сумме\s\d+\.\d{1,2}\s*KZT/i.test(rawTransaction.description)) {
    return true // есть тыины, пропускаем
  }

  return false
}

export function convertPdfStatementTransaction (rawTransaction: StatementTransaction, rawAccount: AccountOrCard, currencyRates: Record<string, ExchangeRate>): ConvertedTransaction | null {
  if (isTransactionToSkip(rawTransaction)) {
    return null
  }
  let sum = parseFloat(rawTransaction.amount.replace(',', '.').replace(/[\s+$]/g, ''))
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

  if (invoice !== null) {
    sum = convertCurrency(currencyRates, sum, invoice.instrument, 'KZT')
  }

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
  if (parsedType === null) {
    console.warn('Unknown transaction type for', rawTransaction.originString)
  }
  let movements: [Movement] | [Movement, Movement]

  if (parsedType !== null && [transactionType.CASH, transactionType.TRANSFER].includes(parsedType)) {
    let type
    let syncIds = null
    if (parsedType === transactionType.CASH) {
      type = AccountType.cash
    } else if (parsedType === transactionType.TRANSFER && rawTransaction.description !== null) {
      type = AccountType.deposit
      const syncIdMatch = rawTransaction.description.match(/KZ[A-Z0-9]{15}/)
      if (syncIdMatch) {
        syncIds = [syncIdMatch[0]]
      }
    } else {
      type = AccountType.ccard
    }
    const secondMovement: Movement = {
      id: null,
      account: {
        type,
        instrument,
        company: null,
        syncIds
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
