import { ensureCurrency } from '../../helpers'

describe('ensureCurrency', () => {
  it('returns currency name as-is if input is not a number', () => {
    expect(ensureCurrency('USD')).toBe('USD')
  })

  it('returns currency name from lookup if input is a numeric code string', () => {
    expect(ensureCurrency('978')).toBe('EUR')
  })

  it('returns undefined if numeric code is not in lookup', () => {
    expect(ensureCurrency('1999')).toBeUndefined()
    expect(ensureCurrency('0')).toBeUndefined()
  })
})
