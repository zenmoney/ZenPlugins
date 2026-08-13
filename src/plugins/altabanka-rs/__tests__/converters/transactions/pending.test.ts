import { convertTransaction } from '../../../converters'
import { AccountInfo, AccountTransaction } from '../../../models'

describe('convertTransaction (pending / reserved funds)', () => {
  const account: AccountInfo = {
    accountNumber: '0001000000001',
    cardNumber: '',
    id: '0001000000001',
    name: 'Tekući račun bez red. priliva',
    currency: 'RSD',
    balance: 77289.36
  }

  it('marks a reserved authorization as hold', () => {
    const reserved: AccountTransaction = {
      id: 'id_10000001R',
      date: new Date('2026-06-23T00:00:00'),
      address: 'KRALJA MILANA 28>BEOGRAD RS',
      amount: -340.97,
      currency: 'RSD',
      description: ''
    }

    expect(convertTransaction(reserved, account, true)).toEqual({
      hold: true,
      date: new Date('2026-06-23T00:00:00'),
      movements: [
        {
          id: 'id_10000001R',
          account: { id: '0001000000001' },
          sum: -340.97,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: 'KRALJA MILANA 28>BEOGRAD RS',
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('drops a released zero-amount hold', () => {
    const reserved: AccountTransaction = {
      id: 'id_17284535R',
      date: new Date('2026-04-27T00:00:00'),
      address: 'AIRBNB>SAN FRANCISC US',
      amount: 0,
      currency: 'RSD',
      description: ''
    }

    expect(convertTransaction(reserved, account, true)).toBeNull()
  })
})
