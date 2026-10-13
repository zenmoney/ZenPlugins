import type { Receipt, ReceiptItem, ReceiptMerchant, ReceiptDateTime } from '../../types/receiptFetcher'
import { decimal, add } from '../../common/decimal'
import { assertReceipt, text } from '../../common/receiptFetcher/receipt'

export function convertReceipt (html: unknown): Receipt {
  assert(typeof html === 'string', 'Unexpected receipt payload')
  if (html.length === 0) {
    throw new Error('Unexpected receipt payload')
  }
  const dateTimeMatch = html.match(/Дата: (\d{2}).(\d{2}).(\d{4})\s*((\d{2}:?){3})/)
  assert(dateTimeMatch !== null, 'Missing receipt date')
  const issuedAt: Partial<ReceiptDateTime> = { date: `${dateTimeMatch[3]}-${dateTimeMatch[2]}-${dateTimeMatch[1]}`, time: dateTimeMatch[4] }
  const merchant: ReceiptMerchant = {}
  const items: ReceiptItem[] = []
  let totalAmount = '0'
  const parts = html.split('<h2>')
  for (const part of parts) {
    if (part.includes('Магазин</h2>')) {
      const payeeMatch = part.match(/Магазин<\/[^>]+>[^<]+<div[^>]+>\s*Название:([^<]+)/)
      merchant.name = (payeeMatch != null) && ((payeeMatch[1]?.length ?? 0) > 0) ? payeeMatch[1].trim() : undefined
      const innMatch = part.match(/ИНН:\s*(\d+)/)
      if (innMatch != null) merchant.identifiers = [{ value: innMatch[1], countryCode: 'RU', scheme: 'INN' }]
      const addressMatch = part.match(/Адрес:\s*([^<]+)/)
      merchant.address = (addressMatch != null) && ((addressMatch[1]?.length ?? 0) > 0) ? addressMatch[1] : undefined
    } else if (part.includes('Продукция</h2>')) {
      const productParts = part.split(/Производитель\(Импортер\):[^<]+<br\/\s?>/)
      for (const item of productParts) {
        const itemMatch = item.match(/(<div[^>]+>\s*)?(<br\/\s?>)?([^<]+)<br\/\s*>/)
        const itemPriceMatch = (itemMatch != null) && ((itemMatch[3]?.length ?? 0) > 0) ? itemMatch[3].match(/Цена:\s*([\d.,]+)/) : undefined
        if (itemMatch !== null && (itemPriceMatch != null) && ((itemPriceMatch[1]?.length ?? 0) > 0)) {
          const price = decimal(itemPriceMatch[1].replace(',', '.'))
          totalAmount = add(totalAmount, price)
          items.push({
            name: itemMatch[3].split(/\(Код/)[0].trim(),
            quantity: '1',
            unitPrice: price,
            totalAmount: price
          })
        }
      }
    }
  }
  merchant.name = text(merchant.name)
  merchant.address = text(merchant.address)
  if (merchant.name === undefined) delete merchant.name
  if (merchant.address === undefined) delete merchant.address
  const receipt = {
    completeness: 'full',
    currency: 'RUB',
    operation: 'unknown',
    issuedAt,
    items,
    totalAmount,
    ...(Object.keys(merchant).length > 0 ? { merchant } : {})
  }
  assertReceipt(receipt)
  return receipt
}
