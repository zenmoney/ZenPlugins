import { parsePdf as commonParsePdf } from '../../common/pdfUtils'
import { TemporaryError } from '../../errors'

export function parseTransactions (text) {
  const transactionListRegex = /Комиссия\s+No\s+карточки\/счета\s+(?:Выписка\s+по\s+счету:\s+KZ\d+[^\S\r\n]*\d*)?([\s\S]+?)(?:(?:Дата\s+проведения)|(?:Место\s+печати))/g
  const transactionListText = [...text.matchAll(transactionListRegex)].map(match => match[1].trim()).join('\n')
  const transactionRegex = /(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})\s+([\s\S]+?)\s+(-?)\s*([\d\s]+,\d{2})\s+([A-Z]{0,3})\s*(-?)\s*([\d\s]+,\d{2})\s+(-?)\s*([\d\s]+,\d{2})\s+(-?)\s*([\d\s]+,\d{2})/g
  return [...transactionListText.matchAll(transactionRegex)].map(match => {
    return {
      date: match[1],
      description: match[3].replace(/[\n\r]+/g, ' '),
      amount: match[4] + match[5],
      currency: match[6],
      income: match[7] + match[8],
      expense: match[9] + match[10],
      fee: match[11] + match[12]
    }
  })
}

export function parseAccount (text) {
  const balanceMatch = text.match(/Исходящий\s+остаток:\s+(-?)\s*([\d\s]+,\d{2})/)
  const availableMatch = text.match(/Доступная\s+сумма\s+с\s+учетом\s+кредитного\s+лимита\s+на\s+дату\s+формирования\s+выписки:\s+(-?)\s*([\d\s]+,\d{2})/)
  return {
    currency: text.match(/Валюта\s+счета:\s+([A-Z]{3})/)[1],
    accountNumber: text.match(/Номер\s+счета:\s+([A-Z\d]+)/)[1],
    cardNumber: text.match(/Номер\s+карточки:\s+([\d*]+)/)?.[1],
    balance: balanceMatch[1] + balanceMatch[2],
    available: availableMatch[1] + availableMatch[2],
    statementDate: text.match(/Дата\s+формирования\s+выписки:\s+(\d{2}\.\d{2}\.\d{4})/)[1]
  }
}

export async function parsePdf () {
  const pdfs = await ZenMoney.pickDocuments(['application/pdf'], true)
  if (!pdfs || !pdfs.length) {
    throw new TemporaryError('Выберите один или несколько файлов в формате .pdf')
  }
  for (const {
    size,
    type
  } of pdfs) {
    if (type !== 'application/pdf') {
      throw new TemporaryError('Выписка должна быть в расширении .pdf')
    } else if (size >= 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла - 1 мб')
    }
  }
  return await Promise.all(pdfs.map(async pdf => {
    const { text } = await commonParsePdf(pdf)
    if (!/АО\s+"Народный\s+Банк\s+Казахстана"/.test(text)) {
      throw new TemporaryError('Похоже, это не выписка Halyk Bank')
    }
    const account = parseAccount(text)
    account.transactions = parseTransactions(text)
    return account
  }))
}
