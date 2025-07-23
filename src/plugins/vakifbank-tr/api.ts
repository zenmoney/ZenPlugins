import { TemporaryError } from '../../errors'

import { RawAccountAndTransactions, VakifStatementAccount, VakifStatementTransaction } from './models'
import { parseDateAndTimeFromPdfText, parseDateFromPdfText, parseFormattedNumber } from './converters'
import { parsePdf } from '../../common/pdfUtils'
import { parseXlsStatements } from './parser-xls'

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export async function pickStatementDocuments (): Promise<Blob[]> {
  const blobs = await ZenMoney.pickDocuments(SUPPORTED_MIME_TYPES, true)

  if (blobs.length === 0) {
    throw new TemporaryError('Выберите один или несколько файлов в формате .pdf или .xls/.xlsx')
  }
  return blobs
}

export async function parseVakifStatementFromFiles (
  blobs: Blob[]
): Promise<null | RawAccountAndTransactions> {
  validateDocuments(blobs)

  const pdfBlobs = blobs.filter(b => b.type === 'application/pdf')
  const xlsBlobs = blobs.filter(
    b => b.type === 'application/vnd.ms-excel' ||
         b.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )

  const statements: RawAccountAndTransactions = []

  if (pdfBlobs.length > 0) {
    const pdfStrings = await Promise.all(
      pdfBlobs.map(async (blob) => {
        const { text } = await parsePdf(blob)
        return text
      })
    )
    statements.push(...parsePdfStatements(pdfStrings))
  }

  if (xlsBlobs.length > 0) {
    const buffers = await Promise.all(xlsBlobs.map(async b => await b.arrayBuffer()))
    statements.push(...parseXlsStatements(buffers))
  }

  return (statements.length > 0) ? statements : null
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
      if (!SUPPORTED_MIME_TYPES.includes(type)) {
        throw new TemporaryError('Файл должен быть в формате .pdf или .xls/.xlsx')
      }
    } else if (size >= 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла - 1 мб')
    }
  }
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
  const match = text.match(/Account Type\s*:\s*VADESİZ\s+([A-Z]{2,3})\s*Nickname\s*:/)
  return (match != null) ? match[1] : 'TL' // Default to 'TL' if no match found
}

function extractAccountId (text: string): string {
  const accountNumRegex = /Account No\s*: (\d{17})/
  const match = accountNumRegex.exec(text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse accountId from account statement')
  return match[1]
}

function extractBalance (text: string): number {
  const balanceRegex = /Balance\s*:\s*(-?[\d.]+,\d\d)/
  const match = balanceRegex.exec(text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse balance from account statement')
  return parseFormattedNumber(match?.[1])
}

function extractStatementDate (text: string): string {
  const statementDateRegex = /Account No\s*: \d{17}\s*(\d\d\.\d\d\.\d\d\d\d)/
  const match = statementDateRegex.exec(text)
  assert(typeof match?.[1] === 'string', 'Can\'t parse statement date from account statement')
  return parseDateFromPdfText(match?.[1])
}

function extractTransactions (text: string): VakifStatementTransaction[] {
  const transactionRegex = /(\d\d\.\d\d\.20\d\d)\s+(\d\d:\d\d)\s+(\d{16})\s+(-?[\d.]+,\d\d)\s+(-?[\d.]+,\d\d)\s+(.*?)[\r\n]{1,2}((.|[\r\n])*?)([\r\n][\r\n]|$|[\r\n](?=\d\d\.\d\d\.202\d\s+\d\d:\d\d))/ig
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
