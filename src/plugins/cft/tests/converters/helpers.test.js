/**
 * @author Ryadnov Andrey <me@ryadnov.ru>
 */

import * as helper from '../../converters/helpers'

describe('resolveCurrencyCode', () => {
  it('should return fixed currency code', () => {
    expect(helper.resolveCurrencyCode('USD')).toBe('USD')
    expect(helper.resolveCurrencyCode('RUB')).toBe('RUB')
    expect(helper.resolveCurrencyCode('RUR')).toBe('RUB')
  })
})

describe('cardUniqueAccountId', () => {
  it('should return unique account id for card', () => {
    expect(helper.cardUniqueAccountId('1111')).toBe('c-1111')
    expect(helper.cardUniqueAccountId(1111)).toBe('c-1111')
    expect(helper.cardUniqueAccountId('aaa')).toBe('c-aaa')
  })
})

describe('walletUniqueAccountId', () => {
  it('should return unique account id for wallet', () => {
    expect(helper.walletUniqueAccountId('1111')).toBe('w-1111')
    expect(helper.walletUniqueAccountId(1111)).toBe('w-1111')
    expect(helper.walletUniqueAccountId('aaa')).toBe('w-aaa')
  })
})

describe('mapContractToAccount', () => {
  it('should return map contractor id to account id', () => {
    const data = helper.mapContractToAccount([
      {
        id: '123',
        contractId: 123456
      },
      {
        id: 124,
        contractId: '123457'
      },
      {
        id: 125,
        contractId: 123458,
        otherData: 'something'
      }
    ])

    expect(data).toEqual({
      '123456': 'c-123',
      '123457': 'c-124',
      '123458': 'c-125'
    })
  })
})
