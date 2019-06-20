import { convertLoan } from '../../../converters'

describe('convertLoan', () => {
  it('converts loan', () => {
    expect(convertLoan({
      act: 'pay|calendar',
      amount: '1 450 000.00',
      date: '30.05.2019',
      hide: '0',
      img: '',
      iso: 'RUR',
      name: 'CAR_LOANS',
      nick: 'CAR_LOANS',
      number: '01294829RURRA12392',
      payamount: '28 976.00',
      paydate: '22.07.2019',
      prc: '14.99',
      rest: '1 450 000.00',
      upd: '20.06.2019 18:24:43'
    })).toEqual({
      product: null,
      account: {
        id: '01294829RURRA12392',
        type: 'loan',
        title: 'CAR_LOANS',
        instrument: 'RUR',
        syncID: ['01294829RURRA12392'],
        balance: -1450000,
        startBalance: 1450000,
        startDate: new Date(2019, 4, 30),
        capitalization: true,
        percent: 14.99,
        payoffStep: 1,
        payoffInterval: 'month',
        endDateOffset: 1,
        endDateOffsetInterval: 'month'
      }
    })
  })
})
