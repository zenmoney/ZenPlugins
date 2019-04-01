import { createDateIntervals } from '../api'

describe('createDateIntervals', () => {
  it('should convert date period', () => {
    expect(
      createDateIntervals(new Date('2018-01-01T20:45+03:00'), new Date('2018-02-05T09:00+03:00'))
    ).toEqual(
      [
        [new Date('2018-01-01T20:45:00+03:00'), new Date('2018-01-11T20:44:59.000+03:00')],
        [new Date('2018-01-11T20:45:00+03:00'), new Date('2018-01-21T20:44:59.000+03:00')],
        [new Date('2018-01-21T20:45:00+03:00'), new Date('2018-01-31T20:44:59.000+03:00')],
        [new Date('2018-01-31T20:45:00+03:00'), new Date('2018-02-05T09:00:00.000+03:00')]
      ]
    )
  })
})
