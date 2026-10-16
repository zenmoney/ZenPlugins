import { createHash } from 'crypto'

interface Account {
  id: string
  syncID: string[]
  type: string
  savings?: boolean
  balance: number
  startBalance?: number
}
const { convertAccounts } = jest.requireActual<{ convertAccounts: (records: Array<Record<string, unknown>>) => Array<{ account: Account }> }>('../../../converters')
const { patchAccounts } = jest.requireActual<{ patchAccounts: (accounts: Account[]) => Account[] }>('../../../../../common/adapters')
const { sanitizeSyncId } = jest.requireActual<{ sanitizeSyncId: (id: string) => string }>('../../../../../common/accounts')

// [model] The live collision had equal serials but different principals on two parents.
const deposit = (parent: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  structType: 'deposit',
  sourceAccountId: parent,
  depositSerialId: 1530001,
  detailedAccountTypeCode: 26,
  linkageTypeCode: 1,
  shortProductName: 'model deposit',
  principalAmount: 5000,
  revaluedTotalAmount: 5100,
  adjustedInterest: 0.5,
  formattedAgreementOpeningDate: '2026-06-01T00:00:00.000Z',
  formattedPaymentDate: '2026-08-30T00:00:00.000Z',
  interestCreditingMethodDescription: '\u05dc\u05e2\u05d5"\u05e9',
  interestPaymentDescription: '\u05e1\u05d5\u05e3 \u05e4\u05d9\u05e7\u05d3\u05d5\u05df',
  ...extra
})
const scoped = (parent: string, serial = '1530001'): string => `hapoalim-deposit:${createHash('sha256').update(parent).digest('hex')}:${serial}`
const adapted = (records: Array<Record<string, unknown>>): Account[] => patchAccounts(convertAccounts(records).map(plan => plan.account))

describe('[model] parent-scoped deposit identity and shared native adapter', () => {
  beforeEach(() => { Object.assign(globalThis, { ZenMoney: { features: { investmentAccount: true } } }) })

  it('preserves both differing balances, stable IDs and independent matching keys', () => {
    const records = [deposit('12-702-1001'), deposit('12-702-1002', { principalAmount: 9000, revaluedTotalAmount: 9200 })]
    const result = convertAccounts(records)
    expect(result.map(plan => [plan.account.id, plan.account.startBalance, plan.account.balance])).toEqual([
      [scoped('12-702-1001'), 5000, 5100], [scoped('12-702-1002'), 9000, 9200]
    ])
    expect(convertAccounts([...records, ...records])).toEqual(result)
    expect(convertAccounts([...records].reverse())).toEqual([...result].reverse())
    const both = adapted(records)
    for (const [index, record] of records.entries()) {
      const key = sanitizeSyncId(scoped(index === 0 ? '12-702-1001' : '12-702-1002'))
      expect(both[index].syncID).toContain(key)
      expect(both[index].syncID).not.toContain('1530001')
      expect(both[index].syncID).not.toContain('0001')
      expect(adapted([record])[0].syncID).toContain(key)
    }
    expect(both[0].syncID.some(key => both[1].syncID.includes(key))).toBe(false)
  })

  it.each(['12-702-1001', '13-702-1001', '12-703-1001', '12-702-10001'])('keeps a stable opaque parent discriminator: %s', parent => {
    const account = adapted([deposit(parent)])[0]
    expect(account.syncID).toContain(sanitizeSyncId(scoped(parent)))
    expect(JSON.stringify([account.id, account.syncID])).not.toContain(parent)
  })

  it('retains the old unambiguous key for existing deposit matching', () => {
    expect(adapted([deposit('12-702-1001')])[0].syncID).toContain('1530001')
    expect(adapted([deposit('12-702-1001')])[0].syncID).toContain('0001')
    expect(convertAccounts([deposit(undefined)])[0].account.id).toBe('1530001')
  })

  it('does not assign another legacy account suffix to a deposit', () => {
    const records = [{ structType: 'checking', bankNumber: 12, branchNumber: 702, accountNumber: 10001, details: { currentBalance: 10, currentAccountCreditFrame: 0 } }, deposit('12-702-1001')]
    const result = adapted(records)
    expect(result[1].syncID).not.toContain('0001')
    expect(result[1].syncID).toContain(sanitizeSyncId(scoped('12-702-1001')))
  })

  it.each([undefined, null])('scopes the legacy opening-date fallback when serial is %s', serial => {
    const records = ['12-702-1001', '12-702-1002'].map(parent => deposit(parent, { depositSerialId: serial, agreementOpeningDate: 20260601 }))
    expect(convertAccounts(records).map(plan => plan.account.id)).toEqual(['12-702-1001', '12-702-1002'].map(parent => scoped(parent, '20260601')))
    expect(adapted(records).every(account => account.syncID.length > 0)).toBe(true)
  })

  it('does not merge a savings product with the same serial on another parent', () => {
    const records = ['12-702-1001', '12-702-1002'].map(parent => deposit(parent, {
      detailedAccountTypeCode: 54, depositingMethodDescription: '\u05d4\u05e4\u05e7\u05d3\u05d4 \u05e8\u05e6\u05d9\u05e4\u05d4'
    }))
    expect(convertAccounts(records).map(plan => [plan.account.id, plan.account.type, plan.account.savings])).toEqual(['12-702-1001', '12-702-1002'].map(parent => [scoped(parent), 'checking', true]))
  })

  it('rejects a mixed scoped/legacy graph rather than publishing an unmatched deposit', () => {
    expect(() => convertAccounts([deposit('12-702-1001'), deposit(undefined)])).toThrow(/identity/)
  })

  it('keeps colliding-tail checking matching identifiers unchanged', () => {
    const checking = { structType: 'checking', bankNumber: 12, branchNumber: 702, accountNumber: 10001, details: { currentBalance: 10, currentAccountCreditFrame: 0 } }
    const old = patchAccounts([...convertAccounts([checking]).map(plan => plan.account), ...convertAccounts([deposit(undefined)]).map(plan => plan.account)])
    expect(adapted([checking, deposit('12-702-1001')])[0]).toEqual(old[0])
  })

  it.each(['1234', '1530001', '1234567890123456', '12345678901234567'])('retains old adapter-visible keys for an unambiguous serial: %s', serial => {
    const old = adapted([deposit(undefined, { depositSerialId: serial })])[0]
    const current = adapted([deposit('12-702-1001', { depositSerialId: serial })])[0]
    expect(current.syncID).toEqual(expect.arrayContaining(old.syncID))
  })

  it('keeps the pre-existing adapter limitation for identifiers shorter than four characters explicit', () => {
    for (const parent of [undefined, '12-702-1001']) {
      expect(() => adapted([deposit(parent, { depositSerialId: '1' })])).toThrow(/at least 4/)
    }
  })

  it('preserves masked legacy keys when different deposits share only their suffix', () => {
    const serials = ['1234567890123456', '9234567890123456']
    const old = adapted(serials.map(serial => deposit(undefined, { depositSerialId: serial })))
    const current = adapted(serials.map((serial, i) => deposit(`12-702-${1001 + i}`, { depositSerialId: serial })))
    current.forEach((account, i) => expect(account.syncID).toEqual(expect.arrayContaining(old[i].syncID)))
  })

  it.each([{ revaluedTotalAmount: 9999 }, { productNumber: 999 }, { unknownBankField: 1 }])('still rejects conflicting records within one parent: %j', change => {
    expect(() => convertAccounts([deposit('12-702-1001'), deposit('12-702-1001', change)])).toThrow('conflicting account identity')
  })

  it.each(['', 'parent', '0-702-1001', '12-0-1001', '12-702-0', '12:702:1001', 123, null])('rejects an invalid supplied parent without fallback: %j', parent => {
    expect(() => convertAccounts([deposit(parent)])).toThrow(/identity/)
  })
})
