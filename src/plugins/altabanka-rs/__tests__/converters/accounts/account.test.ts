import { AccountInfo } from '../../../types'
import { convertAccounts } from '../../../converters'

const account: AccountInfo = {
  name: 'Tekući račun bez red. priliva',
  productCoreID: 'PUB-RT-8',
  accountNumber: '190000100038442537',
  balance: 2201.13,
  currency: 'RSD',
  iban: 'RS35190000100038442537'
}

describe('convertAccounts', () => {
  it('should convert RSD account', () => {
    expect(convertAccounts([account])).toEqual([
      {
        id: 'RS35190000100038442537',
        type: 'checking',
        title: 'Tekući račun bez red. priliva',
        instrument: 'RSD',
        balance: 2201.13,
        syncIds: ['RS35190000100038442537', '190000100038442537']
      }
    ])
  })

  it('should convert EUR account', () => {
    const eurAccount: AccountInfo = {
      name: 'Devizni račun rezidenti',
      productCoreID: 'PUB-RT-301',
      accountNumber: '190003100045788779',
      balance: 0,
      currency: 'EUR',
      iban: 'RS35190003100045788779'
    }

    expect(convertAccounts([eurAccount])).toEqual([
      {
        id: 'RS35190003100045788779',
        type: 'checking',
        title: 'Devizni račun rezidenti',
        instrument: 'EUR',
        balance: 0,
        syncIds: ['RS35190003100045788779', '190003100045788779']
      }
    ])
  })
})
