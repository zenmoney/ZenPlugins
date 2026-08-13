import { TemporaryError } from '../../errors'

import { RawAccountAndTransactions } from './models'
import { parseXlsStatements } from './parser-xls'

const SUPPORTED_MIME_TYPES = [
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export async function pickStatementDocuments (): Promise<Blob[]> {
  const blobs = await ZenMoney.pickDocuments(SUPPORTED_MIME_TYPES, true)

  if (blobs.length === 0) {
    throw new TemporaryError('Выберите один или несколько файлов выписки MBank в формате .xls/.xlsx')
  }
  return blobs
}

export function validateDocuments (blobs: Blob[]): void {
  for (const { size, type } of blobs) {
    // Android pickers often report an empty MIME type — accept it and let the
    // parser decide. Reject only clearly unsupported, non-empty types.
    if (type !== '' && !SUPPORTED_MIME_TYPES.includes(type)) {
      throw new TemporaryError('Файл должен быть в формате .xls/.xlsx')
    }
    if (size >= 5 * 1000 * 1000) {
      throw new TemporaryError('Максимальный размер файла — 5 МБ')
    }
  }
}

export async function parseMBankStatementFromFiles (blobs: Blob[]): Promise<RawAccountAndTransactions> {
  validateDocuments(blobs)

  const buffers = await Promise.all(blobs.map(async b => await b.arrayBuffer()))

  try {
    return parseXlsStatements(buffers)
  } catch (e) {
    // Surface unreadable / non-MBank files as a clean user-facing message.
    const message = (e instanceof Error && e.message !== '') ? e.message : 'Не удалось разобрать файл выписки MBank'
    throw new TemporaryError(message)
  }
}
