import { ensureSyncIDsAreUniqueButSanitized, parseOuterAccountData, sanitizeSyncId, trimSyncId } from './accounts'

describe('ensureSyncIDsAreUniqueButSanitized', () => {
  it('truncate syncID to last4 digits if there is no intersection between accounts', () => {
    const accounts = [
      { syncID: ['0001', '111120'], instrument: 'RUB' },
      { syncID: ['0002', '2222'], instrument: 'RUB' },
      { syncID: ['0003'], instrument: 'RUB' }
    ]
    const expected = [
      { syncID: ['0001', '1120'], instrument: 'RUB' },
      { syncID: ['0002', '2222'], instrument: 'RUB' },
      { syncID: ['0003'], instrument: 'RUB' }
    ]
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId })).toEqual(expected)
  })

  it('remove syncIDs from array when it have sanitized duplicates and account.syncID.length > 1', () => {
    const accounts = [
      { syncID: ['553691******8014', '220070******2770', '5246653686'], instrument: 'RUB' },
      { syncID: ['220070******2676', '220070******2770', '5044139205'], instrument: 'RUB' },
      { syncID: ['5536914782328014', '220070******2770', '5246653686'], instrument: 'USD' },
      { syncID: ['5536914797388014', '220070******2234', '5044139205'], instrument: 'USD' },
      { syncID: ['553691******0112', '220070******2313', '5246653686'], instrument: 'EUR' },
      { syncID: ['553691******3872', '220070******2789', '5044139205'], instrument: 'EUR' }
    ]
    const expected = [
      { syncID: ['8014', '3686'], instrument: 'RUB' },
      { syncID: ['2676', '9205'], instrument: 'RUB' },
      { syncID: ['2770', '3686'], instrument: 'USD' },
      { syncID: ['2234', '9205'], instrument: 'USD' },
      { syncID: ['0112', '2313', '3686'], instrument: 'EUR' },
      { syncID: ['3872', '2789', '9205'], instrument: 'EUR' }
    ]
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId })).toEqual(expected)
  })

  it('throw error when it have sanitized duplicates and account.syncID.length === 1', () => {
    const accounts = [
      { syncID: ['220070******2770'], instrument: 'RUB' },
      { syncID: ['220070******2770'], instrument: 'RUB' }
    ]
    expect(() => ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId })).toThrow()
  })

  it('throw error when it have sanitized duplicates and account.syncID.length equals 1 and 2', () => {
    const accounts = [
      { syncID: ['220070******2770', '220070******2773'], instrument: 'RUB' },
      { syncID: ['220070******2770'], instrument: 'RUB' }
    ]
    expect(() => ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId })).toThrow()
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
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId })).toEqual(expected)
  })

  it('doesn\'t trim, but sanitizes syncID to guarantee id uniqueness between accounts with the same instrument', () => {
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
    expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId })).toEqual(expected)
  })
})

describe('sanitizeSyncId', () => {
  it('doesn\'t touch ids shorter than 16 chars (already sanitized?)', () => {
    const tinyId = '00000121120'
    expect(sanitizeSyncId(tinyId)).toEqual(tinyId)
    const shortId = '123456789012345'
    expect(sanitizeSyncId(shortId)).toEqual(shortId)
  })

  it('doesn\'t touch anything with * present (already sanitized?)', () => {
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

describe('trimSyncId', () => {
  it.each([
    ['00000121120', '1120'],
    ['123456789012345', '2345'],
    ['2***438', '*438'],
    ['2****38', '2*38'],
    ['2*****8', '2**8'],
    ['2625********71', '2*71'],
    ['1234', '1234'],
    ['*1234', '1234'],
    ['*234', '*234'],
    ['**34', '**34'],
    ['***4', '***4'],
    ['1***', '1***'],
    ['1234***', '4***']
  ])('cuts insignificant characters', (syncId, trimmedSyncId) => {
    expect(trimSyncId(syncId)).toEqual(trimmedSyncId)
  })
})

describe('parseOuterAccountData', () => {
  it.each([
    ['CARD2CARD ALFA_MOBILE', { type: 'ccard', company: { id: '3' } }],
    ['C2C ALFA_MOBILE', { type: 'ccard', company: { id: '3' } }],
    ['СБЕРБАНК', { type: null, company: { id: '4624' } }],
    ['TINKOFF BANK CARD2CARD', { type: 'ccard', company: { id: '4902' } }],
    ['Тинькофф', { type: null, company: { id: '4902' } }],
    ['Tинькoфф', { type: null, company: { id: '4902' } }], // strange typing, not equal to previous line
    ['TINKOFF', { type: null, company: { id: '4902' } }],
    ['СовКомБанк', { type: null, company: { id: '4534' } }],
    ['Ситибанк', { type: null, company: { id: '4859' } }],
    ['Яндекс.Деньг', { type: null, company: { id: '15420' } }],
    ['YANDEX.MONEY', { type: null, company: { id: '15420' } }],
    ['Рокетбанк', { type: null, company: { id: '15444' } }],
    ['Rocketbank.ru Card2Car', { type: 'ccard', company: { id: '15444' } }],
    ['Home Credit Bank', { type: null, company: { id: '4412' } }],
    ['HCFB', { type: null, company: { id: '4412' } }],
    ['C2C R-ONLINE', { type: 'ccard', company: { id: '5156' } }],
    ['OPEN.RU CARD2CARD', { type: 'ccard', company: { id: '4761' } }],
    ['Ozon-Pay', { type: null, company: { id: '15685' } }],
    ['QIWI', { type: null, company: { id: '15592' } }],
    ['MONODirect', { type: 'ccard', company: { id: '15620' } }],
    ['Приват', { type: null, company: { id: '12574' } }],
    ['P24', { type: null, company: { id: '12574' } }],
    ['CREDIT EUROPE BANK', { type: null, company: { id: '5165' } }],
    ['УКРСИББАНК', { type: null, company: { id: '15395' } }],
    ['УРАЛСИБ', { type: null, company: { id: '4783' } }]
  ])('should convert \'%s\' string to account reference data', (str, data) => {
    expect(parseOuterAccountData(str)).toEqual(data)
  })
})
