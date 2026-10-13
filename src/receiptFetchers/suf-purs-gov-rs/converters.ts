import type { Receipt, ReceiptItem, ReceiptMerchant, ReceiptDateTime, ReceiptPayment } from '../../types/receiptFetcher'
import cheerio from 'cheerio'
import { decimal } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'

function convertFloat (str: string): string {
  return decimal(str.replace(/\./g, '').replace(',', '.'))
}

export function convertReceipt (html: unknown): Receipt {
  assert(typeof html === 'string', 'Unexpected receipt payload')
  const $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: false
  })
  let body = $('body > div > div > form > div:nth-child(4)').children().text()
  if (body.length === 0) {
    throw new Error('Unexpected receipt payload')
  }
  body = body.split(/=*\s*ФИСКАЛНИ РАЧУН\s*=*/i)[1]
  const parts = body.split(/Касир:\s*\d+/)
  const baseInfoStrings = parts[0].split(/\n/).map(str => str.trim())
  const detailInfoStrings = parts[1].split(/\n/)
  const issuedAt: Partial<ReceiptDateTime> = {}
  const merchant: ReceiptMerchant = { ...optional('name', text(baseInfoStrings[2])), ...(((baseInfoStrings[4]?.length ?? 0) > 0) && ((baseInfoStrings[5]?.length ?? 0) > 0) ? { address: `${baseInfoStrings[4]} ${baseInfoStrings[5]}` } : {}) }
  const items: ReceiptItem[] = []
  let totalAmount: string | undefined
  let payments: ReceiptPayment[] | undefined
  detailInfoStrings.forEach((string, index) => {
    const itemMatch = string.match(/\s*(\d+,\d{2})\s*([\d.]+[.,]?\d*)\s*([\d.]+,\d{2})/)
    if ((itemMatch != null) && ((detailInfoStrings[index - 1]?.length ?? 0) > 0)) {
      items.push({
        totalAmount: convertFloat(itemMatch[3]),
        name: detailInfoStrings[index - 1].trim(),
        unitPrice: convertFloat(itemMatch[1]),
        quantity: decimal(itemMatch[2].replace(',', '.'))
      })
    }
    const sumMatch = string.match(/купан износ:\s*([\d.,]+)/)
    if ((sumMatch != null) && ((sumMatch[1]?.length ?? 0) > 0)) {
      totalAmount = convertFloat(sumMatch[1])
    }
    const cardMatch = string.match(/латна картица:\s*([\d.,]+)/)
    if ((cardMatch != null) && ((cardMatch[1]?.length ?? 0) > 0)) {
      payments = [{ method: 'card', amount: convertFloat(cardMatch[1]) }]
    }
    const dateTimeMatch = string.match(/(\d{2}).(\d{2}).(\d{4}).?\s((\d{2}:?){3})/)
    if (dateTimeMatch != null) {
      issuedAt.date = `${dateTimeMatch[3]}-${dateTimeMatch[2]}-${dateTimeMatch[1]}`
      issuedAt.time = dateTimeMatch[4]
    }
  })
  const receipt = {
    completeness: 'full',
    currency: 'RSD',
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
