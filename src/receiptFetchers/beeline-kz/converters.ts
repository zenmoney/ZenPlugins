import type { Receipt, ReceiptItem, ReceiptMerchant, ReceiptDateTime, ReceiptPayment } from '../../types/receiptFetcher'
import _ from 'lodash'
import cheerio from 'cheerio'
import moment from 'moment'
import 'moment/locale/ru'
import 'moment/locale/kk'
import { decimal } from '../../common/decimal'
import { assertReceipt, optional, text } from '../../common/receiptFetcher/receipt'

function convertFloat (str: string): string {
  return decimal(str.replace(/\s/g, '').replace(',', '.'))
}

export function convertReceipt (html: unknown): Receipt {
  assert(typeof html === 'string', 'Unexpected receipt payload')
  const $ = cheerio.load(html, {
    normalizeWhitespace: true,
    xmlMode: false
  })
  const baseInfo = $('body > div.container.mt-2 > div > div > main > div > div.ticket_header').children()
  const detailInfo = $('body > div.container.mt-2 > div > div > main > div > div.ticket_body')
  if (baseInfo.length === 0 || detailInfo.length === 0) {
    throw new Error('Unexpected receipt payload')
  }
  const issuedAt: Partial<ReceiptDateTime> = {}
  const merchant: ReceiptMerchant = {}
  const items: ReceiptItem[] = []
  let payments: ReceiptPayment[] | undefined
  _.times(baseInfo.length, (i) => {
    const itemText = $(baseInfo[i]).text()
    if (i === 0) Object.assign(merchant, optional('name', text(itemText)))
    const taxId = itemText.match(/(ИИН(?:\/БИН)?):?\s*(\d+)/)
    if ((merchant.identifiers == null) && taxId !== null) merchant.identifiers = [{ value: taxId[2], countryCode: 'KZ', scheme: taxId[1] === 'ИИН' ? 'IIN' : 'IIN/BIN' }]
    merchant.address = (merchant.address == null) && itemText.includes('Адрес:')
      ? itemText.split('Адрес: ')[1].replace('\n', ' ').trim().replace(/\s+/g, ' ')
      : merchant.address
    if (itemText.includes('ата и время')) {
      const localeMatch = html.match(/<html lang="([a-z]+)">/i)
      const dateTime = itemText.split('Дата и время: ')[1].split(', ')
      issuedAt.time = dateTime[1]
      // The provider omits the dot in Russian abbreviations ("апр" vs "апр.").
      issuedAt.date = moment(dateTime[0], ['D MMM YYYY', 'D MMMM YYYY'], (localeMatch != null) ? localeMatch[1] : 'ru').format('YYYY-MM-DD')
    }
  })

  const itemNodes = $(detailInfo).children().first().children()
  _.times(itemNodes.length, (i) => {
    const itemText = $(itemNodes[i]).text()
    const match = itemText.match(/(\d+\.\d{2})\s*x\s*([\d.,]+)\s+([^=]+?)\s*=\s*(\d+\.\d{2})/)
    assert(match !== null, 'Missing receipt item details')
    items.push({
      totalAmount: convertFloat(match[4]),
      name: itemText.replace(match[0], '').trim(),
      unitPrice: convertFloat(match[1]),
      quantity: convertFloat(match[2]),
      unit: match[3].trim()
    })
  })
  const totalSumInfo = $(detailInfo).children('.total_sum').text()
  const sumMatch = totalSumInfo.match(/ИТОГО:\s*([\d., ]+)/)
  const totalAmount = sumMatch !== null ? convertFloat(sumMatch[1]) : undefined
  const cardSumMatch = totalSumInfo.match(/Карта:\s*([\d., ]+)/)
  if (cardSumMatch != null) payments = [{ method: 'card', amount: convertFloat(cardSumMatch[1]) }]
  merchant.name = text(merchant.name)
  merchant.address = text(merchant.address)
  if (merchant.name === undefined) delete merchant.name
  if (merchant.address === undefined) delete merchant.address
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
