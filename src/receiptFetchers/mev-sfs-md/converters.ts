import type { Receipt, ReceiptItem, ReceiptMerchant, ReceiptDateTime, ReceiptPayment } from '../../types/receiptFetcher'
import _ from 'lodash'
import cheerio from 'cheerio'
import { decimal } from '../../common/decimal'
import { assertReceipt, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (html: unknown): Receipt {
  assert(typeof html === 'string', 'Unexpected receipt payload')
  const $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: false
  })
  const body = $('body > main > section > div > div > form > div > div').children()
  if (body.length === 0) {
    throw new Error('Unexpected receipt payload')
  }
  const issuedAt: Partial<ReceiptDateTime> = {}
  const merchant: ReceiptMerchant = {}
  const items: ReceiptItem[] = []
  let totalAmount: string | undefined
  let payments: ReceiptPayment[] | undefined
  _.times(body.length, (i) => {
    const text = $(body[i]).text()
    if (i === 0) {
      merchant.name = text.trim()
    } else if (i === 2) {
      merchant.address = text.trim()
    } else if (/total/i.test($(body[i]).text())) {
      totalAmount = decimal(text.replace(/total/i, '').trim())
    } else if (/card/i.test($(body[i]).text())) {
      payments = [{ method: 'card', amount: decimal(text.replace(/card/i, '').trim()) }]
    } else if (/data/i.test($(body[i]).text())) {
      const match = text.match(/(\d{2}).(\d{2}).(\d{4})\D+((\d{2}:?){3})/)
      if (match != null) {
        issuedAt.date = `${match[3]}-${match[2]}-${match[1]}`
        issuedAt.time = match[4]
      }
    } else {
      const match = text.match(/(\d+-)?(\D+)(\d+\.\d{2,3})\s?x\s?(\d+\.\d{2,3})/)
      if (match != null) {
        items.push({
          totalAmount: decimal($(body[i + 1]).text().replace('A', '').trim()),
          name: match[2].trim(),
          unitPrice: decimal(match[4]),
          quantity: decimal(match[3])
        })
      }
    }
  })
  merchant.name = text(merchant.name)
  merchant.address = text(merchant.address)
  if (merchant.name === undefined) delete merchant.name
  if (merchant.address === undefined) delete merchant.address
  const receipt = {
    completeness: 'full',
    currency: 'MDL',
    operation: 'unknown',
    issuedAt,
    items,
    totalAmount,
    ...(Object.keys(merchant).length > 0 ? { merchant } : {}),
    ...(payments !== undefined ? { payments } : {})
  }
  assertReceipt(receipt)
  return receipt
}
