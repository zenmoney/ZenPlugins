import {
  convertDeposit
} from '../../converters'

describe('convertDeposit', () => {
  it('converts deposit UZS', () => {
    expect(convertDeposit({
      guid: 'DP-2e381dd6-bd9a-42e2-acde-369ca48b12e1',
      depositProductName: '% каждый день на счёт',
      depositName: null,
      interestRate: 21,
      balance: 12000000000,
      status: 'OPEN',
      currency: {
        name: 'UZS',
        scale: 2
      },
      closeDate: '2026-02-05 00:00:00.+0000',
      period: 25
    })).toEqual({
      id: 'DP-2e381dd6-bd9a-42e2-acde-369ca48b12e1',
      type: 'deposit',
      title: 'Депозит % каждый день на счёт',
      instrument: 'UZS',
      syncIds: [
        'DP-2e381dd6-bd9a-42e2-acde-369ca48b12e1'
      ],
      balance: 120000000.00,
      percent: 21,
      capitalization: false,
      endDateOffset: 25,
      endDateOffsetInterval: 'month',
      payoffInterval: null,
      payoffStep: 0,
      startDate: new Date('2024-01-05T00:00:00.000Z')
    })
  })
})
