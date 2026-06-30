import { AccountInfo, AccountTransaction } from '../../../types'
import { convertTransaction } from '../../../converters'

const account: AccountInfo = {
  name: 'Tekući račun bez red. priliva',
  productCoreID: 'PUB-RT-8',
  accountNumber: '190000100038442537',
  balance: 2201.13,
  currency: 'RSD',
  iban: 'RS35190000100038442537'
}

describe('convertTransaction - cash withdrawal', () => {
  it('should add cash movement for ATM withdrawal', () => {
    const tx: AccountTransaction = {
      id: '77700000001001',
      date: new Date('2026-06-25T10:00:00'),
      direction: 'd',
      amount: -5000,
      currency: 'RSD',
      description: 'ATM ALTA BEOGRAD'
    }

    expect(convertTransaction(tx, account)).toEqual({
      hold: false,
      date: new Date('2026-06-25T10:00:00'),
      movements: [
        {
          id: '77700000001001',
          account: { id: 'RS35190000100038442537' },
          sum: -5000,
          fee: 0,
          invoice: null
        },
        {
          id: null,
          account: {
            type: 'cash',
            instrument: 'RSD',
            syncIds: null,
            company: null
          },
          invoice: null,
          sum: 5000,
          fee: 0
        }
      ],
      merchant: null,
      comment: 'ATM ALTA BEOGRAD'
    })
  })
})
