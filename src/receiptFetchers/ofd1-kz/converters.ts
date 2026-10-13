import type { Receipt, ReceiptItem, ReceiptMerchant, ReceiptDateTime, ReceiptPayment } from '../../types/receiptFetcher'
import _ from 'lodash'
import cheerio from 'cheerio'
import { decimal } from '../../common/decimal'
import { assertReceipt, fiscalDate, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (receiptHtml: unknown, code: string): Receipt {
  assert(typeof receiptHtml === 'string', 'Unexpected receipt payload')
  if (receiptHtml.length === 0) {
    throw new Error('Unexpected receipt payload')
  }

  function parseReceiptFloat (str: string): string {
    return decimal(str.replace(',', '.').replace(/\s/g, ''))
  }
  const $ = cheerio.load(receiptHtml, {
    normalizeWhitespace: true,
    xmlMode: false
  })

  let sum
  const cardSumMatch = receiptHtml.match(/Карта: ([\d\s]*[.,]\d*)/)
  const cardSum = (cardSumMatch != null) && ((cardSumMatch[1]?.length ?? 0) > 0) ? parseReceiptFloat(cardSumMatch[1]) : null
  try {
    const match = code.match(/s=([^&]+)/)
    assert(match !== null, 'Missing code total')
    sum = match[1]
  } catch (e) {
    const total = $.root().text().match(/ИТОГО:?\s*([\d\s.,]+)/)
    sum = (total != null) ? total[1] : null
  }
  const payee = $('body > div.container.mt-2 > div > div > main > div.ready_ticket.tickets_data_for_print > div.ticket_header > div:nth-child(1) > span').text().trim()
  const binMatch = receiptHtml.match(/БИН\D+(\d+)/)
  const bin = (binMatch != null) && (binMatch.length !== 0) ? binMatch[1] : ''
  const issuedAt: Partial<ReceiptDateTime> = fiscalDate(code)
  const merchant: ReceiptMerchant = { ...optional('name', text(payee)) }
  const items: ReceiptItem[] = []
  const totalAmount: string | undefined = (sum != null) ? parseReceiptFloat(sum) : undefined
  let payments: ReceiptPayment[] | undefined
  const itemsHtml = $('body > div.container.mt-2 > div > div > main > div.ready_ticket.tickets_data_for_print > div.ticket_body > ol').children()
  _.times(itemsHtml.length, (i) => {
    const name = $(itemsHtml[i]).children().first().text().trim()
    const infoNode = $(itemsHtml[i]).children('div').children('b')[0]?.next
    const info = infoNode != null
      ? $(infoNode).text().trim()
      : ''
    const infoMatch = info.match(/^([\s\d.]+)\s*x\s*([\d.]+)[^=]*=\s*([\s\d.]+)/)
    if (infoMatch !== null) {
      items.push({ name, totalAmount: parseReceiptFloat(infoMatch[3]), unitPrice: parseReceiptFloat(infoMatch[1]), quantity: parseReceiptFloat(infoMatch[2]) })
    }
  })
  if (cardSum != null) payments = [{ method: 'card', amount: cardSum }]
  if ((bin.length > 0)) {
    merchant.identifiers = [{ value: bin, countryCode: 'KZ' }]
  }
  const receipt = {
    completeness: 'full',
    currency: 'KZT',
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
