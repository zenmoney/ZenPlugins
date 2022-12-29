import { sanitize } from '../../utils/sanitize'

describe(sanitize.name, () => {
  it('should sanitize strings', () => {
    expect(sanitize('1234567890')).toBe('1234**7890')
    expect(sanitize('1234')).toBe('1234')
  })

  it('should sanitize objects', () => {
    expect(sanitize({ a: '1234567890', b: '1234', c: 1234 })).toEqual({ a: '1234**7890', b: '1234', c: 1234 })
  })

  it('should sanitize arrays', () => {
    expect(sanitize(['1234567890', '1234'])).toEqual(['1234**7890', '1234'])
  })

  it('should sanitize nested objects', () => {
    expect(sanitize({ a: '1234567890', b: { c: '1234567890' } })).toEqual({ a: '1234**7890', b: { c: '1234**7890' } })
  })

  it('should sanitize nested arrays', () => {
    expect(sanitize({ a: '1234567890', b: ['1234567890'] })).toEqual({ a: '1234**7890', b: ['1234**7890'] })
  })

  it('should not sanitize numbers', () => {
    expect(sanitize(1234567890)).toBe(1234567890)
  })

  it('should not sanitize dates', () => {
    const date = new Date('2022-01-01')
    expect(sanitize(date)).toBe(date)
  })

  it('should not sanitize ignored keys', () => {
    expect(sanitize({ a: '1234567890', b: '1234567890' }, ['a'])).toEqual({ a: '1234567890', b: '1234**7890' })
  })
})
