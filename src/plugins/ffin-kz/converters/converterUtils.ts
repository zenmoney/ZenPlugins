import { Amount } from '../../../types/zenmoney'

export function parseAmount (amount: string): Amount {
  // 19,455.00₸
  const instrumentMatch = amount.match(/[^\d\s.,\-+]+/)
  assert(typeof instrumentMatch?.[0] === 'string', 'Can not parse instrument')
  const sum = parseFloat(amount.replace(/,/g, '').replace(/₸/g, ''))
  return {
    sum,
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
