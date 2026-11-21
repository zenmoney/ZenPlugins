import type { Receipt, ReceiptItem, ReceiptMerchant, ReceiptDateTime, ReceiptPayment, ReceiptPaymentMethod } from '../../types/receiptFetcher'
import cheerio from 'cheerio'
import { add, decimal } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'

// Payment labels of the Serbian TaxCore journal. Cheques and vouchers have no exact Receipt method.
const PAYMENT_METHODS: Record<string, ReceiptPaymentMethod | undefined> = {
  Готовина: 'cash',
  'Платна картица': 'card',
  'Пренос на рачун': 'cashless',
  'Инстант плаћање': 'cashless',
  'Друго безготовинско плаћање': 'cashless',
  Чек: 'other',
  Ваучер: 'other'
}

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
  const parts = body.split(/Касир:[^\r\n]*\r?\n/)
  assert(parts.length === 2, 'Expected receipt cashier line')
  const baseInfoStrings = parts[0].split(/\n/).map(str => str.trim()).filter(str => str.length > 0)
  const detailInfoStrings = parts[1].split(/\n/)
  const issuedAt: Partial<ReceiptDateTime> = {}
  const merchant: ReceiptMerchant = {
    ...optional('name', text(baseInfoStrings[1])),
    ...(baseInfoStrings.length >= 5 ? { address: baseInfoStrings.slice(-2).join(' ') } : {})
  }
  const items: ReceiptItem[] = []
  const itemSection = parts[1].match(/(Назив[^\r\n]*)\r?\n([\s\S]*?)\r?\n-{3,}/)
  assert(itemSection !== null, 'Expected receipt item section')
  // The journal is printed in fixed-width columns: a long name wraps at the column width,
  // sometimes mid-word. A filled line keeps its last character (a space at a word boundary).
  const width = itemSection[1].length
  let nameParts: string[] = []
  for (const line of itemSection[2].split(/\r?\n/)) {
    const itemMatch = line.match(/^\s*([\d.]+,\d{2})\s+([\d.,]+)\s+([\d.]+,\d{2})\s*$/)
    if (itemMatch === null) {
      nameParts.push(line)
      continue
    }
    assert(nameParts.length > 0, 'Expected receipt item name')
    items.push({
      name: nameParts.map((part, i) => i < nameParts.length - 1 && part.length >= width ? part : part.trimEnd()).join('').trim(),
      unitPrice: convertFloat(itemMatch[1]),
      quantity: decimal(itemMatch[2].replace(',', '.')),
      totalAmount: convertFloat(itemMatch[3])
    })
    nameParts = []
  }
  assert(nameParts.length === 0, 'Unparsed receipt item lines')
  let totalAmount: string | undefined
  const tenders: ReceiptPayment[] = []
  detailInfoStrings.forEach(string => {
    const sumMatch = string.match(/купан износ:\s*([\d.,]+)/)
    if ((sumMatch != null) && ((sumMatch[1]?.length ?? 0) > 0)) {
      totalAmount = convertFloat(sumMatch[1])
    }
    const paymentMatch = string.match(/^\s*([^:]+?):\s*([\d.]+,\d{2})\s*$/)
    const method = paymentMatch === null ? undefined : PAYMENT_METHODS[paymentMatch[1]]
    if (paymentMatch !== null && method !== undefined) {
      tenders.push({ method, amount: convertFloat(paymentMatch[2]), ...(method === 'other' ? { name: paymentMatch[1] } : {}) })
    }
    // The hour is printed without a leading zero before 10:00, e.g. "21.11.2026. 7:05:09".
    const dateTimeMatch = string.match(/ПФР време:\s*(\d{2})\.(\d{2})\.(\d{4})\.?\s+(\d{1,2}):(\d{2}):(\d{2})/)
    if (dateTimeMatch != null) {
      issuedAt.date = `${dateTimeMatch[3]}-${dateTimeMatch[2]}-${dateTimeMatch[1]}`
      issuedAt.time = `${dateTimeMatch[4].padStart(2, '0')}:${dateTimeMatch[5]}:${dateTimeMatch[6]}`
    }
  })
  // Cash is printed as tendered, before change. It is applied cash only when the printed
  // tenders add up to the total; otherwise only the non-cash tenders are known settlements.
  const tenderSum = tenders.reduce((sum, { amount }) => add(sum, amount), '0')
  const settled = tenderSum === totalAmount ? tenders : tenders.filter(({ method }) => method !== 'cash')
  const payments = settled.length > 0 ? settled : undefined
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
