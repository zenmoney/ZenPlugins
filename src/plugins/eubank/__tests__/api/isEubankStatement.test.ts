import { isEubankStatement } from '../../api'

describe('isEubankStatement', () => {
  it('should return true for Eurasian Bank statement', () => {
    expect(isEubankStatement('АО "Евразийский Банк"\nA25Y5K2, г. Алматы')).toBe(true)
  })

  it('should return true case-insensitive', () => {
    expect(isEubankStatement('евразийский банк выписка')).toBe(true)
  })

  it('should return false for Kaspi statement', () => {
    expect(isEubankStatement('Kaspi Bank ВЫПИСКА по Kaspi Gold за период')).toBe(false)
  })

  it('should return false for Freedom Bank statement', () => {
    expect(isEubankStatement('Фридом Банк Казахстан')).toBe(false)
  })

  it('should return false for empty text', () => {
    expect(isEubankStatement('')).toBe(false)
  })
})
