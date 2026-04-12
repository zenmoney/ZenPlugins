import { generateUUID } from '../../common/utils'
import { TemporaryError } from '../../errors'
import { parsePdf } from '../../common/pdfUtils'
import { ParsedHeader, StatementAccount, StatementTransaction, StatementTransactionRaw } from './models'
import { isHomeCreditStatement, parseStatementText } from './parser'

function parseDepositTitle (header: ParsedHeader): string {
  if (header.productTitle != null && header.productTitle !== '') {
    return `Home Credit Депозит ${header.productTitle}`
  }
  return 'Home Credit Депозит'
}

function parseStatementAccount (header: ParsedHeader): StatementAccount {
  if (header.statementKind === 'deposit') {
    return {
      id: header.iban,
      title: parseDepositTitle(header),
      balance: header.balance,
      instrument: 'KZT',
      date: header.statementDateIso,
      type: 'deposit',
      startDate: header.depositPeriodStart ?? null,
      startBalance: 0,
      capitalization: null,
      endDate: header.depositPeriodEnd ?? null
    }
  }
  return {
    id: header.iban,
    title: `Home Credit *${header.cardLast4}`,
    balance: header.balance,
    instrument: 'KZT',
    date: header.statementDateIso,
    type: 'ccard',
    startDate: null,
    startBalance: null,
    capitalization: null,
    endDate: null
  }
}

function mapStatementTransaction (raw: StatementTransactionRaw): StatementTransaction {
  return {
    hold: raw.hold,
    date: raw.date,
    originalAmount: raw.originalAmount,
    amount: raw.amount,
    description: raw.description,
    statementUid: raw.statementUid,
    originString: raw.originString
  }
}

export async function readPdfTextsSequentially (
  blobs: Blob[],
  readPdf: typeof parsePdf = parsePdf
): Promise<string[]> {
  const pdfStrings: string[] = []
  for (const blob of blobs) {
    const { text } = await readPdf(blob)
    pdfStrings.push(text)
  }
  return pdfStrings
}

export function parseSinglePdfString (text: string, statementUid?: string): { account: StatementAccount, transactions: StatementTransaction[] } {
  const uid = statementUid ?? generateUUID()
  const { header, transactions: raw } = parseStatementText(text, uid)
  const account = parseStatementAccount(header)
  const transactions = raw.map(mapStatementTransaction)
  const parsedContent = {
    account,
    transactions
  }
  if (typeof statementUid !== 'string') {
    console.log('Pdf successfully parsed', parsedContent)
  }
  return parsedContent
}

export async function parsePdfStatements (): Promise<null | Array<{ account: StatementAccount, transactions: StatementTransaction[] }>> {
  const blob = await ZenMoney.pickDocuments(['application/pdf'], true)
  if (blob.length === 0) {
    throw new TemporaryError('Выберите один или несколько файлов в формате .pdf')
  }
  for (const { size, type } of blob) {
    if (type !== 'application/pdf') {
      throw new TemporaryError('Выписка должна быть в расширении .pdf')
    } else if (size >= 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла - 1 мб')
    }
  }
  const pdfStrings = await readPdfTextsSequentially(blob)
  const result = []
  for (const textItem of pdfStrings) {
    console.log(textItem)
    if (!isHomeCreditStatement(textItem)) {
      throw new TemporaryError('Похоже, это не выписка Home Credit Bank (Kazakhstan)')
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
