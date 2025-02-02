import { TemporaryError } from '../../errors'

import { VakifStatementAccount, VakifStatementTransaction } from './models'
import { parsePdfFromBlob } from './pdfToStr'
import { parseDateAndTimeFromPdfText, parseDateFromPdfText, parseFormattedNumber } from './converters'

export async function parsePdfVakifStatement (): Promise<null | Array<{ account: VakifStatementAccount, transactions: VakifStatementTransaction[] }>> {
  const blob = await getPdfDocuments()
  validateDocuments(blob)
  const pdfStrings = await parsePdfFromBlob({ blob })
  return parsePdfStatements(pdfStrings)
}

export function parsePdfStatements (pdfStrings: string[]): Array<{ account: VakifStatementAccount, transactions: VakifStatementTransaction[] }> {
  const result = []
  for (const textItem of pdfStrings) {
    if (!isVakifBankStatement(textItem)) {
      throw new TemporaryError('Похоже, это не выписка VakifBank')
    }
    try {
      result.push(parseSinglePdfString(textItem))
    } catch (e) {
      console.error(e)
      throw e
    }
  }
  return result
}

function isVakifBankStatement (text: string): boolean {
  return /www.vakifbank.com.tr/i.test(text)
}

export function validateDocuments (blob: Blob[]): void {
  for (const { size, type } of blob) {
    if (type !== 'application/pdf') {
      throw new TemporaryError('Выписка должна быть в расширении .pdf')
    } else if (size >= 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла - 1 мб')
    }
  }
}

async function getPdfDocuments (): Promise<Blob[]> {
  const blob = await ZenMoney.pickDocuments(['application/pdf'], true)
  if (blob == null || !blob.length) {
    throw new TemporaryError('Выберите один или несколько файлов в формате .pdf')
  }
  return blob
}

export function parseSinglePdfString (text: string, statementUid?: string): { account: VakifStatementAccount, transactions: VakifStatementTransaction[] } {
  const balanceAmount = extractBalance(text)
  const rawAccount: VakifStatementAccount = {
    balance: balanceAmount,
    id: extractAccountId(text),
    instrument: extractInstrument(text),
    title: 'Vakifbank *' + extractAccountId(text).slice(-4),
    date: extractStatementDate(text)
  }
  const rawTransactions = extractTransactions(text)
  const parsedContent = {
    account: rawAccount,
    transactions: rawTransactions
  }
  return parsedContent
}

export function extractInstrument (text: string): string {
  const match = text.match(/Account Type:VADESİZ\s+([A-Z]{2,3})Nickname:/)
  return match ? match[1] : 'TL' // Default to 'TL' if no match found
}

function extractAccountId (text: string): string {
  const accountNumRegex = /Account No: (\d{17})/
  const match = accountNumRegex.exec(text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse accountId from account statement')
  return match[1]
}

function extractBalance (text: string): number {
  const balanceRegex = /Balance:(-?[\d.]+,\d\d)/
  const match = balanceRegex.exec(text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse balance from account statement')
  return parseFormattedNumber(match?.[1])
}

function extractStatementDate (text: string): string {
  const statementDateRegex = /Account No: \d{17}(\d\d\.\d\d\.\d\d\d\d)/
  const match = statementDateRegex.exec(text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse statement date from account statement')
  return parseDateFromPdfText(match?.[1])
}

function extractTransactions (text: string): VakifStatementTransaction[] {
  const transactionRegex = /(\d\d\.\d\d\.20\d\d)(\d\d:\d\d)(\d{16})(-?[\d.]+,\d\d)(-?[\d.]+,\d\d)(.*?)[\r\n]{1,2}((.|[\r\n])*?)([\r\n][\r\n]|$|[\r\n](?=\d\d\.\d\d\.202\d\d\d:\d\d))/ig
  let match
  const result: VakifStatementTransaction[] = []
  while ((match = transactionRegex.exec(text)) != null) {
    result.push({
      date: parseDateAndTimeFromPdfText(match[1], match[2]),
      amount: match[4],
      balance: match[5],
      description1: match[6].replace(/\r\n/ig, ' ').replace(/\r/ig, ' ').replace(/\n/ig, ' '),
      description2: match[7].replace(/\r\n/ig, ' ').replace(/\r/ig, ' ').replace(/\n/ig, ' '),
      statementUid: match[3],
      originString: match[0]
    })
  }
  return result
}
