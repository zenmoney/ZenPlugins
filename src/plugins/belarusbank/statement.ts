import md5 from 'crypto-js/md5'
import type { ExtendedTransaction } from '../../types/zenmoney'
import { normalizeCurrency } from './helpers'
import type { ProductAccount } from './models'

const DATE_PATTERN = '(\\d{2}\\.\\d{2}\\.\\d{4})'
const TIME_PATTERN = /^\d{2}:\d{2}:\d{2}$/
const STANDARD_DATE_PATTERN = new RegExp(`^${DATE_PATTERN}$`)
const BOOKING_LINE_PATTERN = new RegExp(`^${DATE_PATTERN}(.+)$`)
const INLINE_DATE_PATTERN = new RegExp(`^${DATE_PATTERN}\\s+${DATE_PATTERN}(.+)$`)
const AMOUNT_LINE_PATTERN = /^([\d ]+,\d{2})\s*([A-Z]{3})\s*([+-]?[\d ]+,\d{2})\s*(-?[\d ]+,\d{2})(.*)$/
const CARD_NUMBER_PATTERN = /^\d{4}\*{3}\d{4}$/
const P2P_DESCRIPTION_PATTERN = /\b(?:PERSON TO PERSON|P2P)\b/i

interface StatementEntryStart {
  index: number
  operationDate: string
  time: string | null
  bookingDate: string
  amountPayload: string
  descriptionStartIndex: number
}

interface ParsedAmountLine {
  transactionAmount: number
  transactionCurrency: string
  accountAmount: number
  accountAmountIsCredit: boolean
  inlineDescription: string
}

const parseMoney = (value: string): number => Number(value.replace(/\s/g, '').replace(',', '.'))

const parseAmountLine = (value: string): ParsedAmountLine | null => {
  const match = AMOUNT_LINE_PATTERN.exec(value.trim())
  if (match == null) return null

  const transactionAmount = parseMoney(match[1])
  const accountAmount = parseMoney(match[3])
  if (!Number.isFinite(transactionAmount) || !Number.isFinite(accountAmount)) return null

  return {
    transactionAmount,
    transactionCurrency: normalizeCurrency(match[2]),
    accountAmount,
    accountAmountIsCredit: match[3].startsWith('+'),
    inlineDescription: match[5].trim()
  }
}

const findEntryStarts = (lines: string[]): StatementEntryStart[] => {
  const starts: StatementEntryStart[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const standardDate = STANDARD_DATE_PATTERN.exec(lines[index])
    const bookingLine = BOOKING_LINE_PATTERN.exec(lines[index + 2] ?? '')
    if (standardDate != null && TIME_PATTERN.test(lines[index + 1] ?? '') && bookingLine != null) {
      starts.push({
        index,
        operationDate: standardDate[1],
        time: lines[index + 1],
        bookingDate: bookingLine[1],
        amountPayload: bookingLine[2],
        descriptionStartIndex: index + 3
      })
      index += 2
      continue
    }

    const inlineDate = INLINE_DATE_PATTERN.exec(lines[index])
    if (inlineDate != null) {
      starts.push({
        index,
        operationDate: inlineDate[1],
        time: null,
        bookingDate: inlineDate[2],
        amountPayload: inlineDate[3],
        descriptionStartIndex: index + 1
      })
    }
  }

  return starts
}

const cleanDescription = (lines: string[], inlineDescription: string): string | null => {
  const result: string[] = inlineDescription.length > 0 ? [inlineDescription] : []
  let skippingTableHeader = false

  for (const line of lines) {
    if (line === 'Дата и') {
      skippingTableHeader = true
      continue
    }
    if (skippingTableHeader) {
      if (line === 'Номер карты') skippingTableHeader = false
      continue
    }
    if (TIME_PATTERN.test(line) || CARD_NUMBER_PATTERN.test(line) || line.startsWith('Реквизиты банка:')) continue
    if (line.startsWith('No расчетного счета') || line.startsWith('БИК ') || line.startsWith('УНП ')) continue
    if (line.length > 0) result.push(line)
  }

  const description = result.join(' ').replace(/\s+/g, ' ').trim()
  return description.length > 0 ? description : null
}

const parseStatementDate = (date: string, time: string): Date => {
  const [day, month, year] = date.split('.')
  const result = new Date(`${year}-${month}-${day}T${time}+03:00`)
  if (!Number.isFinite(result.getTime())) throw new Error(`Invalid Belarusbank statement date: ${date} ${time}`)
  return result
}

/** Converts the text layer of an official Belarusbank account statement to posted transactions. */
export const parseStatementTransactions = (text: string, account: ProductAccount): ExtendedTransaction[] => {
  const lines = text
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.trim())
  const starts = findEntryStarts(lines)
  const transactions: ExtendedTransaction[] = []
  const identityOccurrences = new Map<string, number>()

  for (let entryIndex = 0; entryIndex < starts.length; entryIndex += 1) {
    const entry = starts[entryIndex]
    const amount = parseAmountLine(entry.amountPayload)
    if (amount == null || amount.accountAmount === 0) continue

    const endIndex = starts[entryIndex + 1]?.index ?? lines.length
    const descriptionLines = lines.slice(entry.descriptionStartIndex, endIndex)
    const time = entry.time ?? descriptionLines.find((line) => TIME_PATTERN.test(line))
    if (time == null) continue

    const date = parseStatementDate(entry.operationDate, time)
    const sign = amount.accountAmountIsCredit ? 1 : -1
    const sum = Math.abs(amount.accountAmount) * sign
    const invoiceSum = Math.abs(amount.transactionAmount) * sign
    const comment = cleanDescription(descriptionLines, amount.inlineDescription)
    const groupKeys = comment != null && P2P_DESCRIPTION_PATTERN.test(comment)
      ? [`belarusbank:p2p:${date.toISOString()}:${amount.transactionCurrency}:${Math.abs(invoiceSum).toFixed(2)}`]
      : undefined
    const identity = JSON.stringify({
      accountId: account.id,
      operationDate: entry.operationDate,
      time,
      bookingDate: entry.bookingDate,
      sum,
      transactionCurrency: amount.transactionCurrency,
      transactionAmount: invoiceSum,
      comment
    })
    const occurrence = identityOccurrences.get(identity) ?? 0
    identityOccurrences.set(identity, occurrence + 1)
    const id = md5(JSON.stringify({ identity, occurrence })).toString()

    transactions.push({
      hold: false,
      date,
      groupKeys,
      comment,
      movements: [{
        id,
        account: { id: account.id },
        fee: 0,
        invoice: amount.transactionCurrency !== account.instrument
          ? {
              sum: invoiceSum,
              instrument: amount.transactionCurrency
            }
          : null,
        sum
      }],
      merchant: null
    })
  }

  return transactions
}
