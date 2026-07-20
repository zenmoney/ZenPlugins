import { Transaction } from '../../../../types/zenmoney'
import { convertTransaction } from '../../converters'
import { JupiterTransaction } from '../../models'

// convertTransaction returns null for unusable records; these cases expect a value
function convert (t: JupiterTransaction, accountId = 'acct_1'): Transaction {
  const result = convertTransaction(t, accountId)
  if (result == null) {
    throw new Error('expected a transaction, got null')
  }
  return result
}

function tx (overrides: Partial<JupiterTransaction> = {}): JupiterTransaction {
  return {
    id: 'tx_1',
    type: 'CARD',
    direction: 'DEBIT',
    settlementCurrency: 'USD',
    settlementAmount: '10.00',
    transactionCurrency: 'USD',
    transactionAmount: '10.00',
    onchainSignature: null,
    transactionTimestamp: '2026-07-01T12:00:00.000Z',
    card: { merchantName: 'COFFEE SHOP', merchantCategoryCode: '5814', settlementTimestamp: '2026-07-01T12:01:00.000Z' },
    ...overrides
  }
}

describe('convertTransaction', () => {
  it('DEBIT purchase → negative movement with merchant, no comment', () => {
    const transaction = convert(tx(), 'acct_1')
    expect(transaction.movements[0]).toEqual({ id: 'tx_1', account: { id: 'acct_1' }, invoice: null, sum: -10, fee: 0 })
    expect(transaction.merchant).toEqual({ fullTitle: 'COFFEE SHOP', mcc: 5814, location: null })
    expect(transaction.hold).toBe(false)
    expect(transaction.comment).toBeNull()
    expect(transaction.date).toEqual(new Date('2026-07-01T12:00:00.000Z'))
  })

  it('CREDIT → positive sum', () => {
    expect(convert(tx({ direction: 'CREDIT', settlementAmount: '5.00' }), 'a').movements[0].sum).toBe(5)
  })

  it('foreign-currency purchase carries an invoice in the original currency', () => {
    const transaction = convert(
      tx({ settlementAmount: '11.00', transactionCurrency: 'EUR', transactionAmount: '10.00' }),
      'a'
    )
    expect(transaction.movements[0].sum).toBe(-11)
    expect(transaction.movements[0].invoice).toEqual({ sum: -10, instrument: 'EUR' })
  })

  it('pending card auth (no settlement) → hold true', () => {
    const transaction = convert(
      tx({ card: { merchantName: 'X', merchantCategoryCode: '5814', settlementTimestamp: null } }),
      'a'
    )
    expect(transaction.hold).toBe(true)
  })

  it('USDC deposit → income, no merchant, on-chain signature in the comment', () => {
    const transaction = convert(
      tx({ type: 'DEPOSIT', direction: 'CREDIT', settlementAmount: '500.00', onchainSignature: '5xSig', card: null }),
      'a'
    )
    expect(transaction.movements[0].sum).toBe(500)
    expect(transaction.merchant).toBeNull()
    expect(transaction.hold).toBe(false)
    expect(transaction.comment).toContain('deposit')
    expect(transaction.comment).toContain('5xSig')
  })

  describe('refuses to write corrupt records into the ledger', () => {
    it('skips a transaction with an unparseable timestamp (would become an Invalid Date)', () => {
      expect(convertTransaction(tx({ transactionTimestamp: 'not-a-date' }), 'a')).toBeNull()
    })

    it('skips a transaction with a malformed amount (would silently become 0)', () => {
      expect(convertTransaction(tx({ settlementAmount: 'abc' }), 'a')).toBeNull()
      expect(convertTransaction(tx({ settlementAmount: '' }), 'a')).not.toBeNull() // '' → 0 is a real zero
    })

    it('a missing id becomes null (a valid dedup key), never the string "undefined"', () => {
      const transaction = convert(tx({ id: undefined }), 'a')
      expect(transaction.movements[0].id).toBeNull()
    })

    it('ignores a malformed original-currency amount instead of inventing an invoice', () => {
      const transaction = convert(tx({ transactionCurrency: 'EUR', transactionAmount: 'oops' }), 'a')
      expect(transaction.movements[0].invoice).toBeNull()
    })
  })

  describe('never guesses money it cannot classify', () => {
    it.each([
      ['missing', undefined],
      ['null', null],
      ['empty', ''],
      ['an unknown value', 'REFUND'],
      ['wrong case', 'credit']
    ])('skips a transaction whose direction is %s (guessing would flip income into an expense)', (_label, direction) => {
      expect(convertTransaction(tx({ direction, settlementAmount: '500.00' }), 'a')).toBeNull()
    })

    it('does not crash when `type` is missing (a TypeError would kill the whole sync)', () => {
      const transaction = convert(tx({ type: undefined, card: null, onchainSignature: 'sig1' }), 'a')
      expect(transaction.comment).toBe('sig:sig1')
    })

    it('still converts a well-formed CREDIT as income', () => {
      const transaction = convert(tx({ direction: 'CREDIT', settlementAmount: '500.00' }), 'a')
      expect(transaction.movements[0].sum).toBe(500)
    })
  })

  describe('declined card charges', () => {
    const carded = (status: string | null): JupiterTransaction =>
      tx({ card: { merchantName: 'COFFEE SHOP', merchantCategoryCode: '5814', status, settlementTimestamp: null } })

    it('does NOT book INSUFFICIENT_FUNDS — a decline moved no money', () => {
      // It has a full amount and a valid date; only card.status reveals it was refused.
      expect(convertTransaction(carded('INSUFFICIENT_FUNDS'), 'a')).toBeNull()
    })

    it('books COMPLETED and AUTHORIZED', () => {
      expect(convertTransaction(carded('COMPLETED'), 'a')).not.toBeNull()
      const held = convert(carded('AUTHORIZED'), 'a')
      expect(held.hold).toBe(true) // authorised but unsettled
    })

    it('skips an UNSEEN status rather than booking it on a guess (allowlist)', () => {
      for (const s of ['DO_NOT_HONOR', 'EXPIRED', 'REVERSED', 'DECLINED']) {
        expect(convertTransaction(carded(s), 'a')).toBeNull()
      }
    })

    it('books a card row with no status — older records lack the field', () => {
      expect(convertTransaction(carded(null), 'a')).not.toBeNull()
      expect(convertTransaction(tx(), 'a')).not.toBeNull() // fixture has no status
    })

    it('never declines an on-chain movement (deposits/withdrawals carry no status)', () => {
      const deposit = tx({ type: 'DEPOSIT', direction: 'CREDIT', settlementAmount: '500.00', card: null, onchainSignature: 'sig1' })
      expect(convertTransaction(deposit, 'a')).not.toBeNull()
    })
  })
})
