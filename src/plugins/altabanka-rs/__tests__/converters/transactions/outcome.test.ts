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

describe('convertTransaction - outcome', () => {
  it('should convert regular expense', () => {
    const tx: AccountTransaction = {
      id: '77718351061001',
      date: new Date('2026-06-29T09:13:02'),
      direction: 'd',
      amount: -447,
      currency: 'RSD',
      description: '213 - MAXI 776              BEOGRAD'
    }

    expect(convertTransaction(tx, account)).toEqual({
      hold: false,
      date: new Date('2026-06-29T09:13:02'),
      movements: [
        {
          id: '77718351061001',
          account: { id: 'RS35190000100038442537' },
          sum: -447,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: '213 - MAXI 776              BEOGRAD',
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('should return null for zero amount', () => {
    const tx: AccountTransaction = {
      id: '123',
      date: new Date(),
      direction: 'd',
      amount: 0,
      currency: 'RSD',
      description: 'test'
    }

    expect(convertTransaction(tx, account)).toBeNull()
  })
})
