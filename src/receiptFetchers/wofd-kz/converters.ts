import get from '../../types/get'
import type { Receipt, ReceiptItem } from '../../types/receiptFetcher'
import { add, decimal, divideExact, subtract } from '../../common/decimal'
import { assertReceipt, optional } from '../../common/receiptFetcher/receipt'

const number = (value: string): string => decimal(value.replace(/[\s₸]/g, '').replace(',', '.'))

export function convertReceipt (source: unknown): Receipt {
  assert(get(source, 'found') === 1, 'Missing WOFD receipt')
  const rows = get(source, 'ticket')
  assert(Array.isArray(rows), 'Missing WOFD print rows')
  const lines = rows.map((row: unknown) => { const value = get(row, 'text'); assert(typeof value === 'string', 'Invalid WOFD print row'); return value.trim() })
  const start = lines.findIndex(line => /^\*+$/.test(line))
  const end = lines.findIndex((line, i) => i > start && /^-+$/.test(line))
  const tinIndex = lines.findIndex(line => /^БСН\/БИН \d+$/.test(line))
  const date = lines.join('\n').match(/УАҚЫТЫ\/ВРЕМЯ: (\d{2})\.(\d{2})\.(\d{4}) (\d{2}:\d{2}:\d{2})/)
  const total = lines.find(line => line.startsWith('БАРЛЫҒЫ/ИТОГО:'))?.split(':')[1]
  assert(start > 0 && end > start && tinIndex > 0 && date !== null && total !== undefined && total.includes('₸'), 'Incomplete WOFD receipt')
  const items: ReceiptItem[] = []
  let names: string[] = []
  let item: ReceiptItem | undefined
  let roundingSign: string | undefined
  let taxSign: string | undefined
  for (const line of lines.slice(start + 1, end)) {
    if (line === '' || /^NTIN:/.test(line)) continue
    const quote = line.match(/^([\d,]+) \((.+?)\) x ([\d\s,]+)₸\s*= ([\d\s,]+)₸$/)
    if (quote !== null) {
      assert(names.length > 0 && roundingSign === undefined && taxSign === undefined, 'Missing WOFD item name')
      item = { name: names.join(' ').replace(/\s*\(КОД:\d+\)$/, '').trim(), quantity: number(quote[1]), unit: quote[2], unitPrice: number(quote[3]), totalAmount: number(quote[4]), adjustments: [] }
      items.push(item); names = []; taxSign = undefined
      continue
    }
    if (line === 'ҮСТЕМЕ БАҒА/НАЦЕНКА' || line === 'ЖЕҢІЛДІК/СКИДКА') {
      assert(item !== undefined && names.length === 0 && roundingSign === undefined, 'Unexpected WOFD adjustment')
      roundingSign = line === 'ҮСТЕМЕ БАҒА/НАЦЕНКА' ? '+' : '-'
      continue
    }
    const rounding = line.match(/^Коррекция округления\s+([\d\s,]+)₸$/)
    if (rounding !== null) {
      assert(item !== undefined && roundingSign !== undefined && item.originalTotalAmount === undefined, 'Missing WOFD adjustment direction')
      const amount = roundingSign === '-' ? subtract('0', number(rounding[1])) : number(rounding[1])
      item.originalUnitPrice = item.unitPrice
      item.originalTotalAmount = item.totalAmount
      item.totalAmount = add(item.totalAmount, amount)
      delete item.unitPrice
      Object.assign(item, optional('unitPrice', divideExact(item.totalAmount, item.quantity)))
      item.adjustments?.push({ kind: 'rounding', name: 'Коррекция округления', amount })
      taxSign = roundingSign; roundingSign = undefined
      continue
    }
    const tax = line.match(/^ҚҚС\/НДС\s+([\d\s,]+)₸$/)
    if (tax !== null) {
      assert(item !== undefined && names.length === 0, 'Unexpected WOFD tax')
      const adjustment = item.adjustments?.find(value => value.kind === 'tax')
      const amount = number(tax[1])
      if (taxSign !== undefined) {
        assert(adjustment !== undefined, 'Missing WOFD original tax')
        adjustment.amount = taxSign === '-' ? subtract(adjustment.amount, amount) : add(adjustment.amount, amount)
        taxSign = undefined
      } else {
        assert(adjustment === undefined, 'Duplicate WOFD item tax')
        item.adjustments?.push({ kind: 'tax', name: 'ҚҚС/НДС', amount })
      }
      continue
    }
    assert(roundingSign === undefined && !/^[\d.,]+.*[x×=₸]/.test(line), 'Unsupported WOFD price or adjustment line')
    names.push(line)
  }
  assert(names.length === 0 && roundingSign === undefined && taxSign === undefined, 'Incomplete WOFD item')
  const addressStart = lines.findIndex((line, i) => i > end && line.startsWith('г.'))
  const addressEnd = lines.findIndex((line, i) => i > addressStart && line.startsWith('ФДО:'))
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: lines.includes('Сату/Продажа') ? 'sale' : 'unknown',
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: date[4] },
    totalAmount: number(total),
    merchant: { name: lines.slice(0, tinIndex).join(' '), identifiers: [{ value: lines[tinIndex].replace('БСН/БИН ', ''), countryCode: 'KZ', scheme: 'BIN' }], ...(addressStart < 0 ? {} : { address: lines.slice(addressStart, addressEnd).join(' ') }) },
    items,
    payments: lines.slice(end).filter(line => line.startsWith('Банк картасы/Банковская карта:')).map(line => ({ method: 'card', amount: number(line.split(':')[1]) }))
  }
  assertReceipt(receipt)
  return receipt
}
