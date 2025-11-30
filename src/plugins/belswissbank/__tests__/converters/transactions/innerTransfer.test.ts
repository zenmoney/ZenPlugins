import { convertTransactions } from '../../../converters'

describe('convertTransactions', () => {
  it.each([
    [
      [
        {
          id: 121291728,
          userId: 3242906,
          cardId: 349111,
          paymentDate: '28/11/2025 12:46:47',
          last4namePayer: '4468, MIKITA DUBITSKI',
          currCode: 'BYN',
          target: '9963, MIKITA DUBITSKI',
          paymentTypeId: 14,
          status: 1,
          paymentName: 'Перевод',
          paymentType: 'TRANSFER',
          isEnrollment: false,
          summa: 6500,
          balanceBefore: 37000,
          balanceAfter: 34761.32,
          currencyTypePayer: 'USD',
          statusSignature: null,
          cardRetailIdRecipient: 2743029,
          commentText: null,
          favoriteId: null
        }
      ],
      [
        {
          comment: null,
          date: new Date('2025-11-28T09:46:47Z'),
          hold: false,
          merchant: {
            fullTitle: '9963, MIKITA DUBITSKI',
            location: null,
            mcc: null
          },
          movements: [
            {
              account: { id: '349111' },
              fee: 0,
              id: '121291728',
              invoice: null,
              sum: -6500
            }
          ]
        }
      ]
    ]
  ])('converts inner transfer', (apiTransactions, transactions) => {
    expect(convertTransactions(apiTransactions)).toEqual(transactions)
  })
})
