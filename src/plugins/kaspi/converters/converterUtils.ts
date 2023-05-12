import { Amount } from '../../../types/zenmoney'

function parseDecimal (str: string): number {
  const num = parseFloat(str.replace(/\s+/g, '').replace(',', '.'))
  assert(!isNaN(num), `unexpected number string ${str}`)
  return num
}

export function parseAmount (amount: string): Amount {
  // 200 401,09 ₸
  const parts = amount.split(/\s+/).map(s => s.trim()).filter(s => s)
  return {
    sum: parseDecimal(parts.slice(0, parts.length - 1).join('')),
    instrument: mapInstrument(parts[parts.length - 1])
  }
}

function mapInstrument (tag: string): string {
  if (tag === '₸') {
    return 'KZT'
  }
  if (tag === '$') {
    return 'USD'
  }
  assert(false, 'found unknown instrument', tag)
}

export function parseAsKzTime (data: string): Date {
  return new Date(data.replace('Z', '+06:00'))
}
