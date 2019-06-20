import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it('converts account deposit', () => {
    expect(convertTransaction({
      CUR: '',
      amount: '-1450000.00',
      card: '40817810850020022305',
      cardamount: '',
      clickable: '1',
      date: '30.05.2019',
      descr: 'Перевод',
      iso: 'RUR',
      name: 'Payments',
      payerdate: '30.05.2019',
      st: 'M'
    }, { id: 'account', instrument: 'RUR' })).toEqual({
      hold: false,
      date: new Date(2019, 4, 30),
      movements: [
        {
          id: null,
          account: { id: 'account' },
          invoice: null,
          sum: -1450000,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'Перевод'
    })
  })
})
