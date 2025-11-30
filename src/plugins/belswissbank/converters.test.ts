import { parseDate } from './converters'

describe('parseDate', () => {
  test('timezone?', () => {
    expect(parseDate('29/12/2023 12:12:01')).toEqual(new Date('2023-12-29T11:12:01Z'))
    expect(parseDate('29/10/2023 10:53:48')).toEqual(new Date('2023-10-29T09:53:48Z'))
    expect(parseDate('05/10/2023 13:43:10')).toEqual(new Date('2023-10-05T11:43:10Z'))
  })
})
