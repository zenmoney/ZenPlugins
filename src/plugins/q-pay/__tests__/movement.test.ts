import { normalizeCardMovement } from '../converters'

describe('[model] Q-Pay movement normalization', () => {
  // These are domain movements, not API fixtures. The supplied log contains no
  // zero-charge record; only explicitly known zero amounts may be omitted.
  it('omits a movement with zero sum and zero fee', () => {
    expect(normalizeCardMovement({
      id: 'model-empty',
      account: { id: 'model-card' },
      sum: 0,
      fee: 0,
      invoice: null
    })).toBeNull()
  })

  // A fee-only movement remains a debit regardless of the source operation type.
  it('moves a fee into a zero sum without changing the total account effect', () => {
    expect(normalizeCardMovement({
      id: 'model-fee',
      account: { id: 'model-card' },
      sum: 0,
      fee: -0.03,
      invoice: null
    })).toEqual({
      id: 'model-fee',
      account: { id: 'model-card' },
      sum: -0.03,
      fee: 0,
      invoice: null
    })
  })

  // Unknown account amounts must not be mistaken for known zero amounts.
  it('preserves an unknown account sum with a known foreign-currency invoice', () => {
    expect(normalizeCardMovement({
      id: 'model-unknown',
      account: { id: 'model-card' },
      sum: null,
      fee: 0,
      invoice: { sum: -5, instrument: 'EUR' }
    })).toEqual({
      id: 'model-unknown',
      account: { id: 'model-card' },
      sum: null,
      fee: 0,
      invoice: { sum: -5, instrument: 'EUR' }
    })
  })
})
