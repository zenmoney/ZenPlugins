import get from '../../types/get'
import type { Receipt, ReceiptItem, ReceiptMerchant } from '../../types/receiptFetcher'
import { decimal } from '../../common/decimal'
import { assertReceipt, fiscalDate, optional, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (data: unknown, code: string): Receipt {
  assert(Array.isArray(data) && data.length > 0, 'Unexpected receipt payload')
  const lines = data.map((item: unknown) => {
    const text = get(item, 'text')
    assert(typeof text === 'string', 'Invalid receipt line')
    return text
  })
  const codeSum = code.match(/s=([^&]+)/)
  const sumRegExp = /ИТОГО:? *(.+)/
  const sumLine = codeSum === null ? lines.find(line => sumRegExp.test(line)) : undefined
  const sum = codeSum !== null ? codeSum[1] : sumLine?.replace(/\s/g, '').match(sumRegExp)?.[1]
  function parseReceiptFloat (str: string): string {
    return decimal(str.replace(',', '.').replace(/\s/g, ''))
  }
  let cardSum: string | null = null
  let bin: string | null = null
  let payee = ''
  let emptyStrPassed = false
  const items: ReceiptItem[] = []
  for (const [i, text] of lines.entries()) {
    const match = text.match(/(\d+[,.]?\d*) *\([^)]+\) x ([^= ]+)[^=]+= *(.+)/)
    if (match !== null) {
      assert(i > 0, 'Missing receipt item name')
      items.push({
        totalAmount: parseReceiptFloat(match[3].replace(/[^\d.,]/, '')),
        name: lines[i - 1].replace('(шт)', '').trim(),
        unitPrice: parseReceiptFloat(match[2].replace(/[^\d.,]/, '')),
        quantity: parseReceiptFloat(match[1])
      })
    }
    if (cardSum == null) {
      const cardSumMatch = text.match(/Банковская карта:\s*(.+)/)
      cardSum = cardSumMatch !== null ? parseReceiptFloat(cardSumMatch[1].replace(/[^\d.,]/, '')) : null
    }
    if (bin == null) {
      const binMatch = text.match(/БИН *(\d+)/)
      bin = binMatch !== null ? binMatch[1] : null
      emptyStrPassed = text.trim() === ''
    }
    if ((bin == null) && !emptyStrPassed) payee += text.trim().replace(/\s+/g, ' ')
  }
  const merchant: ReceiptMerchant = { ...optional('name', text(payee)) }
  if (bin != null) merchant.identifiers = [{ value: bin, countryCode: 'KZ' }]
  const receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: 'unknown',
    issuedAt: fiscalDate(code),
    totalAmount: (sum != null) ? parseReceiptFloat(sum) : undefined,
    items,
    ...(cardSum != null ? { payments: [{ method: 'card', amount: cardSum }] } : {}),
    ...(Object.keys(merchant).length > 0 ? { merchant } : {})
  }
  assertReceipt(receipt)
  return receipt
}
