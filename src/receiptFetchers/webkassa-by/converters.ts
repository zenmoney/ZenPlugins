import type { Receipt, ReceiptItem } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt } from '../../common/receiptFetcher/receipt'

const localizedAmount = '[0-9]+(?:[ \\u00a0][0-9]{3})*,[0-9]{2}'
const localizedItem = new RegExp(`^(\\d+,\\d+) x (${localizedAmount})\\s+(${localizedAmount})$`)
const localizedTotal = new RegExp(`^ИТОГО К ОПЛАТЕ:\\s+(${localizedAmount})$`)
const localizedCardPayment = new RegExp(`^БП Карта:\\s+(${localizedAmount})$`)
const parseAmount = (value: string): string => decimal(value.replace(/[ \u00a0]/g, '').replace(',', '.'))

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected Webkassa PDF text')
  const lines = source.split('\n').map(line => line.trim()).filter(line => line !== '' && line !== '____')
  const header = lines.findIndex(line => /^(?:N|No) док\. \d+$/.test(line))
  const unpIndex = lines.findIndex(line => /^УНП\s+\d{9}$/.test(line))
  const unp = lines[unpIndex]?.match(/\d{9}/)?.[0]
  const uid = lines.find(line => /^УИ:?\s+[A-Fa-f0-9]{24}$/.test(line))?.slice(-24)

  const localized = unpIndex >= 3 && header > unpIndex &&
    /^РН СККО\s+\d+$/.test(lines[unpIndex + 1]) && lines[header - 1] === 'Платежный документ'
  const totalPattern = localized ? localizedTotal : /^ИТОГО К ОПЛАТЕ\s+([\d.]+)$/
  const totalIndex = lines.findIndex(line => totalPattern.test(line))
  assert(header > 0 && totalIndex > header && unp !== undefined && uid !== undefined, 'Incomplete Webkassa receipt')
  // The localized SKKO retail form prints local-currency prices without a suffix
  // (Belarus retail rules, Resolution No. 703, para. 19). Amount patterns for this
  // form are limited to unsuffixed amounts; the legacy form still requires BYN.
  assert(localized || source.includes('BYN'), 'Missing Webkassa receipt currency')

  const timestamp = localized
    ? source.match(/(?:^|\n)Дата и время:\s+(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}:\d{2}:\d{2})/)
    : source.match(/(?:^|\n)(\d{2})\.(\d{2})\.(\d{2})\s+(\d{2}:\d{2}:\d{2})/)
  assert(timestamp !== null, 'Missing Webkassa receipt timestamp')
  const year = localized
    ? timestamp[3]
    : source.match(new RegExp(`${timestamp[1]}\\.${timestamp[2]}\\.(\\d{2}${timestamp[3]})\\s+\\d{2}:\\d{2}:\\d{2}`))?.[1]
  assert(year !== undefined, 'Missing unambiguous Webkassa calendar year')

  const itemPattern = localized ? localizedItem : /^([\d.]+) \* ([\d.]+)\s+([\d.]+)$/
  const items: ReceiptItem[] = []
  let name: string[] = []
  for (const line of lines.slice(header + 1, totalIndex)) {
    if (/^-+$/.test(line)) continue
    const quote = line.match(itemPattern)
    if (quote !== null) {
      assert(name.length > 0, 'Missing Webkassa item name')
      items.push({ name: name.join(' '), quantity: parseAmount(quote[1]), unitPrice: parseAmount(quote[2]), totalAmount: parseAmount(quote[3]) })
      name = []
    } else {
      assert(!/^(?:Скидка|Наценка|НДС)|^[\d.,]+\s*[*×x]/i.test(line), 'Unsupported Webkassa item row')
      name.push(line)
    }
  }
  assert(name.length === 0, 'Incomplete Webkassa item')
  const total = lines[totalIndex].match(totalPattern)?.[1]
  assert(total !== undefined, 'Missing Webkassa receipt total')
  const cardPattern = localized ? localizedCardPayment : /^Банковская карта\s+([\d.]+)$/
  const payments = lines.slice(totalIndex + 1)
    .map(line => line.match(cardPattern))
    .flatMap(match => match === null ? [] : [{ method: 'card' as const, amount: parseAmount(match[1]) }])
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'BYN',
    operation: source.includes('ОПЛАТА') ? 'sale' : 'unknown',
    id: uid,
    issuedAt: { date: `${year}-${timestamp[2]}-${timestamp[1]}`, time: timestamp[4] },
    totalAmount: parseAmount(total),
    merchant: {
      name: lines[0],
      address: localized ? lines.slice(2, unpIndex).join(', ') : lines[1],
      identifiers: [{ value: unp, countryCode: 'BY', scheme: 'UNP' }]
    },
    items,
    payments
  }
  // Bonus accrual/balance and the repeated terminal slip are not extra settlement contributions.
  assertReceipt(receipt)
  return receipt
}
