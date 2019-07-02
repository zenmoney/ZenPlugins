import { convertTransaction } from '../../../converters'
import * as data from './_data'

describe('convertTransaction', () => {
  it('convert POS transaction', () => {
    expect(convertTransaction(data.cardPosApiTransaction))
      .toEqual({
        hold: false,
        merchant: null,
        date: new Date(Date.parse('2018-02-09T13:08:09.833Z')),
        comment: 'SUPERMARKET FURSHET KYIV UKR (273.82 UAH)',
        movements: [{
          id: '888888888',
          account: { id: '1234xxxxxxxx5678' },
          sum: -10.13,
          fee: -0.26,
          invoice: {
            sum: -273.82,
            instrument: 'UAH'
          },
          _type: 'pos'
        }]
      })
  })

  it('convert POS transaction with hold', () => {
    const transaction = Object.assign({}, data.cardPosApiTransaction, { state: 'WaitConfirmation' })
    expect(convertTransaction(transaction))
      .toEqual({
        hold: true,
        merchant: null,
        date: new Date(Date.parse('2018-02-09T13:08:09.833Z')),
        comment: 'SUPERMARKET FURSHET KYIV UKR (273.82 UAH)',
        movements: [{
          id: '888888888',
          account: { id: '1234xxxxxxxx5678' },
          sum: -10.13,
          fee: -0.26,
          invoice: {
            sum: -273.82,
            instrument: 'UAH'
          },
          _type: 'pos'
        }]
      })
  })
})
