import { ParsedSections, ParsedHeader, ParsedTransaction, ParsedTransactionDetails, Locale } from './models'

import { KNOWN_OPERATIONS } from './constants'

import { normalizeText } from './utils'

// Re-export for compatibility if needed, but better to update consumers.
// For now, let's just use them internally and let consumers update their imports.

const HEADERS: Record<Locale, string> = {
  en: 'D a t e S u m D e s c r i p t i o n D e t a i l s',
  ru: 'Д а т а С у м м а О п и с а н и е Д е т а л и з а ц и я',
  kz: 'К ү н і С о м а C и п а т т а м а с ы Т а л д а м а'
}

const BALANCE_REGEXES: Record<Locale, RegExp> = {
  en: /Available\s*as\s*of\s*\d{2}\.\d{2}\.\d{4}:?\s*([-+]?[\d]+[.,]\d{2})/,
  ru: /Доступно\s*на\s*\d{2}\.\d{2}\.\d{4}:?\s*([-+]?[\d]+[.,]\d{2})/,
  kz: /Қолжетімді\s*\d{2}\.\d{2}\.\d{4}:?\s*([-+]?[\d]+[.,]\d{2})/
}

export { detectLocale } from './utils'

export function splitSections (text: string, locale: Locale): ParsedSections {
  const headerString = HEADERS[locale]
  const parts = text.split(headerString)

  if (parts.length < 3) {
    console.warn(`Header string "${headerString}" found ${parts.length - 1} times. Expected at least 2.`)
    if (parts.length === 2) {
      return {
        header: parts[0],
        transactions: parts[1],
        attic: ''
      }
    }
    return {
      header: text,
      transactions: '',
      attic: ''
    }
  }

  const header = parts[0]
  const attic = parts[parts.length - 1]
  const transactions = parts.slice(1, parts.length - 1).join('\n')

  return {
    header,
    transactions,
    attic
  }
}

export function parseHeader (text: string, locale: Locale): ParsedHeader {
  const normalized = normalizeText(text)

  const ibanMatch = normalized.match(/KZ[0-9A-Z]{18}/)
  const accountNumber = ibanMatch !== null ? ibanMatch[0] : undefined

  const currencyMatch = normalized.match(/\b(KZT|USD|EUR|RUB|GBP)\b/)
  const currency = currencyMatch !== null ? currencyMatch[0] : undefined

  const balanceMatch = normalized.match(BALANCE_REGEXES[locale])
  let balance: number | undefined
  if (balanceMatch !== null) {
    balance = parseFloat(balanceMatch[1].replace(',', '.'))
  }

  return {
    accountNumber,
    currency,
    balance
  }
}

function detectOperation (fullDescription: string, amount: number): { operation: string, details: string } {
  // Operations are already sorted by length in constants
  for (const op of KNOWN_OPERATIONS) {
    // Escape special regex chars if any (unlikely in this list but safe) and allow whitespace/newlines for spaces
    const escapedOp = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regexPattern = '^' + escapedOp.replace(/\s+/g, '\\s+')
    const regex = new RegExp(regexPattern, 'i') // Case insensitive maybe? No, keeping case sensitive as per previous logic, or 'i' for robustness? Text is normalized.

    const match = fullDescription.match(regex)
    if (match !== null) {
      return {
        operation: op,
        details: fullDescription.substring(match[0].length).trim()
      }
    }
  }

  // Fallback based on sign
  if (amount < 0) {
    return { operation: 'Purchase', details: fullDescription }
  } else {
    return { operation: 'Account replenishment', details: fullDescription }
  }
}

function parseTransactionDetails (operation: string, details: string): ParsedTransactionDetails {
  const res: ParsedTransactionDetails = {}

  // Normalize operation to EN for easier matching if needed, or just list all variants
  // For now, check against list or generic logic
  const isPurchase = ['Purchase', 'Purchase with bonuses', 'Refund', 'Покупка', 'Покупка с бонусами', 'Возврат', 'Возврат денег', 'Оплата', 'Сатып алу', 'Қайтару', 'Төлем', 'Платеж', 'Списание'].includes(operation)
  const isWithdrawal = ['Cash withdrawal', 'Снятие наличных', 'Снятие', 'Снятие наличных денег', 'Ақша алу'].includes(operation)
  const isTransfer = ['Transfer', 'Перевод', 'Аударым'].includes(operation)

  if (isWithdrawal) {
    // Expected: bank name, ATM code, Location
    const parts = details.split(',').map(s => s.trim())
    if (parts.length >= 1) res.merchantBank = parts[0]
    if (parts.length >= 2) res.atmCode = parts[1]
    if (parts.length >= 3) res.merchantLocation = parts.slice(2).join(', ')
  } else if (isTransfer) {
    res.receiver = details
    // Attempt to extract account number (IBAN or Card)
    // IBAN: KZ + 18 alphanumeric
    // Card: 16 digits, or masked (123456******1234 or ****1234)
    const ibanMatch = details.match(/\b(KZ[0-9A-Z]{18})\b/)
    const cardMatch = details.match(/\b(\d{16})\b/)
    const maskedCardMatch = details.match(/\b(\d{6}[*]+\d{4})\b/)
    const shortMaskedCardMatch = details.match(/(?:^|[^\d])([*]{4}\d{4})\b/)

    if (ibanMatch !== null) {
      res.receiverAccount = ibanMatch[1]
    } else if (cardMatch !== null) {
      res.receiverAccount = cardMatch[1]
    } else if (maskedCardMatch !== null) {
      res.receiverAccount = maskedCardMatch[1]
    } else if (shortMaskedCardMatch !== null) {
      res.receiverAccount = shortMaskedCardMatch[1]
    }
  } else if (isPurchase) {
    const parts = details.split(',').map(s => s.trim())
    const mccIndex = parts.findIndex(p => p.toUpperCase().startsWith('MCC:'))

    res.merchantName = parts[0]

    if (mccIndex !== -1) {
      // MCC found
      const mccPart = parts[mccIndex]
      const mccMatch = mccPart.match(/MCC:?\\s*(\\d{4})/i)
      if (mccMatch !== null) {
        res.mcc = parseInt(mccMatch[1], 10)
      }

      // After MCC: Payment Method
      const afterMcc = parts.slice(mccIndex + 1)
      if (afterMcc.length > 0) {
        res.paymentMethod = afterMcc.join(', ')
      }
    }
  } else {
    // Account replenishment, Debit, etc.
    // Just description
    res.merchantName = details
  }

  return res
}

export function parseTransactions (text: string): ParsedTransaction[] {
  const normalized = normalizeText(text)
  let lines = normalized.split('\n')
  const transactions: ParsedTransaction[] = []

  const rowStartRegex = /^(\d{2}\.\d{2}\.\d{4})\s*([-+]?[\d]+[.,]\d{2})(.*)$/
  const dateOnlyRegex = /^\d{2}\.\d{2}\.\d{4}$/
  const amountStartRegex = /^[-+]?[\d]+[.,]\d{2}/

  // Pre-process to merge split date and amount lines
  const mergedLines: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i]
    const trimmedLine = currentLine.trim()

    if (dateOnlyRegex.test(trimmedLine) && i + 1 < lines.length) {
      const nextLine = lines[i + 1]
      const trimmedNextLine = nextLine.trim()

      if (amountStartRegex.test(trimmedNextLine)) {
        mergedLines.push(`${trimmedLine} ${trimmedNextLine}`)
        i++
        continue
      }
    }
    mergedLines.push(currentLine)
  }
  lines = mergedLines

  let currentTransaction: ParsedTransaction | null = null

  const finalizeTransaction = (t: ParsedTransaction): void => {
    // Clean up description newlines
    let fullDesc = t.description.trim()

    // Strip currency code from start if present (e.g. "KZT Purchase...")
    // Optionally allow space, because sometimes it is "KZTПокупка"
    const currencyMatch = fullDesc.match(/^(KZT|USD|EUR|RUB|GBP)\s?/)
    if (currencyMatch !== null) {
      fullDesc = fullDesc.substring(currencyMatch[0].length)
    }

    // Strip foreign currency amount from start if present (e.g. "(1725.50 UZS) ...")
    // Keep it to populate parsedDetails later
    let leadingForeignMatch: RegExpMatchArray | null = null
    const foreignPrefixMatch = fullDesc.match(/^\(\s*([\d\s.,]+)\s*([A-Z]{3})\s*\)\s*/)
    if (foreignPrefixMatch !== null) {
      leadingForeignMatch = foreignPrefixMatch
      fullDesc = fullDesc.substring(foreignPrefixMatch[0].length).trim()
    }

    const { operation, details } = detectOperation(fullDesc, t.amount)
    t.operation = operation
    t.details = details
    t.parsedDetails = parseTransactionDetails(operation, details)

    // Extract foreign currency amount: (31000.00 UZS) or (3.35 USD)
    // Check either the stripped leading match OR search in the full original description (or what's left of it?)
    // Actually, detectOperation uses cleaned fullDesc.
    // If we stripped it, we should use the stripped match.
    // If not found at start, we might still want to look in the rest of the text (though usually it is at start or end).
    // The previous logic looked anywhere in fullDesc.
    // Let's use the leading match if found, otherwise fall back to searching in the *original* (or previously cleaned) text?
    // Actually, `fullDesc` is modified now.
    // Let's use `leadingForeignMatch` if available, otherwise search in `fullDesc` (which might be the rest of text).
    // Wait, if it was in the middle, `foreignPrefixMatch` wouldn't find it, but the old regex `match` would.
    // So we should search `fullDesc` (modified) if `leadingForeignMatch` is null.
    // However, if we stripped it, `fullDesc` no longer has it. So we must prioritize `leadingForeignMatch`.

    const foreignMatch = leadingForeignMatch ?? fullDesc.match(/\(\s*([\d\s.,]+)\s*([A-Z]{3})\s*\)/)

    if (foreignMatch !== null && t.parsedDetails != null) {
      const amountStr = foreignMatch[1].replace(/\s/g, '').replace(',', '.')
      const currency = foreignMatch[2]
      if (!isNaN(parseFloat(amountStr))) {
        t.parsedDetails.foreignAmount = parseFloat(amountStr)
        // If the main amount is negative (expense), the foreign amount should usually be negative too for consistency in invoice
        // However, the text usually shows absolute value "3.35 USD".
        // If it is an expense, we might want to flip the sign of the foreign amount to match the main amount direction.
        if (t.amount < 0) {
          t.parsedDetails.foreignAmount = -Math.abs(t.parsedDetails.foreignAmount)
        } else {
          t.parsedDetails.foreignAmount = Math.abs(t.parsedDetails.foreignAmount)
        }
        t.parsedDetails.foreignCurrency = currency
      }
    }

    // Fallback MCC if not parsed in details but present in text (for safety)
    if (t.parsedDetails?.mcc == null) {
      const mccMatch = fullDesc.match(/MCC:?\s*(\d{4})/i)
      if (mccMatch !== null) {
        t.parsedDetails.mcc = parseInt(mccMatch[1], 10)
      }
    }
    t.mcc = t.parsedDetails.mcc

    transactions.push(t)
  }

  for (const line of lines) {
    const match = line.trim().match(rowStartRegex)
    if (match !== null) {
      if (currentTransaction !== null) {
        finalizeTransaction(currentTransaction)
      }

      const date = match[1]
      const amountStr = match[2].replace(/\s/g, '').replace(',', '.')
      const amount = parseFloat(amountStr)
      const description = match[3].trim()

      currentTransaction = {
        date,
        amount,
        description,
        operation: '',
        details: '',
        originString: line
      }
    } else {
      if (currentTransaction !== null && line.trim() !== '') {
        currentTransaction.description += '\n' + line.trim()
        currentTransaction.originString += '\n' + line
      }
    }
  }

  if (currentTransaction !== null) {
    finalizeTransaction(currentTransaction)
  }

  return transactions
}
