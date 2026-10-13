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
  const body = $('body > table > tbody').children()
  if (body.length === 0) {
    throw new Error('Unexpected receipt payload')
  }
  const issuedAt: Partial<ReceiptDateTime> = {}
  const merchant: ReceiptMerchant = {}
  const items: ReceiptItem[] = []
  let totalAmount: string | undefined
  let payments: ReceiptPayment[] | undefined
  _.times(body.length, (i) => {
    const title = $(body[i]).children().first().children().first().text()
    const value = $(body[i]).children().first().next().text()
    if (i === 0 && !(value.length > 0)) {
      merchant.name = title
    } else if (i === 2 && !(value.length > 0)) {
      merchant.address = title
    }
    if ((title.length > 0) && (value.length > 0) && /\s*x\s*/i.test(value)) {
      const match = value.match(/(\d+\.\d{1,3})\sx\s(\d+\.?\d*)/i)
      const amountMatch = $(body[i + 1]).children().first().next().text().trim().match(/\d+\.\d{1,3}/)
      assert(amountMatch !== null, 'Missing receipt line amount')
      assert(match !== null, 'Missing receipt item details')
      const sum = amountMatch[0]
      items.push({
        totalAmount: decimal(sum),
        name: title.trim(),
        unitPrice: decimal(match[2]),
        quantity: decimal(match[1])
      })
    }
    if (/total/i.test(title) && (value.length > 0)) {
      totalAmount = decimal(value.trim())
    }
    if (/card/i.test(title) && (value.length > 0)) {
      payments = [{ method: 'card', amount: decimal(value.trim()) }]
    }
    const dateMatch = (title.length > 0) && (issuedAt.date == null) ? title.match(/data\s*(\d{2})\.(\d{2})\.(\d{4})/i) : null
    issuedAt.date = (dateMatch != null) ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : issuedAt.date

    const timeMatch = (value.length > 0) && (issuedAt.time == null) ? value.match(/ora\s*(\d{2}:\d{2}:\d{2})/i) : null
    issuedAt.time = (timeMatch != null) && ((timeMatch[1]?.length ?? 0) > 0) ? timeMatch[1] : issuedAt.time
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
