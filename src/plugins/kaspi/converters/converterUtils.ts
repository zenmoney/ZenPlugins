import { Amount } from '../../../types/zenmoney'

function parseDecimal (str: string): number {
  const num = parseFloat(str.replace(/\s+/g, '').replace(',', '.'))
  assert(!isNaN(num), `unexpected number string ${str}`)
  return num
}

export function parseAmount (amount: string): Amount {
  // 200 401,09 ₸
  // $100.00
  const instrumentMatch = amount.match(/[^\d\s.,]+/)
  assert(typeof instrumentMatch?.[0] === 'string', 'Can not parse instrument')
  return {
    sum: parseDecimal(amount.replace(/[^\d\s.,]+/g, '').replace(/\s+/g, '').replace(',', '.')),
    instrument: mapInstrument(instrumentMatch[0])
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
