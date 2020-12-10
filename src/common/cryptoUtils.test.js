import { getX919MAC } from './cryptoUtils'

describe('X9.19 MAC', () => {
  it.each([
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 1, 3, -92, 48, 6, -128, 0, 0],
      '6b2cb6e00b18d4900ba2c9b55cce2cf312f5128464aa001a',
      '6fe8acbd46b04dc2'
    ]
  ])('gets X9.19 MAC no padding', (data, key, hash) => {
    expect(getX919MAC(data, key)).toEqual(hash)
  })

  it.each([
    [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 1, 3, -92, 48, 6, -128, 0, 0, 9],
      '31373538363432333131323233333434',
      'b0bcfd0e1b72250a'
    ]
  ])('gets X9.19 MAC with padding 0', (data, key, hash) => {
    expect(getX919MAC(data, key)).toEqual(hash)
  })
})
