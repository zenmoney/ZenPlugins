import { parseApiAmount } from './api'

test('parseApiAmount', () => {
  expect(parseApiAmount('8 936.66')).toEqual(8936.66)
})
