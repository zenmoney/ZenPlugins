import { convertAccounts } from '../../../converters'

describe('convertDeposit', () => {
  it('converts deposit', () => {
    expect(convertAccounts({
      deposit: [
        { number: '',
          name: 'Вклад PRIME (PRIME Deposit)',
          ref: '00313175RURPRIM204',
          status: 'Открыт',
          rest: '1 628 742.63',
          iso: 'RUR',
          curr: '810',
          nick: '',
          orig: '1 550 000.00',
          len: '368',
          prc: '6.50',
          date: '24.09.2018',
          period: 'Ежемесячно',
          trans: '0',
          img: '',
          upd: '08.07.2019 22:25:25',
          edate: '27.09.2019',
          act: 'changeparam|withdrawal',
          hide: '0' }
      ]
    })).toEqual([
      {
        product: null,
        account: {
          id: '00313175RURPRIM204',
          type: 'deposit',
          title: 'Вклад PRIME (PRIME Deposit)',
          instrument: 'RUB',
          syncID: ['00313175RURPRIM204'],
          balance: 1628742.63,
          startBalance: 1550000,
          startDate: new Date(2018, 8, 24),
          capitalization: true,
          percent: 6.5,
          payoffStep: 1,
          payoffInterval: 'month',
          endDateOffset: 368,
          endDateOffsetInterval: 'day'
        }
      }
    ])
  })
})
