import { createDateIntervals } from '../api'

describe('createDateIntervals', () => {
  it('should convert date period', () => {
    expect(
      createDateIntervals(new Date('2018-01-01 20:45+03:00'), new Date('2018-02-05 09:00+03:00'))
    ).toEqual(
      [
        [new Date('2018-01-01 20:45:00+03:00'), new Date('2018-01-11 20:44:59.999+03:00')],
        [new Date('2018-01-11 20:45:00+03:00'), new Date('2018-01-21 20:44:59.999+03:00')],
        [new Date('2018-01-21 20:45:00+03:00'), new Date('2018-01-31 20:44:59.999+03:00')],
        [new Date('2018-01-31 20:45:00+03:00'), new Date('2018-02-05 09:00:00+03:00')]
      ]
    )
  })
})
