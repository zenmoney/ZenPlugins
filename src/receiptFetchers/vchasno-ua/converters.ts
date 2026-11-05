import { load } from 'cheerio'
import type { Receipt, ReceiptItem } from '../../types/receiptFetcher'
import { add, decimal, divideExact } from '../../common/decimal'
import { assertReceipt, optional } from '../../common/receiptFetcher/receipt'

export function convertReceipt (source: unknown): Receipt {
  assert(typeof source === 'string', 'Expected Vchasno receipt HTML')
  const $ = load(source)
  const check = $('.check')
  assert(check.length === 1 && check.text().includes('ФІСКАЛЬНИЙ'), 'Missing fiscal receipt')
  const rows = check.children('table').first().find('tr').toArray()
  const items: ReceiptItem[] = []
  let item: ReceiptItem | undefined
  for (const row of rows) {
    const cells = $(row).children('td')
    const left = cells.eq(0).text().trim()
    const quote = left.match(/^(\d+(?:\.\d+)?) x (\d+(?:\.\d+)?)$/)
    if (quote !== null) {
      if (item !== undefined) items.push(item)
      item = { name: '', quantity: decimal(quote[1]), unitPrice: decimal(quote[2]), totalAmount: '' }
    } else if (cells.eq(0).find('b').length > 0) {
      assert(item !== undefined && item.name === '', 'Unexpected receipt product row')
      item.name = cells.eq(0).find('b').text().trim()
      item.totalAmount = decimal(cells.eq(2).find('b').text().trim())
    } else if (left === 'Знижка') {
      assert(item !== undefined && item.totalAmount !== '', 'Unexpected receipt discount')
      const discount = cells.eq(2).text().trim().match(/^(-\d+(?:\.\d+)?)(?:\s|$)/)
      assert(discount !== null, 'Invalid receipt discount')
      item.originalTotalAmount = item.totalAmount
      item.originalUnitPrice = item.unitPrice
      item.totalAmount = add(item.totalAmount, discount[1])
      delete item.unitPrice
      Object.assign(item, optional('unitPrice', divideExact(item.totalAmount, item.quantity)))
      item.adjustments = [{ kind: 'discount', amount: decimal(discount[1]), name: left }]
    } else {
      assert(left === '' || left === 'УКТЗЕД', 'Unsupported receipt item row')
    }
  }
  if (item !== undefined) items.push(item)
  const content = check.text().replace(/\s+/g, ' ')
  const date = content.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2})-(\d{2})-(\d{2})/)
  const id = content.match(/ЧЕК № ([A-Za-z0-9_-]+)/)?.[1]
  const tin = check.find('.header').text().match(/ПН\s+(\d+)/)?.[1]
  assert(date !== null && id !== undefined, 'Missing receipt identity or timestamp')
  const amount = (value: string): string => {
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s+грн\.$/)
    assert(match !== null, 'Invalid receipt currency or amount')
    return decimal(match[1])
  }
  const receipt: Receipt = {
    completeness: 'full',
    currency: 'UAH',
    operation: content.includes('Вид операції Оплата') ? 'sale' : 'unknown',
    id,
    issuedAt: { date: `${date[3]}-${date[2]}-${date[1]}`, time: `${date[4]}:${date[5]}:${date[6]}` },
    totalAmount: amount(check.find('table.sum td').last().text()),
    merchant: { name: check.find('.header h4').text().trim(), address: check.find('.header p').eq(1).text().trim(), ...(tin === undefined ? {} : { identifiers: [{ value: tin, countryCode: 'UA', scheme: 'PN' }] }) },
    items,
    payments: check.children('table').eq(1).find('tr').toArray().filter(row => /^(?:Картка|Готівка)$/.test($(row).children('td').first().text().trim())).map(row => ({
      method: $(row).children('td').first().text().trim() === 'Картка' ? 'card' : 'cash', amount: amount($(row).children('td').last().text())
    }))
  }
  // Printed VAT is a summary of item-inclusive tax; no duplicate root adjustment.
  assertReceipt(receipt)
  return receipt
}
