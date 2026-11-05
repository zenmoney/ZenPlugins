import type { Receipt, ReceiptItem } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt } from '../../common/receiptFetcher/receipt'

const number = (value: string): string => decimal(value.replace(/[\s₸]/g, ''))

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected reKassa PDF text')
  const lines = source.split('\n').map(line => line.trim()).filter(Boolean)
  const date = source.match(/Дата: (\d{2})-(\d{2})-(\d{4}) Уақыт \/ Время: (\d{2}:\d{2}:\d{2})/)
  const tin = source.match(/БИН \(ИИН\): (\d+)/)?.[1]
  const total = lines.find(line => line.startsWith('БАРЛЫҒЫ / ИТОГО '))?.replace('БАРЛЫҒЫ / ИТОГО ', '')
  const start = lines.findIndex(line => /^1\.\s+/.test(line))
  assert(date !== null && tin !== undefined && total !== undefined && total.endsWith('₸') && start > 0, 'Incomplete reKassa receipt')
  const end = lines.findIndex((line, i) => i > start && /^_+$/.test(line))
  assert(end > start, 'Missing reKassa item boundary')
  const items: ReceiptItem[] = []
  let item: ReceiptItem | undefined
  for (const line of lines.slice(start, end)) {
    const name = line.match(/^\d+\.\s+(.+)$/)
    const quote = line.match(/^([\d.]+) (.+?) × ([\d\s.]+)₸ ([\d\s.]+)₸$/)
    const cost = line.match(/^Бағасы \/ Стоимость ([\d\s.]+)₸$/)
    const tax = line.match(/^он\. ішін\. ҚҚС \/ в т\.ч\. НДС ([\d.]+)% ([\d\s.]+)₸$/)
    if (name !== null) {
      if (item !== undefined) items.push(item)
      item = { name: name[1], quantity: '', totalAmount: '' }
    } else if (quote !== null) {
      assert(item !== undefined, 'Missing reKassa item name')
      item.quantity = number(quote[1]); item.unit = quote[2]; item.unitPrice = number(quote[3]); item.totalAmount = number(quote[4])
    } else if (cost !== null) {
      assert(item !== undefined && item.totalAmount === number(cost[1]), 'Unsupported reKassa adjusted line')
    } else if (tax !== null) {
      assert(item !== undefined, 'Missing reKassa tax item')
      item.adjustments = [{ kind: 'tax', name: 'НДС', amount: number(tax[2]), percent: number(tax[1]) }]
    } else throw new Error('Unsupported reKassa item row')
  }
  if (item !== undefined) items.push(item)
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: source.includes('Сату / Продажа:') ? 'sale' : 'unknown',
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: date[4] },
    totalAmount: number(total),
    merchant: { name: lines[0], address: lines[2], identifiers: [{ value: tin, countryCode: 'KZ', scheme: 'IIN/BIN' }] },
    items,
    payments: lines.slice(end).filter(line => line.startsWith('Ақша / Наличные ')).map(line => ({ method: 'cash', amount: number(line.replace('Ақша / Наличные ', '')) }))
  }
  assertReceipt(receipt)
  return receipt
}
