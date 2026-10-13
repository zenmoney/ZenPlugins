import { add, subtract, decimal, minorUnits, divideExact } from './decimal'

// Synthetic values model exact decimal arithmetic independently of provider formats.
test('[model] decimal arithmetic preserves exact decimal values', () => {
  expect(add('0.1', '0.2')).toBe('0.3')
  expect(subtract('219390', '32800.09')).toBe('186589.91')
  expect(minorUnits('9007199254740993')).toBe('90071992547409.93')
  expect(decimal(1e-7)).toBe('0.0000001')
  expect(divideExact('2', '3')).toBeUndefined()
  expect(divideExact('0.03', '3')).toBe('0.01')
  for (const invalid of [null, undefined, '', '1x', NaN, Infinity, 9007199254740992]) expect(() => decimal(invalid)).toThrow()
})
