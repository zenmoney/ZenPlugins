import type { Receipt, ReceiptItem } from '../../types/receiptFetcher'
import cheerio from 'cheerio'
import { decimal, add, subtract, divideExact } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (html: unknown): Receipt {
  assert(typeof html === 'string', 'Unexpected receipt payload')
  const $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: false
  })
  const abc = 'body > div > table > tbody > tr > td > div > div:nth-child(1) > table > tbody > '
  let sum
  let cashSum
  let cardSum
  const payee = $(abc + 'tr:nth-child(2) > td > h3').text().trim()
  const inn = $(abc + 'tr:nth-child(2) > td > i').text().trim()
  const address = $(abc + 'tr:nth-child(2) > td').text().replace(payee, '').replace(inn, '').trim()
  if (!(address.length > 0)) {
    throw new Error('unexpected receipt')
  }
  let dateTime
  for (const i of [7, 8, 9, 4, 5, 6]) {
    dateTime = $(abc + `tr:nth-child(${i}) > td > i`).text().trim().match(/(\d{2}.\d{2}.\d{4})(, (\d{2}:\d{2}))?/)
    cashSum = $(abc + `tr:nth-child(${i + 2}) > td:nth-child(2)`).text().replace(/,/g, '').trim()
    cardSum = $(abc + `tr:nth-child(${i + 3}) > td:nth-child(2)`).text().replace(/,/g, '').trim()
    for (const j of [i + 5, i + 4]) {
      const rowName = $(abc + `tr:nth-child(${j}) > td:nth-child(1)`).text().replace(/,/g, '').trim()
      if ((rowName.length > 0) && !rowName.toLowerCase().includes('Umumiy QQS qiymati'.toLowerCase())) {
        sum = $(abc + `tr:nth-child(${j}) > td:nth-child(2)`).text().replace(/,/g, '').trim()
      }
    }
    if (dateTime != null) {
      break
    }
  }
  if (dateTime == null) {
    throw new Error('unexpected receipt')
  }
  const items: ReceiptItem[] = []
  const nodes = $('.products-row').toArray()
  const other = $('.nds-row').next().not('.nds-row').toArray()
  for (let i = 0; i <= nodes.length - 1; i++) {
    const name = $('td:nth-child(1)', nodes[i]).text().replace('<А>', '').trim()
    const quantityText = $('td:nth-child(2)', nodes[i]).text().trim().replace(/,/g, '')
    assert(quantityText.length > 0, 'Missing item quantity')
    const quantityParts = quantityText.match(/^(\d+(?:\.\d+)?)([^\d]*)$/)
    assert(quantityParts !== null, 'Invalid item quantity')
    const quantity = decimal(quantityParts[1])
    const sum = decimal($('td.price-sum', nodes[i]).text().trim().replace(/,/g, ''))
    if (name.length === 0 || quantity === '0') {
      throw new Error('unexpected receipt')
    }
    const discounts = $('td:nth-child(2)', other[i]).text().trim().match(/([\d.]+)\/([\d.]+)/)
    const finalSum = subtract(sum, (discounts != null) ? add(discounts[1], discounts[2]) : 0)
    const item: ReceiptItem = {
      name,
      ...optional('unit', text(quantityParts[2])),
      totalAmount: finalSum,
      ...optional('unitPrice', divideExact(finalSum, quantity)),
      quantity
    }
    if (discounts != null) {
      const discount = add(discounts[1], discounts[2])
      if (discount !== '0') {
        item.originalTotalAmount = sum
        Object.assign(item, optional('originalUnitPrice', divideExact(sum, quantity)))
        item.adjustments = [
          ...(decimal(discounts[1]) === '0' ? [] : [{ kind: 'discount' as const, amount: subtract(0, discounts[1]) }]),
          ...(decimal(discounts[2]) === '0' ? [] : [{ kind: 'other' as const, amount: subtract(0, discounts[2]) }])
        ]
      }
    }
    items.push(item)
  }
  assert(payee.length > 0 && address.length > 0, 'Missing receipt merchant')
  assert(sum !== undefined && cashSum !== undefined && cardSum !== undefined, 'Missing receipt totals')
  const receipt = {
    completeness: 'full',
    currency: 'UZS',
    operation: 'unknown',
    merchant: {
      name: payee,
      address,
      ...((inn.length > 0) ? { identifiers: [{ value: inn, countryCode: 'UZ' }] } : {})
    },
    issuedAt: {
      date: dateTime[1].replace(/(\d+).(\d+).(\d+)/, '$3-$2-$1'),
      ...optional('time', dateTime[3])
    },
    totalAmount: decimal(sum.replace(/,/g, '')),
    payments: [
      { method: 'cash', amount: decimal(cashSum.replace(/,/g, '')) },
      { method: 'card', amount: decimal(cardSum.replace(/,/g, '')) }
    ],
    items
  }
  assertReceipt(receipt)
  return receipt
}
