import { parseDate } from './converters'

describe('parseDate', () => {
  test('timezone is parsed as Minsk', () => {
    expect(parseDate('29/12/2023 12:12:01')).toEqual(new Date('2023-12-29T12:12:01+0300'))
    expect(parseDate('29/10/2023 10:53:48')).toEqual(new Date('2023-10-29T10:53:48+0300'))
    expect(parseDate('05/10/2023 13:43:10')).toEqual(new Date('2023-10-05T13:43:10+0300'))
  })
})
