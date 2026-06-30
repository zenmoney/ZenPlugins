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

describe('convertTransaction - income', () => {
  it('should convert Uplata as comment without merchant', () => {
    const tx: AccountTransaction = {
      id: '87700175591001',
      date: new Date('2026-06-27T09:11:10'),
      direction: 'c',
      amount: 3420,
      currency: 'RSD',
      description: 'Uplata na tekuci racun'
    }

    expect(convertTransaction(tx, account)).toEqual({
      hold: false,
      date: new Date('2026-06-27T09:11:10'),
      movements: [
        {
          id: '87700175591001',
          account: { id: 'RS35190000100038442537' },
          sum: 3420,
          fee: 0,
          invoice: null
        }
      ],
      merchant: null,
      comment: 'Uplata na tekuci racun'
    })
  })
})
