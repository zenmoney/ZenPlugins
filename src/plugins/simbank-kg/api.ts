import { TemporaryError } from '../../errors'
import { parsePdf } from '../../common/pdfUtils'

import { RawAccountAndTransactions } from './models'
import { parseSimbankStatements } from './parser-pdf'

const SUPPORTED_MIME_TYPES = ['application/pdf']

export async function pickStatementDocuments (): Promise<Blob[]> {
  const blobs = await ZenMoney.pickDocuments(SUPPORTED_MIME_TYPES, true)

  if (blobs.length === 0) {
    throw new TemporaryError('Выберите PDF-выписку Simbank. Получить её можно в приложении Simbank: настройки карты → «Выписка по карте».')
  }
  return blobs
}

export function validateDocuments (blobs: Blob[]): void {
  for (const { size, type } of blobs) {
    // Android pickers often report an empty MIME type — accept it and let the
    // parser decide. Reject only clearly unsupported, non-empty types.
    if (type !== '' && !SUPPORTED_MIME_TYPES.includes(type)) {
      throw new TemporaryError('Файл должен быть в формате .pdf')
    }
    if (size >= 5 * 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла — 5 МБ')
    }
  }
}

export async function readPdfTextsSequentially (
  blobs: Blob[],
  readPdf: typeof parsePdf = parsePdf
): Promise<string[]> {
  const texts: string[] = []
  for (const blob of blobs) {
    const { text } = await readPdf(blob)
    texts.push(text)
  }
  return texts
}

export async function parseSimbankStatementFromFiles (
  blobs: Blob[],
  readPdf: typeof parsePdf = parsePdf
): Promise<RawAccountAndTransactions | null> {
  validateDocuments(blobs)

  try {
    const texts = await readPdfTextsSequentially(blobs, readPdf)
    const statements = parseSimbankStatements(texts)
    return statements.length > 0 ? statements : null
  } catch (e) {
    if (e instanceof TemporaryError) {
      throw e
    }
    // Surface unreadable-PDF and parser ("not a Simbank statement", layout drift)
    // failures to the user with their message, like mbank-kg / kaspi do.
    throw new TemporaryError(e instanceof Error && e.message !== '' ? e.message : 'Не удалось обработать файл выписки Simbank')
  }
}
