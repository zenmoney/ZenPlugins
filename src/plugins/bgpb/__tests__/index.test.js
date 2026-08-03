import { shouldFetchFullStatement } from '../index'

describe('statement source selection', () => {
  it('uses protected mailbox statements for complete deposit and card history', () => {
    expect(shouldFetchFullStatement({
      type: 'deposit',
      transactionsAccId: 'deposit-statement'
    }, true)).toBe(true)

    expect(shouldFetchFullStatement({
      type: 'card',
      transactionsAccId: 'card-statement'
    }, true)).toBe(true)
  })

  it('does not request a statement without device authorization or an action id', () => {
    expect(shouldFetchFullStatement({
      type: 'deposit',
      transactionsAccId: 'deposit-statement'
    }, false)).toBe(false)

    expect(shouldFetchFullStatement({
      type: 'deposit',
      transactionsAccId: null
    }, true)).toBe(false)
  })
})
