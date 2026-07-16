import { convertTransaction } from '../../../converters'
import { AccountInfo, AccountTransaction } from '../../../models'

describe('convertTransaction (card turnover)', () => {
  const account: AccountInfo = {
    accountNumber: '190000100000000001',
    cardNumber: '',
    id: '190000100000000001',
    name: 'Tekući račun',
    currency: 'RSD',
    balance: 1000
  }

  it('keeps domestic sum and the original-currency invoice for a foreign purchase', () => {
    const cardTransaction: AccountTransaction = {
      id: 'id_10000003E',
      date: new Date('2026-06-03T00:00:00'),
      address: 'Shell Yverdon Yverdon-les-B',
      amount: -4985.39,
      currency: 'RSD',
      description: '',
      invoice: { sum: -42.47, instrument: 'EUR' }
    }

    expect(convertTransaction(cardTransaction, account)).toEqual({
      hold: false,
      date: new Date('2026-06-03T00:00:00'),
      movements: [
        {
          id: 'id_10000003E',
          account: { id: '190000100000000001' },
          sum: -4985.39,
          fee: 0,
          invoice: { sum: -42.47, instrument: 'EUR' }
        }
      ],
      merchant: {
        fullTitle: 'Shell Yverdon Yverdon-les-B',
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  it('keeps a plain domestic card purchase without invoice', () => {
    const cardTransaction: AccountTransaction = {
      id: 'id_10000001E',
      date: new Date('2026-06-18T00:00:00'),
      address: 'STUDIO3 - B6 BEOGRAD',
      amount: -2380,
      currency: 'RSD',
      description: ''
    }

    expect(convertTransaction(cardTransaction, account)).toEqual({
      hold: false,
      date: new Date('2026-06-18T00:00:00'),
      movements: [
        {
          id: 'id_10000001E',
          account: { id: '190000100000000001' },
          sum: -2380,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: 'STUDIO3 - B6 BEOGRAD',
        mcc: null,
        location: null
      },
      comment: null
    })
  })
})
