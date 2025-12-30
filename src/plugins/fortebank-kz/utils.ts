import { Locale } from './models'

export function normalizeText (text: string): string {
  return text
    .replace(/["']/g, '')
    .replace(/\u00A0/g, ' ') // Non-breaking space
    .replace(/(.) (?=.)/g, '$1') // Remove single spaces between characters (e.g., "T E X T" -> "TEXT")
    .replace(/\r\n/g, '\n')
    .trim()
}

export function parseNumber (text: string): number {
  if (text === '' || text === '-') return 0
  const isNegative = text.includes('-')
  const absVal = parseFloat(text.replace(/-/g, '').replace(/\s/g, '').replace(',', '.'))
  return isNegative ? -absVal : absVal
}

export function parseDate (dateString: string): string {
  // Expects DD.MM.YYYY
  const parts = dateString.trim().split('.')
  if (parts.length !== 3) {
    // If extraction failed or format is unexpected, return as is or handle error.
    // ZenMoney usually expects YYYY-MM-DD or ISO string, or Date object.
    // Let's return YYYY-MM-DD for consistency with converters expectation if possible,
    // but converters often parse different formats.
    // Let's stick to returning normalized string or keep it simple.
    // Actually, looking at converters.ts, it uses `utils.parseDate`? No, it uses `new Date()`.
    // Let's return YYYY-MM-DD string.
    return dateString
  }
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

export function detectLocale (text: string): Locale {
  if (text.includes('S t a t e m e n t') || text.includes('Statement')) {
    return 'en'
  }
  if (text.includes('В ы п и с к а') || text.includes('Выписка')) {
    return 'ru'
  }
  if (text.includes('К ө ш і р м е') || text.includes('Көшірме')) {
    return 'kz'
  }

  if (text.includes('D a t e') && text.includes('S u m')) {
    return 'en'
  }
  if (text.includes('Д а т а') && text.includes('С у м м а')) {
    return 'ru'
  }
  if (text.includes('К ү н і') && text.includes('С о м а')) {
    return 'kz'
  }

  throw new Error('Unknown locale')
}
