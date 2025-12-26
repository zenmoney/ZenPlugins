import { parseDate, convertTransactions } from './converters'

describe('parseDate', () => {
  test('timezone is parsed as Minsk', () => {
    expect(parseDate('29/12/2023 12:12:01')).toEqual(new Date('2023-12-29T12:12:01+0300'))
    expect(parseDate('29/10/2023 10:53:48')).toEqual(new Date('2023-10-29T10:53:48+0300'))
    expect(parseDate('05/10/2023 13:43:10')).toEqual(new Date('2023-10-05T13:43:10+0300'))
  })
})

describe('convertTransactions', () => {
  test('skips transactions with summa === 0 (e.g., preauthorizations)', () => {
    const apiTransactions = [
      {
        balanceAfter: 426.35,
        balanceBefore: null,
        cardId: 123456,
        cardRetailIdRecipient: null,
        commentText: null,
        currCode: 'EUR',
        currencyTypePayer: 'USD',
        favoriteId: null,
        id: 111111,
        isEnrollment: false,
        last4namePayer: '1234, TEST USER',
        paymentDate: '02/04/2025 21:16:08',
        paymentName: null,
        paymentType: 'TRANSACTION',
        paymentTypeId: null,
        status: 1,
        statusSignature: 'Успешно',
        summa: 0,
        target: 'PAYPAL',
        userId: 999999
      },
      {
        balanceAfter: 419.93,
        balanceBefore: 426.35,
        cardId: 123456,
        commentText: null,
        currCode: 'EUR',
        currencyTypePayer: 'EUR',
        id: 111112,
        isEnrollment: false,
        last4namePayer: '1234, TEST USER',
        paymentDate: '02/04/2025 20:34:15',
        paymentType: 'TRANSACTION',
        status: 1,
        statusSignature: 'Успешно',
        summa: 7.42,
        target: 'STORE-123',
        userId: 999999
      }
    ]

    const transactions = Array.from(convertTransactions(apiTransactions))

    // Should only get the transaction with summa !== 0
    // isEnrollment: false means outcome, so sum should be negative
    expect(transactions).toHaveLength(1)
    expect(transactions[0].movements[0].sum).toBe(-7.42)
    expect(transactions[0].movements[0].id).toBe('111112')
  })

  test('converts outcome transactions correctly (isEnrollment: false)', () => {
    const apiTransactions = [
      {
        id: 113710793,
        userId: 2398406,
        cardId: 220287,
        paymentDate: '05/09/2025 20:34:15',
        last4namePayer: '0125, XX XX',
        currCode: 'BYN',
        target: 'MAGAZIN SANTA-316',
        paymentTypeId: null,
        status: 1,
        paymentName: null,
        paymentType: 'TRANSACTION',
        isEnrollment: false,
        summa: 7.42,
        balanceBefore: 11.44,
        balanceAfter: 4.02,
        currencyTypePayer: 'BYN',
        statusSignature: 'Успешно',
        cardRetailIdRecipient: null,
        commentText: null,
        favoriteId: null
      }
    ]

    const transactions = Array.from(convertTransactions(apiTransactions))

    expect(transactions).toHaveLength(1)
    expect(transactions[0]).toEqual({
      hold: false,
      date: new Date('2025-09-05T20:34:15+0300'),
      movements: [
        {
          id: '113710793',
          account: { id: '220287' },
          sum: -7.42,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: 'MAGAZIN SANTA-316',
        mcc: null,
        location: null
      },
      comment: null
    })
  })

  test('converts income transactions correctly (isEnrollment: true)', () => {
    const apiTransactions = [
      {
        id: 123456789,
        userId: 2398406,
        cardId: 220287,
        paymentDate: '10/09/2025 15:20:30',
        last4namePayer: '0125, XX XX',
        currCode: 'BYN',
        target: 'SALARY PAYMENT',
        paymentTypeId: null,
        status: 1,
        paymentName: null,
        paymentType: 'TRANSACTION',
        isEnrollment: true,
        summa: 1500.00,
        balanceBefore: 100.00,
        balanceAfter: 1600.00,
        currencyTypePayer: 'BYN',
        statusSignature: 'Успешно',
        cardRetailIdRecipient: null,
        commentText: 'Monthly salary',
        favoriteId: null
      }
    ]

    const transactions = Array.from(convertTransactions(apiTransactions))

    expect(transactions).toHaveLength(1)
    expect(transactions[0]).toEqual({
      hold: false,
      date: new Date('2025-09-10T15:20:30+0300'),
      movements: [
        {
          id: '123456789',
          account: { id: '220287' },
          sum: 1500.00,
          fee: 0,
          invoice: null
        }
      ],
      merchant: {
        fullTitle: 'SALARY PAYMENT',
        mcc: null,
        location: null
      },
      comment: 'Monthly salary'
    })
  })
})
