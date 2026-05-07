import { ParsedHeader, ParsedTransaction, ParsedTransactionDetails } from './models'

import { KNOWN_OPERATIONS } from './constants'

import { normalizeText, parseNumber } from './utils'

function normalizeCompactText (text: string): string {
  return text
    .replace(/["']/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim()
}

export function isAccountStatement (text: string): boolean {
  const compact = normalizeCompactText(text)
  if (/Выписка\s*по\s*карточному\s*счету|Card\s*account\s*statement|Карточкалық\s*шот\s*бойынша\s*үзінді/i.test(compact)) {
    return true
  }

  const normalized = normalizeText(text)
  return /Receipts\s*Expenses|Поступления\s*Расходы|Кірістер\s*Шығыстар|Түсімдер\s*Шығындар/i.test(normalized)
}

export function parseAccountHeader (text: string): ParsedHeader {
  const compact = normalizeCompactText(text)
  const normalized = /Выписка\s*по\s*карточному\s*счету|Card\s*account\s*statement|Карточкалық\s*шот\s*бойынша\s*үзінді/i.test(compact)
    ? compact
    : normalizeText(text)
  const res: ParsedHeader = {}
  const lines = normalized.split('\n')
  const headerLines: string[] = []

  for (const line of lines) {
    if (/Date\s*of\s*transaction|Дата\s*операции|Операция\s*күні|Дата\s*Сумма\s*Описание\s*Детализация|Date\s*Amount\s*Description\s*Details/i.test(line)) {
      break
    }
    headerLines.push(line)
  }

  const headerText = headerLines.join('\n')

  const ibanMatch = headerText.match(/KZ[0-9A-Z]{18}/)
  if (ibanMatch != null) res.accountNumber = ibanMatch[0]

  const currencyMatch = headerText.match(/\(([A-Z]{3})\)/)
  if (currencyMatch != null) res.currency = currencyMatch[1]

  if (res.currency === undefined) {
    const labeledCurrencyMatch = headerText.match(/(?:Валюта\s*счета|Account\s*currency|Шот\s*валютасы)\s*:\s*([A-Z]{3})/i)
    if (labeledCurrencyMatch != null) res.currency = labeledCurrencyMatch[1]
  }

  const availableMatch = headerText.match(/(?:Доступно\s*на|Available\s*as\s*of|Қолжетімді(?:\s*күні)?)(?:\s+\d{2}\.\d{2}\.\d{4})?\s*:?\s*([-+]?(?:\d[\d\s]*)[.,]\d{2})\s*[A-Z]{3}?/i)
  if (availableMatch != null) {
    res.balance = parseNumber(availableMatch[1])
    return res
  }

  for (const line of headerLines) {
    // Look for lines with multiple numbers (Balance table)
    // Improve pattern to be greedy across spaces
    const numberPattern = /[-+]?(?:\d[\d\s]*)[.,]\d{2}/g
    const matches = line.match(numberPattern)
    if ((matches != null) && matches.length >= 5) {
      // Sometimes due to spacing issues, the last valid balance might be split
      // We take the last one, but ensure strict parsing
      const lastNum = matches[matches.length - 1]
      res.balance = parseNumber(lastNum)
    }
  }

  return res
}

function parseDetails (text: string): { structured: Record<string, string>, freeText: string } {
  // Extract key-value pairs
  // Keys: "Full name/Name", "ФИО\Наименование", "IIN/BIN", "ИИН\БИН", "Bank", "Банк", "Account", "Счёт-корреспондент", "Correspondent Account"
  // Separators: ": " and ", "
  // Key regex escaping fixed previously

  const keys = [
    'Full name/Name', 'ФИО\\\\Наименование', 'Аты-жөні/Атауы', 'Аты-жөні\\\\Атауы',
    'IIN/BIN', 'IIN', 'ИИН\\\\БИН', 'ИИН', 'ЖСН\\\\БСН',
    'Bank', 'Банк',
    'Correspondent Account', 'Account', 'Счёт-корреспондент', 'Корреспонденттік шот'
  ]

  // Construct regex to match any key followed by colon
  // Use string concatenation to avoid backtick issues
  const keyPattern = new RegExp('(' + keys.join('|') + '):', 'g')

  const normalizedText = text
    .replace(/Сч[её]т-\s*корреспондент/gi, 'Счёт-корреспондент')
    .replace(/Correspondent\s+Account/gi, 'Correspondent Account')

  const matches = [...normalizedText.matchAll(keyPattern)]

  const structured: Record<string, string> = {}

  if (matches.length === 0) {
    return { structured, freeText: normalizedText.trim() }
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const key = match[1] // The key text
    const startVal = (match.index ?? 0) + match[0].length

    let endVal = normalizedText.length
    endVal = matches[i + 1]?.index ?? normalizedText.length

    let val = normalizedText.substring(startVal, endVal).trim()

    // Remove trailing comma if present (often used as separator)
    if (val.endsWith(',')) {
      val = val.substring(0, val.length - 1).trim()
    }

    // Map key to standard key
    let stdKey = key
    if (key.includes('Name') || key.includes('Наименование') || key.includes('Аты-жөні') || key.includes('Атауы')) stdKey = 'name'
    else if (key.includes('IIN') || key.includes('BIN') || key.includes('ИИН')) stdKey = 'iin'
    else if (key.includes('Bank') || key.includes('Банк')) stdKey = 'bank'
    else if (key.includes('Account') || key.includes('Счёт') || key.includes('шот')) stdKey = 'account'

    structured[stdKey] = val
  }

  if (structured.account !== undefined) {
    const accountVal = structured.account
    const ibanMatch = accountVal.match(/(KZ[0-9A-Z]{18})/)
    if (ibanMatch != null) {
      structured.account = ibanMatch[0]
      const rest = accountVal.substring(accountVal.indexOf(ibanMatch[0]) + ibanMatch[0].length).trim()
      return { structured, freeText: rest }
    }
  }

  return { structured, freeText: '' }
}

function isOwnAccountTransfer (details: string, structured: Record<string, string>): boolean {
  if (structured.account == null) return false

  return /Пополнение\s+сч[её]та|Списание\s+со\s+сч[её]та|Account\s+replenishment|Debit\s+from\s+account/i.test(details)
}

function detectAccountOperation (description: string, amount: number): string {
  for (const op of KNOWN_OPERATIONS) {
    if (description.toLowerCase().includes(op.toLowerCase())) {
      if (['Снятие наличных', 'Снятие', 'Ақша алу'].some(x => op.includes(x))) return 'Cash withdrawal'
      if (['Пополнение', 'Толықтыру'].some(x => op.includes(x))) return 'Account replenishment'
      if (['Перевод', 'Аударым'].some(x => op.includes(x))) return 'Transfer'
      if (['Покупка', 'Оплата', 'Сатып алу', 'Төлем'].some(x => op.includes(x))) return 'Purchase'
      if (['Комиссия'].some(x => op.includes(x))) return 'Commission'
      if (['Возврат'].some(x => op.includes(x))) return 'Refund'
      return op
    }
  }
  return amount < 0 ? 'Purchase' : 'Account replenishment'
}

function splitKnownOperation (text: string, amount: number): { operation: string, details: string } {
  for (const op of KNOWN_OPERATIONS) {
    if (text.toLowerCase().startsWith(op.toLowerCase())) {
      return {
        operation: detectAccountOperation(op, amount),
        details: text.substring(op.length).trim()
      }
    }
  }

  return {
    operation: detectAccountOperation(text, amount),
    details: text
  }
}

function extractTransferAccount (text: string): string | undefined {
  const ibanMatch = text.match(/\b(KZ[0-9A-Z]{18})\b/)
  if (ibanMatch != null) return ibanMatch[1]

  const cardMatch = text.match(/\b(\d{16})\b/)
  if (cardMatch != null) return cardMatch[1]

  const maskedCardMatch = text.match(/\b(\d{6}[*]+\d{4})\b/)
  if (maskedCardMatch != null) return maskedCardMatch[1]

  const shortMaskedCardMatch = text.match(/(?:^|[^\d])([*]{4}\d{4})\b/)
  if (shortMaskedCardMatch != null) return shortMaskedCardMatch[1]

  return undefined
}

export function parseAccountTransactions (text: string): ParsedTransaction[] {
  const compact = normalizeCompactText(text)
  const normalized = /Выписка\s*по\s*карточному\s*счету|Card\s*account\s*statement|Карточкалық\s*шот\s*бойынша\s*үзінді/i.test(compact)
    ? compact
    : normalizeText(text)
  const lines = normalized.split('\n')
  const transactions: ParsedTransaction[] = []

  let inTransactions = false
  // Allow spaces or no spaces in header
  const headerRegex = /Date\s*of\s*transaction|Дата\s*операции|Операция\s*күні|Дата\s*Сумма\s*Описание\s*Детализация|Date\s*Amount\s*Description\s*Details/i

  let currentBlock: string[] = []

  const processBlock = (block: string[]): void => {
    if (block.length === 0) return

    const firstLine = block[0].trim()
    const dateMatch = firstLine.match(/^(\d{2}\.\d{2}\.\d{4})/)
    if (dateMatch == null) return

    const date = dateMatch[1]

    const fullText = block.join(' ')
    const compactMatch = fullText.match(/^(\d{2}\.\d{2}\.\d{4})\s+([-+]?(?:\d[\d\s]*)[.,]\d{2})\s+([A-Z]{3})\s+(.+)$/)
    if (compactMatch != null) {
      const [, compactDate, compactAmount, , compactRest] = compactMatch
      const { operation, details } = splitKnownOperation(compactRest.trim(), parseNumber(compactAmount))
      const { structured, freeText } = parseDetails(details)
      const normalizedOperation = isOwnAccountTransfer(details, structured) ? 'Transfer' : operation
      const parsedDetails: ParsedTransactionDetails = {}

      if (structured.name !== undefined && structured.name !== '') {
        parsedDetails.merchantName = structured.name
      }
      if (structured.bank !== undefined) {
        parsedDetails.merchantBank = structured.bank
      }
      if (structured.account !== undefined) {
        parsedDetails.receiverAccount = structured.account
      }
      if (normalizedOperation === 'Transfer') {
        parsedDetails.receiver = details
        parsedDetails.receiverAccount = parsedDetails.receiverAccount ?? extractTransferAccount(details)
      }
      if (parsedDetails.merchantName === undefined && freeText !== '') {
        parsedDetails.merchantName = freeText
      }

      transactions.push({
        date: compactDate,
        amount: parseNumber(compactAmount),
        description: freeText !== '' ? freeText : details,
        operation: normalizedOperation,
        details,
        parsedDetails,
        originString: fullText
      })
      return
    }

    // Use double backslash for escaping in string
    // Support trailing minus: 100,00 -
    const amountOrDash = '([-+]?(?:\\d[\\d\\s]*)[.,]\\d{2}(?:\\s*-)?|-)'

    // Support either "Receipt Expense" (2 cols) or just one amount at end
    const amountsRegex = new RegExp(amountOrDash + '(?:\\s+' + amountOrDash + ')?$')

    const amountsMatch = fullText.match(amountsRegex)

    let amount = 0
    let description = fullText

    if (amountsMatch != null) {
      const val1 = amountsMatch[1] // First capture
      const val2 = amountsMatch[2] // Second capture (optional)

      description = fullText.substring(0, fullText.length - amountsMatch[0].length).trim()

      let receipt = 0
      let expense = 0

      if (val2 !== undefined) {
        receipt = parseNumber(val1)
        expense = parseNumber(val2)
        amount = receipt - expense
      } else {
        // Only one value found at the end
        // Case: "3600000,00-" glued. Means Receipt 3600000, Expense -.
        if (/[0-9][\d\s.,]*-$/.test(val1)) {
          // Ends with -, starts with digit (approx). Treat as positive receipt.
          amount = parseNumber(val1.replace(/-$/, ''))
        } else {
          amount = parseNumber(val1)
        }
      }
    }

    if (description.startsWith(date)) {
      description = description.substring(date.length).trim()
    }

    const { structured, freeText } = parseDetails(description)

    const operation = isOwnAccountTransfer(description, structured)
      ? 'Transfer'
      : detectAccountOperation((freeText !== '') ? freeText : description, amount)

    const parsedDetails: ParsedTransactionDetails = {}

    if (structured.name !== undefined && structured.name !== '') {
      parsedDetails.merchantName = structured.name
    }

    if (structured.bank !== undefined) {
      parsedDetails.merchantBank = structured.bank
    }

    if (structured.account !== undefined) {
      parsedDetails.receiverAccount = structured.account
    }

    if (operation === 'Transfer') {
      parsedDetails.receiver = description
      parsedDetails.receiverAccount = parsedDetails.receiverAccount ?? extractTransferAccount(description)
    }

    if (parsedDetails.merchantName === undefined && freeText.includes('ForteForex')) {
      parsedDetails.merchantName = 'ForteForex'
    }

    if (parsedDetails.merchantName === undefined && freeText !== '') {
      parsedDetails.merchantName = freeText
    }

    transactions.push({
      date,
      amount,
      description: (freeText !== '') ? freeText : description,
      operation,
      details: description,
      parsedDetails,
      originString: fullText
    })
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!inTransactions) {
      if (headerRegex.test(trimmed)) {
        inTransactions = true
      }
      continue
    }

    if (/^\d{2}\.\d{2}\.\d{4}/.test(trimmed)) {
      processBlock(currentBlock)
      currentBlock = [trimmed]
    } else {
      if (/Arrests\/claims|Аресты\/требования|Тұтқындаулар\/талаптар|Тыйым\s*салулар\/талап/.test(trimmed)) break
      if (/Formed via|Сформировано в|Жасалған/.test(trimmed)) break

      if (currentBlock.length > 0) {
        currentBlock.push(trimmed)
      }
    }
  }
  processBlock(currentBlock)

  return transactions
}
