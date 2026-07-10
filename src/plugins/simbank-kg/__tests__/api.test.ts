import { TemporaryError } from '../../../errors'
import { parseSimbankStatementFromFiles, validateDocuments } from '../api'

const blob = (size: number, type: string): Blob => ({ size, type } as unknown as Blob)
const reader = (text: string): (() => Promise<{ text: string }>) => async () => ({ text })

describe('validateDocuments', () => {
  it('accepts pdf and (Android) empty MIME types', () => {
    expect(() => validateDocuments([blob(1000, 'application/pdf'), blob(1000, '')])).not.toThrow()
  })

  it('rejects a non-pdf type', () => {
    expect(() => validateDocuments([blob(1000, 'text/plain')])).toThrow(TemporaryError)
  })

  it('rejects an oversized file', () => {
    expect(() => validateDocuments([blob(5 * 1000 * 1000, 'application/pdf')])).toThrow(TemporaryError)
  })
})

describe('parseSimbankStatementFromFiles', () => {
  const minimalStatement = [
    'Simbank',
    'Номер карты клиента :  402183****0412',
    '21-12-2025',
    '09:00:00',
    'Grab -10,00 - 90,00'
  ].join('\n')

  it('parses a readable Simbank statement', async () => {
    const result = await parseSimbankStatementFromFiles([blob(1000, 'application/pdf')], reader(minimalStatement))
    expect(result).not.toBeNull()
    expect(result?.[0].account.id).toBe('402183****0412')
    expect(result?.[0].transactions).toHaveLength(1)
  })

  it('wraps a non-Simbank / unparsable file as a user-facing TemporaryError', async () => {
    let thrown: unknown = null
    try {
      await parseSimbankStatementFromFiles([blob(1000, 'application/pdf')], reader('just some random pdf text'))
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeInstanceOf(TemporaryError)
  })
})
