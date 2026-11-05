import type { Receipt, ReceiptItem } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt } from '../../common/receiptFetcher/receipt'

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected Webkassa PDF text')
  const lines = source.split('\n').map(line => line.trim()).filter(Boolean)
  const totalIndex = lines.findIndex(line => /^ИТОГО К ОПЛАТЕ\s+[\d.]+$/.test(line))
  const header = lines.findIndex(line => /^N док\. \d+$/.test(line))
  const unp = source.match(/УНП (\d{9})/)?.[1]
  const uid = source.match(/УИ ([A-F0-9]{24})/)?.[1]
  const timestamp = source.match(/(?:^|\n)(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2}:\d{2}:\d{2})/)
  assert(header > 0 && totalIndex > header && unp !== undefined && uid !== undefined && timestamp !== null && source.includes('BYN'), 'Incomplete Webkassa receipt')
  const fullDate = source.match(new RegExp(`${timestamp[1]}\\.${timestamp[2]}\\.(\\d{2}${timestamp[3]})\\s+\\d{2}:\\d{2}:\\d{2}`))
  assert(fullDate !== null, 'Missing unambiguous Webkassa calendar year')
  const items: ReceiptItem[] = []
  let name: string[] = []
  for (const line of lines.slice(header + 1, totalIndex)) {
    if (/^-+$/.test(line)) continue
    const quote = line.match(/^([\d.]+) \* ([\d.]+)\s+([\d.]+)$/)
    if (quote !== null) {
      assert(name.length > 0, 'Missing Webkassa item name')
      items.push({ name: name.join(' '), quantity: decimal(quote[1]), unitPrice: decimal(quote[2]), totalAmount: decimal(quote[3]) })
      name = []
    } else {
      assert(!/^(?:Скидка|Наценка|НДС)|^[\d.,]+\s*[*×]/i.test(line), 'Unsupported Webkassa item row')
      name.push(line)
    }
  }
  assert(name.length === 0, 'Incomplete Webkassa item')
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'BYN',
    operation: source.includes('ОПЛАТА') ? 'sale' : 'unknown',
    id: uid,
    issuedAt: { date: `${fullDate[1]}-${timestamp[2]}-${timestamp[1]}`, time: timestamp[4] },
    totalAmount: decimal(lines[totalIndex].replace(/^ИТОГО К ОПЛАТЕ\s+/, '')),
    merchant: { name: lines[0], address: lines[1], identifiers: [{ value: unp, countryCode: 'BY', scheme: 'UNP' }] },
    items,
    payments: lines.slice(totalIndex + 1).filter(line => /^Банковская карта\s+[\d.]+$/.test(line)).map(line => ({ method: 'card', amount: decimal(line.replace(/^Банковская карта\s+/, '')) }))
  }
  // Bonus accrual/balance and the repeated terminal slip are not extra settlement contributions.
  assertReceipt(receipt)
  return receipt
}
