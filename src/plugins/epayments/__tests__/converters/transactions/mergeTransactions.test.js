import { convertTransactions, mergeTransactions } from '../../../converters'
import * as data from './_data'

describe('mergeTransactions', () => {
  it('merge transactions', () => {
    const toConvert = [...data.cardLoadApiTransactions, ...data.cardUnloadApiTransactions, ...data.walletsCurrencyExchangeApiTransactions]
    const accounts = [
      {
        id: '1234xxxxxxxx5678',
        instrument: 'USD'
      },
      {
        id: '000-123456-USD',
        instrument: 'USD'
      },
      { id: '000-123456-EUR',
        instrument: 'EUR'
      }
    ]
    const converted = convertTransactions(toConvert)
    expect(mergeTransactions(converted, accounts)).toEqual([
      {
        hold: false,
        date: new Date(Date.parse('2018-02-10T00:04:00.000Z')),
        merchant: null,
        comment: 'Card load to ePayments Card',
        movements: [
          {
            id: '333333333',
            account: { id: '000-123456-USD' },
            sum: -50.0,
            fee: 0,
            invoice: null
          },
          {
            id: '222222222',
            account: { id: '1234xxxxxxxx5678' },
            sum: 50.0,
            fee: 0,
            invoice: null
          }
        ]
      },
      {
        hold: false,
        date: new Date(Date.parse('2019-06-27T08:26:00.00Z')),
        merchant: null,
        comment: 'Card unload from ePayments Card',
        movements: [
          {
            id: '444444444',
            account: { id: '1234xxxxxxxx5678' },
            sum: -10.0,
            fee: 0,
            invoice: null
          },
          {
            id: '555555555',
            account: { id: '000-123456-USD' },
            sum: 10.0,
            fee: 0,
            invoice: null
          }
        ]
      },
      {
        hold: false,
        date: new Date(Date.parse('2019-06-27T08:02:00.000Z')),
        merchant: null,
        comment: 'Currency exchange from USD to EUR. Rate = 0.8568',
        movements: [
          {
            id: '777777777',
            account: { id: '000-123456-USD' },
            sum: -5.0,
            fee: 0,
            invoice: null
          },
          {
            id: '666666666',
            account: { id: '000-123456-EUR' },
            sum: 4.28,
            fee: 0,
            invoice: null
          }
        ]
      }
    ])
  })
})
