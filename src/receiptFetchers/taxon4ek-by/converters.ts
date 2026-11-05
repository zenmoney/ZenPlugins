import get from '../../types/get'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt, optional } from '../../common/receiptFetcher/receipt'

export function convertReceipt (source: unknown): Receipt {
  const rows = get(source, 'printableCheck')
  assert(Array.isArray(rows), 'Missing Taxon4ek receipt')
  const lines: string[] = []
  let id: string | undefined
  for (const row of rows) {
    const uid = get(row, 'uid')
    if (uid != null) {
      assert(typeof uid === 'string', 'Invalid Taxon4ek receipt identifier')
      const match = uid.trim().match(/^УИ ([A-F0-9]{24})$/)
      assert(match !== null && id === undefined, 'Invalid or duplicate Taxon4ek receipt identifier')
      id = match[1]
    }
    const multiple = get(row, 'textLines')
    const single = get(row, 'text')
    assert(multiple === null || Array.isArray(multiple), 'Invalid Taxon4ek lines')
    for (const value of [...(multiple ?? []), ...(single == null ? [] : [single])]) {
      assert(typeof value === 'string', 'Invalid Taxon4ek text')
      if (value.trim() !== '') lines.push(value.trim())
    }
  }
  const tin = lines.find(line => line.startsWith('УНП '))?.match(/^УНП (\d+) РН СККО \d+$/)?.[1]
  const total = lines.find(line => line.startsWith('ИТОГО К ОПЛАТЕ '))?.match(/([\d.]+)$/)?.[1]
  const service = lines.findIndex(line => line === 'Поездка (заказ через ЭИС)')
  const date = lines[lines.length - 1].match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})$/)
  assert(tin !== undefined && total !== undefined && date !== null && service > 0 && lines.includes('Платежный документ'), 'Unsupported Taxon4ek receipt')
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'BYN',
    operation: 'sale',
    ...optional('id', id),
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: date[4] },
    totalAmount: decimal(total),
    merchant: { name: lines[0], identifiers: [{ value: tin, countryCode: 'BY', scheme: 'UNP' }] },
    // Explicit product decision (2026-11-05): the single trip has quantity 1 when omitted in print.
    items: [{ name: lines[service], quantity: '1', totalAmount: decimal(lines[service + 1]) }],
    payments: lines.filter(line => /^(?:Наличными|Банк\. пл\. картой):/.test(line)).map(line => ({
      method: line.startsWith('Наличными:') ? 'cash' : 'card', amount: decimal(line.split(':')[1].trim())
    }))
  }
  assertReceipt(receipt)
  return receipt
}
