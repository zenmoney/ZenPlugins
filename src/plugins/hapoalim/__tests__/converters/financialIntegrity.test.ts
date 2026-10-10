interface Api {
  convertAccounts: (records: unknown[]) => Array<{ account: { id: string, balance?: number | null, title?: string } }>
  convertTransaction: (record: unknown, account: unknown, sourceType?: string) => unknown
}
const { convertAccounts, convertTransaction } = jest.requireActual<Api>('../../converters')

const checking = (number: number): object => ({ structType: 'checking', bankNumber: 12, branchNumber: 702, accountNumber: number, details: { currentBalance: 10, currentAccountCreditFrame: 0 } })
const fx = (code: number, detail: number, instrument: string): object => ({ currencyCode: code, detailedAccountTypeCode: detail, currencySwiftCode: instrument, currencyLongDescription: instrument, currentBalance: 20 })
const account = { id: '12-702-1001', instrument: 'ILS' }
const transaction = { eventAmount: 10, eventActivityTypeCode: 1, formattedEventDate: '2026-10-01T00:00:00.000Z', activityDescription: 'model', transactionType: 'REGULAR', rejectedDataEventPertainingIndication: 'N' }

// [model] Domain invariants only: all balances survive conversion, duplicate
// identities are not silently discarded, and malformed required money fails.
// Bank field interpretation is covered separately by existing complete fixtures.
// Deposit selectors mirror those fixtures only to pass the supported-variant
// guard; the model does not establish their currency meaning in the bank.
describe('[model] Hapoalim financial integrity', () => {
  it.each(['account', 'foreignCurrencyAccount'].flatMap(sourceType => [null, [], 'invalid', 1].map(record => ({ sourceType, record }))))('rejects an invalid $sourceType transaction record with static context: $record', ({ sourceType, record }) => {
    expect(() => convertTransaction(record, account, sourceType)).toThrow(expect.objectContaining({ message: 'unexpected transaction record', context: { sourceType } }))
  })
  it.each([null, [], 'invalid', 1])('rejects malformed account records with an explicit error: %j', record => {
    expect(() => convertAccounts([record])).toThrow('unexpected account record')
  })

  // 143 is a virtual model selector, NOT an observed EUR bank product type.
  it('converts every distinct model FX selector without discarding a bucket', () => {
    const result = convertAccounts([{ structType: 'foreignCurrencyAccount', mainProductId: account.id, balancesAndLimitsDataList: [fx(19, 142, 'USD'), fx(100, 143, 'EUR')] }])
    expect(result).toEqual([
      { mainProduct: { id: account.id, type: 'foreignCurrencyAccount', currencyCode: 19, detailedAccountTypeCode: 142 }, account: { id: account.id + '142', type: 'checking', title: 'USD', instrument: 'USD', syncID: [account.id + '142'], balance: 20 } },
      { mainProduct: { id: account.id, type: 'foreignCurrencyAccount', currencyCode: 100, detailedAccountTypeCode: 143 }, account: { id: account.id + '143', type: 'checking', title: 'EUR', instrument: 'EUR', syncID: [account.id + '143'], balance: 20 } }
    ])
  })

  it('accepts an explicit empty FX balance list without throwing or fabricating a balance', () => {
    expect(convertAccounts([checking(1001), { structType: 'foreignCurrencyAccount', mainProductId: account.id, balancesAndLimitsDataList: [] }])).toHaveLength(1)
  })

  it('collapses exact repeated plans without dropping the second distinct account', () => {
    expect(convertAccounts([checking(1001), checking(1002), checking(1001)]).map(plan => plan.account.id)).toEqual(['12-702-1001', '12-702-1002'])
  })

  it('rejects conflicting balances sharing an ID instead of choosing the first', () => {
    const conflicting = { structType: 'checking', bankNumber: 12, branchNumber: 702, accountNumber: 1001, details: { currentBalance: 999, currentAccountCreditFrame: 0 } }
    expect(() => convertAccounts([checking(1001), conflicting])).toThrow(/identity|conflict/i)
  })

  it('does not merge equal-looking deposits owned by different main accounts', () => {
    const deposit = {
      structType: 'deposit',
      detailedAccountTypeCode: 26,
      depositSerialId: 1,
      shortProductName: 'model',
      interestCreditingMethodDescription: 'לעו"ש',
      interestPaymentDescription: '1   סוף פיקדון',
      revaluedTotalAmount: 500,
      principalAmount: 500,
      formattedAgreementOpeningDate: '2026-01-01T00:00:00.000Z',
      formattedPaymentDate: '2026-04-01T00:00:00.000Z',
      adjustedInterest: 0.5
    }
    expect(() => convertAccounts([
      { ...deposit, sourceAccountId: '12-702-1001' }, { ...deposit, sourceAccountId: '12-702-1002' }
    ])).toThrow(/identity/)
  })

  it('rejects two different currencies sharing an old FX identity', () => {
    expect(() => convertAccounts([{ structType: 'foreignCurrencyAccount', mainProductId: account.id, balancesAndLimitsDataList: [fx(19, 142, 'USD'), fx(100, 142, 'EUR')] }])).toThrow(/identity|conflict/i)
  })

  it('rejects unknown product types without exposing the raw customer object', () => {
    const assert = jest.spyOn(console, 'assert').mockImplementation(() => {})
    try {
      expect(() => convertAccounts([{ structType: 'MODEL_UNKNOWN', customerName: 'MODEL_PRIVATE' }])).toThrow(/account type/)
      expect(JSON.stringify(assert.mock.calls)).not.toContain('MODEL_PRIVATE')
    } finally { assert.mockRestore() }
  })

  it.each([undefined, NaN, Infinity, '10', -1])('rejects malformed/ambiguous transaction amount: %s', amount => {
    expect(() => convertTransaction({ ...transaction, eventAmount: amount }, account)).toThrow(/amount/i)
  })

  it.each([undefined, null, 0, 3, '1'])('rejects unknown direction instead of guessing an expense: %s', code => {
    expect(() => convertTransaction({ ...transaction, eventActivityTypeCode: code }, account)).toThrow(/direction/i)
  })

  it.each([null, undefined, 'invalid', '2026-02-30T00:00:00.000Z'])('rejects invalid operation dates: %s', date => {
    expect(() => convertTransaction({ ...transaction, formattedEventDate: date }, account)).toThrow(/date/i)
  })

  it('does not deduplicate separate equal-valued converted operations', () => {
    expect([transaction, { ...transaction }].map(row => convertTransaction(row, account))).toHaveLength(2)
  })

  it.each([{ eventAmount: 0 }, { ...transaction, eventAmount: 0, eventActivityTypeCode: 3 }, { ...transaction, eventAmount: 0, formattedEventDate: 'invalid' }])('validates zero rows before deliberately omitting a zero movement: %j', row => {
    expect(() => convertTransaction(row, account)).toThrow()
  })

  it('preserves unknown checking balance and credit limit as null, not zero', () => {
    expect(convertAccounts([{ structType: 'checking', bankNumber: 12, branchNumber: 702, accountNumber: 1001, details: { currentBalance: null, currentAccountCreditFrame: null } }])).toEqual([{
      mainProduct: { id: account.id, type: 'account' },
      account: {
        id: account.id, type: 'checking', title: '*1001 חשבון נוכחי', instrument: 'ILS', syncID: [account.id], balance: null, creditLimit: null
      }
    }])
  })

  it('preserves a known zero deposit balance without asserting contractual interpretations', () => {
    const result = convertAccounts([{
      structType: 'deposit',
      detailedAccountTypeCode: 26,
      depositSerialId: 1,
      shortProductName: 'model',
      interestCreditingMethodDescription: 'לעו"ש',
      interestPaymentDescription: '1   סוף פיקדון',
      revaluedTotalAmount: 0,
      principalAmount: 500,
      formattedAgreementOpeningDate: '2026-01-01T00:00:00.000Z',
      formattedPaymentDate: '2026-04-01T00:00:00.000Z',
      adjustedInterest: 0.5
    }])
    expect(result).toHaveLength(1)
    expect(result[0].account.balance).toBe(0)
  })

  it('propagates legacy alternate balance/title fields without asserting product interpretation', () => {
    const result = convertAccounts([{
      structType: 'deposit',
      detailedAccountTypeCode: 26,
      depositSerialId: 1,
      shortSavingDepositName: 'model alternate title',
      interestCreditingMethodDescription: 'לעו"ש',
      interestPaymentDescription: '1   סוף פיקדון',
      revaluedBalance: 500,
      principalAmount: 500,
      adjustedInterest: 0.5,
      formattedAgreementOpeningDate: '2026-01-01T00:00:00.000Z',
      formattedPaymentDate: '2026-04-01T00:00:00.000Z'
    }])
    expect(result).toHaveLength(1)
    expect(result[0].account.balance).toBe(500)
    expect(result[0].account.title).toBe('model alternate title')
  })

  it.each(['PENDING', 'REJECTED', undefined])('does not publish an unobserved transaction status as settled: %s', status => {
    expect(() => convertTransaction({ ...transaction, transactionType: status }, account)).toThrow(/status/)
  })

  it.each(['Y', undefined])('requires the observed checking rejection flag: %s', rejected => {
    expect(() => convertTransaction({ ...transaction, rejectedDataEventPertainingIndication: rejected }, account)).toThrow(/status/)
  })

  it.each(['', '   ', undefined])('does not fabricate a merchant without a name: %s', title => {
    expect(convertTransaction({ ...transaction, activityDescription: title }, account)).toEqual({
      hold: false,
      date: new Date('2026-10-01T00:00:00+02:00'),
      movements: [{ id: null, account: { id: account.id }, invoice: null, sum: 10, fee: 0 }],
      merchant: null,
      comment: null
    })
  })

  it.each([19, undefined, '1'])('does not relabel an unknown loan currency as ILS: %s', currency => {
    expect(() => convertAccounts([{ structType: 'loan', creditCurrencyCode: currency }])).toThrow(/currency/)
  })

  it.each(['bankNumber', 'branchNumber', 'accountNumber'])('rejects a missing checking identity component: %s', field => {
    expect(() => convertAccounts([{ ...checking(1001), [field]: undefined }])).toThrow(/identity/)
  })

  it.each([undefined, [], [{}]])('does not silently drop missing or mismatched mortgage parts: %j', parts => {
    expect(() => convertAccounts([{ structType: 'mortgage', subLoansCounter: 2, subLoanData: parts }])).toThrow(/mortgage parts/)
  })

  it.each(['USD', undefined])('rejects FX amount currency that does not match its account: %s', currency => {
    expect(() => convertTransaction({ ...transaction, currencySwiftCode: currency }, account, 'foreignCurrencyAccount')).toThrow(/instrument/)
  })

  it('does not let an FX-shaped checking row bypass the checking status flag', () => {
    expect(() => convertTransaction({ ...transaction, rejectedDataEventPertainingIndication: undefined, currencySwiftCode: 'ILS', formattedExecutingDate: transaction.formattedEventDate }, account, 'account')).toThrow(/status/)
  })

  it.each([0, -1, 1.5])('rejects invalid numeric FX identity codes: %s', value => {
    for (const field of ['currencyCode', 'detailedAccountTypeCode']) {
      expect(() => convertAccounts([{ structType: 'foreignCurrencyAccount', mainProductId: account.id, balancesAndLimitsDataList: [{ ...fx(19, 142, 'USD'), [field]: value }] }])).toThrow(/identity/)
    }
  })

  it('does not emit a foreign currency account without a title', () => {
    expect(() => convertAccounts([{ structType: 'foreignCurrencyAccount', mainProductId: account.id, balancesAndLimitsDataList: [{ ...fx(19, 142, 'USD'), currencyLongDescription: '' }] }])).toThrow(/foreign currency/)
  })

  it('uses the FX execution date ahead of its value date with an explicit source', () => {
    expect(convertTransaction({ ...transaction, formattedEventDate: undefined, formattedExecutingDate: '2026-10-01T00:00:00.000Z', formattedValueDate: '2026-10-02T00:00:00.000Z', currencySwiftCode: 'ILS', rejectedDataEventPertainingIndication: undefined }, account, 'foreignCurrencyAccount')).toEqual({
      hold: false,
      date: new Date('2026-10-01T00:00:00+02:00'),
      movements: [{ id: null, account: { id: account.id }, invoice: null, sum: 10, fee: 0 }],
      merchant: { country: null, city: null, title: 'model', mcc: null, location: null },
      comment: null
    })
  })
})
