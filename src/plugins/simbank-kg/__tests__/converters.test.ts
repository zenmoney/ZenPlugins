import { convertTransaction, parseFormattedNumber, parseOperation, parseSimbankDate, signedSum } from '../converters'
import { SimbankStatementTransaction } from '../models'

describe('parseFormattedNumber', () => {
  it.each([
    ['47 090,52', 47090.52],
    ['-579,48', -579.48],
    ['+0,01', 0.01],
    ['-3 282,84', -3282.84],
    ['-1 338,20', -1338.20],
    ['198 661,80', 198661.80],
    ['−1 338,20', -1338.20], // U+2212 minus sign
    ['–2 688,44', -2688.44] // en dash
  ])('parses %s → %s', (input, expected) => {
    expect(parseFormattedNumber(input)).toBe(expected)
  })

  it('returns NaN for empty', () => {
    expect(parseFormattedNumber('')).toBeNaN()
    expect(parseFormattedNumber('-')).toBeNaN()
  })
})

describe('signedSum', () => {
  it('keeps the printed sign', () => {
    expect(signedSum('-579,48')).toBe(-579.48)
    expect(signedSum('+0,01')).toBe(0.01)
  })
})

describe('parseSimbankDate', () => {
  it('combines date and time', () => {
    expect(parseSimbankDate('21-12-2025', '09:49:14')).toBe('2025-12-21T09:49:14.000')
  })

  it('defaults the time when missing', () => {
    expect(parseSimbankDate('21-06-2026')).toBe('2026-06-21T00:00:00.000')
  })

  it('throws on a bad date', () => {
    expect(() => parseSimbankDate('nonsense')).toThrow()
  })
})

describe('parseOperation', () => {
  it('treats a plain name as a merchant', () => {
    expect(parseOperation('PADINI CONCEPT STORE')).toEqual({
      merchant: { fullTitle: 'PADINI CONCEPT STORE', mcc: null, location: null },
      comment: null
    })
  })

  it.each([
    'Simbank',
    'Регулярный платеж "Пу-пу-пу"',
    'Округление баланса "Пу-пу-пу"',
    'Процент на остаток личных средств'
  ])('treats service row "%s" as a comment', (desc) => {
    expect(parseOperation(desc)).toEqual({ merchant: null, comment: desc })
  })
})

describe('convertTransaction', () => {
  const raw = (amount: string, description: string): SimbankStatementTransaction => ({
    date: '2025-12-21T09:49:14.000', amount, balance: '47 090,52', description, uid: 'u1', originString: ''
  })

  it('produces a single non-transfer movement', () => {
    const { transaction } = convertTransaction('402183****0412', raw('-579,48', 'SB061'))
    expect(transaction.movements).toHaveLength(1)
    expect(transaction.movements[0]).toEqual({
      id: 'u1',
      account: { id: '402183****0412' },
      invoice: null,
      sum: -579.48,
      fee: 0
    })
    expect(transaction.hold).toBe(false)
    expect(transaction.date).toEqual(new Date('2025-12-21T09:49:14.000'))
  })
})
