import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from './accounts'

describe('ensureSyncIDsAreUniqueButSanitized', () => {
  it('truncate syncID to last4 digits if there is no intersection between accounts', () => {
    const accounts = [
      { syncID: ['0001', '111120'] },
      { syncID: ['0002', '2222'] },
      { syncID: ['0003'] }
    ]
    const expected = [
      { syncID: ['0001', '1120'] },
      { syncID: ['0002', '2222'] },
      { syncID: ['0003'] }
    ]
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId: sanitizeSyncId })).toEqual(expected)
  })

  it('truncates syncID to last 4 digits if there is intersection between accounts with different instruments', () => {
    const accounts = [
      { syncID: ['0001', '121120'], instrument: 'RUB' },
      { syncID: ['0002', '111120'], instrument: 'USD' },
      { syncID: ['0003'] }
    ]
    const expected = [
      { syncID: ['0001', '1120'], instrument: 'RUB' },
      { syncID: ['0002', '1120'], instrument: 'USD' },
      { syncID: ['0003'] }
    ]
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId: sanitizeSyncId })).toEqual(expected)
  })

  it("doesn't trim, but sanitizes syncID to guarantee id uniqueness between accounts with the same instrument", () => {
    const accounts = [
      { syncID: ['0001', '00000121120'], instrument: 'RUB' },
      { syncID: ['0002', '00000111120'], instrument: 'RUB' },
      { syncID: ['0003'] }
    ]
    const expected = [
      { syncID: ['0001', 'sanitized(00000121120)'], instrument: 'RUB' },
      { syncID: ['0002', 'sanitized(00000111120)'], instrument: 'RUB' },
      { syncID: ['0003'] }
    ]
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId: (x) => `sanitized(${x})` })).toEqual(expected)
  })

  it('leaves full syncID if there is intersection but syncID are short', () => {
    const accounts = [
      { syncID: ['0001', '121120'], instrument: 'RUB' },
      { syncID: ['0002', '111120'], instrument: 'RUB' },
      { syncID: ['0003'] }
    ]
    const expected = [
      { syncID: ['0001', '121120'], instrument: 'RUB' },
      { syncID: ['0002', '111120'], instrument: 'RUB' },
      { syncID: ['0003'] }
    ]
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId: sanitizeSyncId })).toEqual(expected)
  })
})

describe('sanitizeSyncId', () => {
  it("doesn't touch ids shorter than 16 chars (already sanitized?)", () => {
    const tinyId = '00000121120'
    expect(sanitizeSyncId(tinyId)).toEqual(tinyId)
    const shortId = '123456789012345'
    expect(sanitizeSyncId(shortId)).toEqual(shortId)
  })

  it("doesn't touch anything with * present (already sanitized?)", () => {
    const cardId = '123456789*123456'
    expect(sanitizeSyncId(cardId)).toEqual(cardId)
  })

  it('cuts first 5 chars if id is longer than 16 chars (looks like an account id)', () => {
    expect(sanitizeSyncId('12345678901234567')).toEqual('*****678901234567')
  })

  it('cuts [6..12)-indexed chars if id length is 16 chars (looks like a card number)', () => {
    expect(sanitizeSyncId('1234567890123456')).toEqual('123456******3456')
  })
})
