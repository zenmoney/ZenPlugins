import { convertLoan } from '../../../converters'

describe('convertLoan', () => {
  it.each([
    [
      {
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
      },
      {
        product: null,
        account: {
          id: '01294829RURRA12392',
          type: 'loan',
          title: 'CAR_LOANS',
          instrument: 'RUB',
          syncID: ['012948291411712392'],
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
      }
    ],
    [
      {
        number: '02185379RURRM10001',
        name: 'MORTGAGE',
        rest: '1 878 392.52',
        iso: 'RUR',
        nick: 'MORTGAGE-Ипотека',
        amount: '2 120 000.00',
        prc: '12.00',
        date: '22.12.2015',
        paydate: '21.10.2019',
        payamount: '25 444.00',
        img: '',
        upd: '02.10.2019 16:25:15',
        act: 'pay|calendar',
        hide: '0'
      },
      {
        product: null,
        account: {
          id: '02185379RURRM10001',
          type: 'loan',
          title: 'MORTGAGE-Ипотека',
          instrument: 'RUB',
          syncID: ['021853791411610001'],
          balance: -1878392.52,
          startBalance: 2120000,
          startDate: new Date(2015, 11, 22),
          capitalization: true,
          percent: 12,
          payoffStep: 1,
          payoffInterval: 'month',
          endDateOffset: 1,
          endDateOffsetInterval: 'month'
        }
      }
    ],
    [
      {
        number: '02185379RURRC10001',
        name: 'CONSUMER_LOANS',
        rest: '64 038.40',
        iso: 'RUR',
        nick: 'CONSUMER_LOANS',
        amount: '124 000.00',
        prc: '17.90',
        date: '31.10.2016',
        paydate: '21.10.2019',
        payamount: '3 143.00',
        img: '',
        upd: '02.10.2019 16:25:15',
        act: 'pay|calendar',
        hide: '0'
      },
      {
        product: null,
        account: {
          id: '02185379RURRC10001',
          type: 'loan',
          title: 'CONSUMER_LOANS',
          instrument: 'RUB',
          syncID: ['021853791411010001'],
          balance: -64038.4,
          startBalance: 124000,
          startDate: new Date(2016, 9, 31),
          capitalization: true,
          percent: 17.9,
          payoffStep: 1,
          payoffInterval: 'month',
          endDateOffset: 1,
          endDateOffsetInterval: 'month'
        }
      }
    ]
  ])('converts loan', (apiAccount, account) => {
    expect(convertLoan(apiAccount)).toEqual(account)
  })
})
