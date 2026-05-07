import { ParsedHeader } from './models'
import { normalizeText, parseNumber, parseDate } from './utils'

function normalizeCompactText (text: string): string {
  return text
    .replace(/["']/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim()
}

export function isDepositStatement (text: string): boolean {
  const compact = normalizeCompactText(text)
  if (/(?:Выписка\s*по\s*сберегательному\s*счету|Savings\s*Account\s*Statement|Жинақ\s*шоты\s*бойынша\s*үзінді\s*көшірме)/i.test(compact)) {
    return true
  }

  const normalized = normalizeText(text)
  return /(?:Выписка\s*по\s*сберегательному\s*счету|Savings\s*Account\s*Statement|Жинақ\s*шоты\s*бойынша\s*үзінді\s*көшірме)/i.test(normalized)
}

export function parseDepositHeader (text: string): ParsedHeader {
  const compact = normalizeCompactText(text)
  const normalized = /(?:Выписка\s*по\s*сберегательному\s*счету|Savings\s*Account\s*Statement|Жинақ\s*шоты\s*бойынша\s*үзінді\s*көшірме)/i.test(compact)
    ? compact
    : normalizeText(text)
  const res: ParsedHeader = { isDeposit: true }
  const lines = normalized.split('\n')
  const headerLines: string[] = []

  for (const line of lines) {
    if (/Date\s*of\s*transaction|Дата\s*операции|Операция\s*күні|Дата\s*Сумма\s*Описание\s*Детализация/i.test(line)) {
      break
    }
    headerLines.push(line)
  }

  const headerText = headerLines.join('\n')

  const ibanMatch = headerText.match(/KZ[0-9A-Z]{18}/)
  if (ibanMatch != null) res.accountNumber = ibanMatch[0]

  const currencyMatch = headerText.match(/\(([A-Z]{3})\)/)
  if (currencyMatch != null) res.currency = currencyMatch[1]

  // Start Date
  // RU: Дата договора
  // EN: Date of the Agreement
  // KZ: Шарттың күні
  const startDateMatch = headerText.match(/(?:Дата\s*договора|Date\s*of\s*the\s*Agreement|Шарттың\s*күні)\s*:\s*(\d{2}\s*\.\s*\d{2}\s*\.\s*\d{4})/i)
  if (startDateMatch != null) {
    res.startDate = parseDate(startDateMatch[1].replace(/\s/g, ''))
  }

  // Interest Rate
  // RU: Ставка по вкладу
  // EN: Interest rate
  // KZ: Cыйақы мөлшерлемесі (First letter might be Latin C or Cyrillic С)
  const rateMatch = headerText.match(/(?:Ставка\s*по\s*вкладу|Interest\s*rate|[CС]ыйақы\s*мөлшерлемесі)\s*:\s*([\d\s,.]+)\s*%/i)
  if (rateMatch != null) {
    res.percent = parseNumber(rateMatch[1])
  }

  // Product Name
  // RU: Наименование продукта
  // EN: Product name
  // KZ: Өнімнің атауы
  const productMatch = headerText.match(/(?:Наименование\s*продукта|Product\s*name|Өнімнің\s*атауы)\s*:\s*([^\n]+)/i)
  if (productMatch != null) {
    res.productName = productMatch[1].trim()
  }

  // Start Balance lines
  let balanceLineIndex = -1

  for (let i = 0; i < lines.length; i++) {
    // RU: Остаток средств ... на конец
    // EN: Opening balance ... Available amount? (Actually looking for the line structure)
    // KZ: Кезең басына ... Қолжетімді сома

    // We look for "Available amount" / "Доступная сумма" / "Қолжетімді сома"
    // And balance line usually follows shortly
    if (/(?:Доступная\s*сумма|Available\s*amount|Қолжетімді\s*сома)/i.test(lines[i])) {
      // Look ahead for the numbers line
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (/[\d\s]+,\s*\d{2}/.test(lines[j])) {
          balanceLineIndex = j
          break
        }
      }
      break
    }
  }

  if (balanceLineIndex !== -1) {
    const balanceLine = lines[balanceLineIndex]
    const numberMatches = balanceLine.match(/[-+]?(?:\d[\d\s]*)[.,]\s*\d{2}/g)

    if ((numberMatches != null) && numberMatches.length >= 5) {
      res.startBalance = parseNumber(numberMatches[0])
      if (numberMatches.length >= 6) {
        res.balance = parseNumber(numberMatches[4]) // 5th item
      } else {
        res.balance = parseNumber(numberMatches[numberMatches.length - 1])
      }
    }
  }

  return res
}
