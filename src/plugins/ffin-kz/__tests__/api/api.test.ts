import { parseBalance } from '../../api'
import { Amount } from '../../../../types/zenmoney'

describe('parseBalance', () => {
  it.each([
    [
      'Доступно на 02.01.202519,455.00₸',
      { sum: 19455.00, instrument: 'KZT' }
    ],
    [
      'Доступно на 15.03.2023100,000.50₸',
      { sum: 100000.50, instrument: 'KZT' }
    ],
    [
      'Доступно на 01.12.20250.00₸',
      { sum: 0.00, instrument: 'KZT' }
    ],
    [
      'Доступно на 25.07.2023123,456.78₸',
      { sum: 123456.78, instrument: 'KZT' }
    ],
    [
      'Доступно на 25.07.2023 123,456.78₸',
      { sum: 123456.78, instrument: 'KZT' }
    ]
  ])('parses balance from text "%s"', (text, expected: Amount) => {
    expect(parseBalance(text)).toEqual(expected)
  })

  it('throws an error when balance cannot be parsed', () => {
    expect(() => parseBalance('Invalid balance text')).toThrow('Can\'t parse balance from account statement')
  })
})
