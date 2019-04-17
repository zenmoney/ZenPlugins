import { distinctTransactions } from './distinctTransactions'

describe('distinctTransactions', () => {
  const transactions = [
    {},
    {},
    { type: 1 },
    { type: 1 },
    { type: 2 }
  ]

  it('unique for equal transactions', () => {
    const assertion = distinctTransactions({
      transactions
    })
    const expectation = [
      {},
      { type: 1 },
      { type: 2 }
    ]
    expect(assertion).toEqual(expectation)
  })

  it('respects with makeEqualityObject', () => {
    const assertion = distinctTransactions({
      transactions,
      makeEqualityObject: transaction => ({ ...transaction, ...(transaction.type ? { type: undefined } : {}) })
    })
    const expectation = [
      {},
      { type: 1 }
    ]
    expect(assertion).toEqual(expectation)
  })
})
