import { load } from 'cheerio'
import get from '../../types/get'
import type { Receipt } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt, localDateTime, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected Kaspi receipt HTML')
  const $ = load(source)
  const script = $('#__NUXT_DATA__').html()
  assert(script !== null && script !== '', 'Missing Kaspi receipt hydration data')
  const pool: unknown = JSON.parse(script)
  assert(Array.isArray(pool), 'Invalid Kaspi receipt data pool')
  const dereference = (index: unknown): unknown => { assert(typeof index === 'number' && Number.isInteger(index) && index >= 0 && index < pool.length, 'Invalid Kaspi field reference'); return pool[index] }
  const field = (object: unknown, key: string): unknown => dereference(get(object, key))
  const receipts = pool.filter((entry: unknown) => get(entry, 'cartItems') !== undefined)
  assert(receipts.length === 1, 'Missing or ambiguous Kaspi receipt')
  const receiptData = receipts[0]
  assert(field(receiptData, 'currency') === '₸' && field(receiptData, 'header') === 'Фискальный чек', 'Unsupported Kaspi receipt')
  const items = field(receiptData, 'cartItems'); const params = field(receiptData, 'payParameters')
  assert(Array.isArray(items) && Array.isArray(params), 'Missing Kaspi items or receipt parameters')
  const parameter = (type: string, attribute: 'value' | 'type' = 'value'): string | undefined => {
    const values = params.map(dereference).filter(row => field(row, 'name') === type)
    assert(values.length <= 1, 'Ambiguous Kaspi receipt parameter')
    if (values.length === 0 || (attribute === 'type' && get(values[0], attribute) === undefined)) return undefined
    return text(field(values[0], attribute))
  }
  const amount = text(field(receiptData, 'amount')); const timestamp = text(field(receiptData, 'saleDate'))
  assert(amount !== undefined && timestamp !== undefined, 'Missing Kaspi total or timestamp')
  const tin = parameter('ИИН/БИН продавца')
  const tinType = parameter('ИИН/БИН продавца', 'type')
  const scheme = tinType === 'bin' ? 'BIN' : tinType === 'iin' ? 'IIN' : 'IIN/BIN'
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: field(receiptData, 'cartHeader') === 'Продажа' ? 'sale' : 'unknown',
    issuedAt: localDateTime(timestamp.replace(' ', 'T')),
    totalAmount: decimal(amount.replace(/\s/g, '')),
    merchant: { ...optional('name', text(field(receiptData, 'title'))), ...optional('address', text(field(receiptData, 'address'))), ...(tin === undefined ? {} : { identifiers: [{ value: tin, countryCode: 'KZ', scheme }] }) },
    items: items.map((index: unknown) => {
      const item = dereference(index); const tax = field(item, 'nds_raw')
      return {
        name: text(field(item, 'item_name')) ?? '',
        quantity: decimal(field(item, 'quantity')),
        unitPrice: decimal(field(item, 'item_price')),
        totalAmount: decimal(field(item, 'sum')),
        ...optional('unit', text(field(item, 'unit_name'))),
        ...(tax == null ? {} : { adjustments: [{ kind: 'tax' as const, name: 'НДС', amount: decimal(field(tax, 'amount')), percent: decimal(field(tax, 'percent')) }] })
      }
    }),
    ...(parameter('Оплачено') === 'Картой' ? { payments: [{ method: 'card' as const, amount: decimal(amount.replace(/\s/g, '')) }] } : {})
  }
  // Keep rounded source line amounts (e.g. 99 * 0.77 -> 76), without rebalancing.
  assertReceipt(receipt)
  return receipt
}
