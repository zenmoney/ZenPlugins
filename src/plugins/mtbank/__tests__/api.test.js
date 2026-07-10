import { createDateIntervals, selectDboContract } from '../api'

describe('createDateIntervals', () => {
  it('should convert date period', () => {
    expect(
      createDateIntervals(new Date('2018-01-01T20:45+03:00'), new Date('2018-02-05T09:00+03:00'))
    ).toEqual(
      [
        [new Date('2018-01-01T20:45:00+03:00'), new Date('2018-01-21T20:44:59.999+03:00')],
        [new Date('2018-01-21T20:45:00+03:00'), new Date('2018-02-05T09:00:00.000+03:00')]
      ]
    )
  })
})

describe('selectDboContract', () => {
  it('prefers a registered personal contract over the first contract', () => {
    const businessContract = {
      contractNum: 'IB_B/123456',
      status: 'REGISTERED',
      role: 'B',
      name: 'Company'
    }
    const personalContract = {
      contractNum: 'IB_I/654321',
      status: 'REGISTERED',
      role: 'F',
      name: 'User'
    }

    expect(selectDboContract([businessContract, personalContract])).toBe(personalContract)
  })

  it('keeps the previous fallback when no personal contract exists', () => {
    const businessContract = {
      contractNum: 'IB_B/123456',
      status: 'REGISTERED',
      role: 'B'
    }

    expect(selectDboContract([businessContract])).toBe(businessContract)
  })
})
