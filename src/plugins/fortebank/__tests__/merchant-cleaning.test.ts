import { cleanTransactionComment, detectCityCountryLocation } from '../merchant-utils'

describe('cleanTransactionComment', () => {
  it('should remove MCC', () => {
    const merchant = { mcc: 5411 }
    const text = 'Purchase MCC 5411'
    expect(cleanTransactionComment(text, merchant)).toBe('Purchase')
  })

  it('should remove city', () => {
    const merchant = { city: 'Almaty' }
    const text = 'Purchase Almaty'
    expect(cleanTransactionComment(text, merchant)).toBe('Purchase')
  })

  it('should remove country code', () => {
    const merchant = { country: 'Kazakhstan' }
    const text = 'Purchase KZ'
    expect(cleanTransactionComment(text, merchant)).toBe('Purchase')
  })

  it('should remove currency', () => {
    const merchant = {}
    const text = 'Purchase KZT 100'
    expect(cleanTransactionComment(text, merchant)).toBe('Purchase 100')
  })

  it('should remove everything combined', () => {
    const merchant = {
      city: 'Almaty',
      country: 'Kazakhstan',
      mcc: 5411
    }
    const text = 'Purchase Almaty KZ MCC 5411 KZT'
    expect(cleanTransactionComment(text, merchant)).toBe('Purchase')
  })

  it('should handle null merchant', () => {
    // cleanTransactionComment expects a merchant object, even if empty/partial
    // In converters, we pass either a populated merchant or a fallback one.
    // However, we should handle the case where fields are null.
    const merchant = { mcc: null, city: null, country: null }
    const text = 'Purchase Almaty'
    expect(cleanTransactionComment(text, merchant)).toBe('Purchase Almaty')
  })

  it('should preserve unrelated text', () => {
    const merchant = { city: 'Almaty' }
    const text = 'Starbucks Coffee Almaty Details'
    expect(cleanTransactionComment(text, merchant)).toBe('Starbucks Coffee Details')
  })
})

describe('Merchant Utils - Cleaning', () => {
  it('should remove multiple occurrences of city names from merchant title', () => {
    const rawTitle = 'NAURYZ SHAKHRISTAN SHOP, ALMATY, ALMATY, KZ'
    const result = detectCityCountryLocation(rawTitle)

    expect(result).not.toBeNull()
    if (result != null) {
      expect(result.city).toBe('Almaty')
      expect(result.country).toBe('Kazakhstan')
      // Current behavior (bug): 'NAURYZ SHAKHRISTAN SHOP, , ALMATY'
      // Expected behavior: 'NAURYZ SHAKHRISTAN SHOP'
      expect(result.locationPoint).toBe('NAURYZ SHAKHRISTAN SHOP')
    }
  })

  it('should clean up ZOKIROV example', () => {
    const rawTitle = 'IP ZOKIROV,ALMATY,ALMATY,KZ'
    const result = detectCityCountryLocation(rawTitle)

    expect(result).not.toBeNull()
    if (result != null) {
      expect(result.city).toBe('Almaty')
      expect(result.country).toBe('Kazakhstan')
      expect(result.locationPoint).toBe('ZOKIROV')
    }
  })
})
