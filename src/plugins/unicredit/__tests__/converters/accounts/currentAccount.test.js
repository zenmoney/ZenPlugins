import { convertAccount } from '../../../converters'

describe('convertAccount', () => {
  it('convers current account', () => {
    expect(convertAccount({
      act: 'refill|currconv|transfer|details',
      curr: '810',
      hide: '0',
      img: '',
      iso: 'RUR',
      name: 'Текущий счет',
      nick: 'Текущий счет',
      number: '40817810850020022305',
      rate: '',
      rateinfo: '',
      rates: '',
      rest: '0.35',
      upd: '20.06.2019 18:24:43'
    })).toEqual({
      product: {
        id: '40817810850020022305'
      },
      account: {
        id: '40817810850020022305',
        type: 'checking',
        title: 'Текущий счет',
        instrument: 'RUB',
        balance: 0.35,
        syncID: ['40817810850020022305']
      }
    })
  })
})
