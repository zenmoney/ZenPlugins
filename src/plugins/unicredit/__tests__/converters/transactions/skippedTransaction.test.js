import { convertTransaction } from '../../../converters'

describe('convertTransaction', () => {
  it.each([
    [
      {
        date: '16.07.2019',
        name: 'Mastercard, St. Louis',
        descr: '',
        mcc: '5969',
        iso: 'USD',
        amount: '0.00',
        payerdate: '',
        cardamount: '0.00',
        CUR: 'RUB',
        st: 'D',
        card: '40817810850230010683 (522458******2741)',
        clickable: '1'
      }
    ]
  ])('skips specific transaction', (apiTransaction) => {
    expect(convertTransaction(apiTransaction, { id: 'account', instrument: 'RUB' })).toBeNull()
  })
})
