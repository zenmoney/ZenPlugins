import { ZPAPIError } from '../../../../errors'
import { AccountType, ExtendedTransaction, Movement, Transaction } from '../../../../types/zenmoney'

const { mergeStatementAndLastTransactions, transactionsUnique }: {
  mergeStatementAndLastTransactions: (statement: ExtendedTransaction[], recent: ExtendedTransaction[]) => ExtendedTransaction[]
  transactionsUnique: (transactions: ExtendedTransaction[]) => ExtendedTransaction[]
} = jest.requireActual('../../converters')
const { adjustTransactions }: {
  adjustTransactions: (options: { transactions: ExtendedTransaction[] }) => Transaction[]
} = jest.requireActual('../../../../common/transactionGroupHandler')

const baseTime = Date.parse('2026-01-01T12:00:00Z')

function transaction (
  id: string | null,
  offset = 0,
  properties: Partial<ExtendedTransaction> = {},
  movement: Partial<Movement> = {}
): ExtendedTransaction {
  return {
    date: new Date(baseTime + offset),
    hold: false,
    comment: null,
    merchant: null,
    movements: [{ id, account: { id: 'model-a' }, invoice: null, sum: -40, fee: 0, ...movement }],
    ...properties
  }
}

function finalResult (statement: ExtendedTransaction[], recent: ExtendedTransaction[]): Transaction[] {
  const transactions = mergeStatementAndLastTransactions(statement, recent)
    .sort((left, right) => left.date.getTime() - right.date.getTime())
  return adjustTransactions({ transactions })
}

function orders<T> (first: T, second: T): T[][] {
  return [[first, second], [second, first]]
}

function oppositeMovement (properties: Partial<Movement> = {}): Movement {
  return {
    id: null,
    account: { type: AccountType.cash, instrument: 'USD', company: null, syncIds: null },
    invoice: null,
    sum: 40,
    fee: 0,
    ...properties
  }
}

// These domain-only models verify reconciliation invariants, not bank formats or observed BGPB events.
// ID-001, STATUS-001, AMOUNT-001/002 and TRANSFER-004 apply to the complete final monetary result.
describe('[model] deterministic statement and recent reconciliation', () => {
  it('returns the same complete result for every source ordering in a greedy overlap', () => {
    const early = transaction('statement-early')
    const late = transaction('statement-late', 180000)
    const recentMiddle = transaction('recent-middle', 90000)
    const recentEarly = transaction('recent-early', -120000)
    for (const statements of orders(early, late)) {
      for (const recent of orders(recentMiddle, recentEarly)) {
        expect(finalResult(statements, recent)).toEqual([early, late])
      }
    }
  })

  it('retains equal-valued distinct identities and orders statement ties consistently', () => {
    const first = transaction('statement-a')
    const second = transaction('statement-b')
    const recentA = transaction('recent-a')
    const recentB = transaction('recent-b')
    for (const statements of orders(first, second)) {
      expect(transactionsUnique(statements)).toEqual(statements)
      for (const recent of orders(recentA, recentB)) {
        expect(finalResult(statements, recent)).toEqual([first, second])
      }
    }
  })

  it('selects the same unmatched recent identity when candidate dates tie', () => {
    const statement = transaction('statement')
    const recentA = transaction('recent-a')
    const recentB = transaction('recent-b')
    for (const recent of orders(recentA, recentB)) {
      expect(finalResult([statement], recent)).toEqual([statement, recentB])
    }
  })

  it.each([
    { sum: -11, instrument: 'USD' },
    { sum: -10, instrument: 'EUR' }
  ])('retains both transactions when known invoices contradict: %j', invoice => {
    const statement = transaction('statement', 0, {}, { invoice: { sum: -10, instrument: 'USD' } })
    const recent = transaction('recent', 1000, {}, { invoice })
    expect(finalResult([statement], [recent])).toEqual([statement, recent])
  })

  it('retains both transactions when known fees contradict', () => {
    const statement = transaction('statement')
    const recent = transaction('recent', 1000, {}, { fee: -1 })
    expect(finalResult([statement], [recent])).toEqual([statement, recent])
  })

  it('retains both transactions when the number of movements differs', () => {
    const statement = transaction('statement')
    statement.movements = [statement.movements[0], oppositeMovement()]
    const recent = transaction('recent', 1000)
    expect(finalResult([statement], [recent])).toEqual([statement, recent])
  })

  it.each<Partial<Movement>>([
    { sum: 41 },
    { fee: -1 },
    { invoice: { sum: 11, instrument: 'EUR' } },
    { account: { type: AccountType.ccard, instrument: 'USD', company: null, syncIds: null } },
    { account: { type: AccountType.cash, instrument: 'EUR', company: null, syncIds: null } }
  ])('retains contradictory second-movement amounts, fees or account structure: %j', properties => {
    const statement = transaction('statement')
    statement.movements = [statement.movements[0], oppositeMovement({ invoice: { sum: 10, instrument: 'EUR' } })]
    const recent = transaction('recent', 1000)
    recent.movements = [recent.movements[0], oppositeMovement({ invoice: { sum: 10, instrument: 'EUR' }, ...properties })]
    expect(finalResult([statement], [recent])).toEqual([statement, recent])
  })

  it('retains contradictory known second-movement account IDs', () => {
    const statement = transaction('statement')
    statement.movements = [statement.movements[0], oppositeMovement({ account: { id: 'model-b' } })]
    const recent = transaction('recent', 1000)
    recent.movements = [recent.movements[0], oppositeMovement({ account: { id: 'model-c' } })]
    expect(finalResult([statement], [recent])).toEqual([statement, recent])
  })

  it('still matches when one source lacks invoice enrichment', () => {
    const statement = transaction('statement', 0, {}, { invoice: { sum: -10, instrument: 'USD' } })
    const recent = transaction('recent', 1000)
    expect(finalResult([statement], [recent])).toEqual([statement])
  })

  it('does not treat different merchant text as proof of separate events', () => {
    const statement = transaction('statement', 0, {
      merchant: { title: 'Model A', city: null, country: null, mcc: null, location: null }
    })
    const recent = transaction('recent', 1000, {
      merchant: { fullTitle: 'Model B', mcc: null, location: null }
    })
    expect(finalResult([statement], [recent])).toEqual([statement])
  })

  it('allows the same source identity to have different enrichment across endpoints', () => {
    const statement = transaction('shared-source-id')
    const recent = transaction('shared-source-id', 30000, { comment: 'Model additional detail' })
    expect(finalResult([statement], [recent])).toEqual([statement])
  })

  it('keeps pending separate and preserves the inclusive two-minute window', () => {
    const statement = transaction('statement')
    const pending = transaction('pending', 1000, { hold: true })
    const boundary = transaction('boundary', 120000)
    const outside = transaction('outside', 120001)
    expect(finalResult([statement], [pending])).toEqual([statement, pending])
    expect(finalResult([statement], [boundary])).toEqual([statement])
    expect(finalResult([statement], [outside])).toEqual([statement, outside])
  })

  it('preserves both actual domain sides through final transfer grouping', () => {
    const debit = transaction('statement-debit', 0, { groupKeys: ['model-transfer'] })
    const credit = transaction('statement-credit', 1000, { groupKeys: ['model-transfer'] }, { account: { id: 'model-b' }, sum: 40 })
    const recentDebit = transaction('recent-debit', 1000)
    const recentCredit = transaction('recent-credit', 2000, {}, { account: { id: 'model-b' }, sum: 40 })
    const expected: Transaction = {
      date: new Date(baseTime),
      hold: false,
      merchant: null,
      comment: null,
      movements: [debit.movements[0], credit.movements[0]]
    }
    for (const statements of orders(debit, credit)) {
      for (const recent of orders(recentDebit, recentCredit)) {
        expect(finalResult(statements, recent)).toEqual([expected])
      }
    }
  })
})

// Exact structural equality is modeled separately from any bank's source-ID semantics.
describe('[model] transaction duplicate identity', () => {
  it('removes exact repeats even when object property insertion order differs', () => {
    const first = transaction(null)
    const repeated: ExtendedTransaction = {
      movements: [{ fee: 0, sum: -40, invoice: null, account: { id: 'model-a' }, id: null }],
      merchant: null,
      comment: null,
      hold: false,
      date: new Date(baseTime)
    }
    expect(transactionsUnique([first, repeated])).toEqual([first])
    expect(finalResult([first, repeated], [])).toEqual([first])
  })

  it('removes exact repeats with a known ID and preserves distinct IDs', () => {
    const first = transaction('same')
    const repeated = transaction('same')
    const separate = transaction('separate')
    expect(transactionsUnique([first, repeated, separate])).toEqual([first, separate])
    expect(finalResult([first, repeated, separate], [])).toEqual([first, separate])
  })

  it('retains ID-less transactions with different hold states or fees', () => {
    const posted = transaction(null)
    const pending = transaction(null, 0, { hold: true })
    const charged = transaction(null, 0, {}, { fee: -1 })
    expect(transactionsUnique([posted, pending, charged])).toEqual([posted, pending, charged])
    expect(finalResult([], [posted, pending, charged])).toEqual([charged, posted, pending])
  })

  it('retains ID-less transactions with different grouping evidence', () => {
    const first = transaction(null, 0, { groupKeys: ['model-a'] })
    const second = transaction(null, 0, { groupKeys: ['model-b'] })
    expect(transactionsUnique([first, second])).toEqual([first, second])
    expect(finalResult([first, second], [])).toEqual([transaction(null), transaction(null)])
  })

  it('retains ID-less transactions with different second movements', () => {
    const first = transaction(null)
    first.movements = [first.movements[0], oppositeMovement()]
    const second = transaction(null)
    second.movements = [second.movements[0], oppositeMovement({ sum: 41 })]
    expect(transactionsUnique([first, second])).toEqual([first, second])
    expect(finalResult([first, second], [])).toEqual([first, second])
  })

  it('keeps field boundaries when comments and merchant names contain colons', () => {
    const first = transaction(null, 0, {
      comment: 'alpha:beta', merchant: { title: 'gamma', city: null, country: null, mcc: null, location: null }
    })
    const second = transaction(null, 0, {
      comment: 'alpha', merchant: { title: 'beta:gamma', city: null, country: null, mcc: null, location: null }
    })
    expect(transactionsUnique([first, second])).toEqual([first, second])
    expect(finalResult([first, second], [])).toEqual([second, first])
  })

  it.each<Partial<ExtendedTransaction>>([
    { hold: true },
    { comment: 'Model conflicting description' },
    { groupKeys: ['model-conflicting-group'] },
    { movements: [{ id: 'same', account: { id: 'model-a' }, invoice: null, sum: -41, fee: 0 }] }
  ])('reports a conflicting known ID as an ordinary sanitized error: %j', properties => {
    const first = transaction('same')
    const conflicting = transaction('same', 0, properties)
    const assertion = jest.spyOn(console, 'assert')
    try {
      let failure: unknown
      try {
        finalResult([first, conflicting], [])
      } catch (error) {
        failure = error
      }
      expect(failure).toBeInstanceOf(Error)
      expect(failure).not.toBeInstanceOf(ZPAPIError)
      expect(failure).toEqual(new Error('Conflicting BGPB transactions share a movement ID'))
      expect(assertion).toHaveBeenLastCalledWith(false, 'Conflicting BGPB transactions share a movement ID')
    } finally {
      assertion.mockRestore()
    }
  })
})
