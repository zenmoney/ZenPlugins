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

describe('convertTransaction - inner transfer', () => {
  it('should convert Interni transfer as comment without merchant', () => {
    const tx: AccountTransaction = {
      id: '77700000002001',
      date: new Date('2026-06-20T12:00:00'),
      direction: 'd',
      amount: -40000,
      currency: 'RSD',
      description: 'Interni transfer - Isplata DS'
    }

    expect(convertTransaction(tx, account)).toEqual({
      hold: false,
      date: new Date('2026-06-20T12:00:00'),
      movements: [
        {
          id: '77700000002001',
          account: { id: 'RS35190000100038442537' },
          sum: -40000,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Interni transfer - Isplata DS'
    })
  })
})
