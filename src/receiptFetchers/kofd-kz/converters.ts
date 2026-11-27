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
    return decimal(str.replace(/\s/g, '').replace(/₸$/, '').replace(',', '.'))
  }
  let cardSum: string | null = null
  let bin: string | null = null
  let payee = ''
  let emptyStrPassed = false
  const items: ReceiptItem[] = []
  let nameStart: number | undefined
  for (const [i, text] of lines.entries()) {
    if (/^(?:\*+$|НДС\s|[GN]TIN:)/.test(text.trim())) nameStart = i + 1
    const match = text.match(/(\d+[,.]?\d*) *\([^)]+\) x ([^=]+)= *(.+)/)
    if (match !== null) {
      const nameLines = lines.slice(nameStart ?? i - 1, i)
      assert(nameLines.length > 0, 'Missing receipt item name')
      // In the fixed-width ticket a continued name fills the 46-column text field.
      const name = nameLines.map((line, index) => index < nameLines.length - 1 && line.length === 48 ? line.slice(0, 46) : line).join('')
      items.push({
        totalAmount: parseReceiptFloat(match[3]),
        name: name.replace('(шт)', '').trim(),
        unitPrice: parseReceiptFloat(match[2]),
        quantity: parseReceiptFloat(match[1])
      })
      nameStart = i + 1
    }
    if (cardSum == null) {
      const cardSumMatch = text.match(/Банковская карта:\s*(.+)/)
      cardSum = cardSumMatch !== null ? parseReceiptFloat(cardSumMatch[1]) : null
    }
    if (bin == null) {
      const binMatch = text.match(/БИН *(\d+)/)
      bin = binMatch !== null ? binMatch[1] : null
      emptyStrPassed = text.trim() === ''
    }
    if ((bin == null) && !emptyStrPassed) payee += text.trim().replace(/\s+/g, ' ')
  }
  const merchant: ReceiptMerchant = { ...optional('name', text(payee)) }
  if (bin != null) merchant.identifiers = [{ value: bin, countryCode: 'KZ', scheme: 'BIN' }]
  const receipt = {
    completeness: 'full',
    currency: 'KZT',
    operation: lines.some(line => line.trim() === 'Продажа') ? 'sale' : lines.some(line => line.trim() === 'Возврат продажи') ? 'refund' : 'unknown',
    issuedAt: fiscalDate(code),
    totalAmount: (sum != null) ? parseReceiptFloat(sum) : undefined,
    items,
    ...(cardSum != null ? { payments: [{ method: 'card', amount: cardSum }] } : {}),
    ...(Object.keys(merchant).length > 0 ? { merchant } : {})
  }
  assertReceipt(receipt)
  return receipt
}
