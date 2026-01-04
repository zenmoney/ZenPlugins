import { parseDate, convertTransactions } from './converters'
import { Transaction } from '../../types/zenmoney'

describe('parseDate', () => {
  test('timezone is parsed as Minsk', () => {
    expect(parseDate('29/12/2023 12:12:01')).toEqual(new Date('2023-12-29T12:12:01+0300'))
    expect(parseDate('29/10/2023 10:53:48')).toEqual(new Date('2023-10-29T10:53:48+0300'))
    expect(parseDate('05/10/2023 13:43:10')).toEqual(new Date('2023-10-05T13:43:10+0300'))
  })
})

describe('convertTransactions', () => {
  function uut (apiTransactions: unknown[]): Transaction[] {
    return Array.from(convertTransactions(apiTransactions))
  }

  test('skips preauthorization transaction with zero sum', () => {
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

    const transactions = uut(apiTransactions)

    // Should only get the transaction with summa !== 0
    // isEnrollment: false means outcome, so sum should be negative
    expect(transactions).toHaveLength(1)
    expect(transactions[0].movements[0].sum).toBe(-7.42)
    expect(transactions[0].movements[0].id).toBe('111112')
  })

  test('converts outcome transaction (merchant purchase in BYN)', () => {
    const apiTransactions = [
      {
        id: 113710793,
        userId: 1000001,
        cardId: 100001,
        paymentDate: '15/09/2025 18:22:45',
        last4namePayer: '1234, IVAN IVANOV',
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

    const transactions = uut(apiTransactions)

    expect(transactions).toHaveLength(1)
    expect(transactions[0]).toEqual({
      hold: false,
      date: new Date('2025-09-15T18:22:45+0300'),
      movements: [
        {
          id: '113710793',
          account: { id: '100001' },
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

  test('converts income transaction (salary payment with comment)', () => {
    const apiTransactions = [
      {
        id: 123456789,
        userId: 1000002,
        cardId: 100002,
        paymentDate: '12/09/2025 14:18:22',
        last4namePayer: '5678, PETR PETROV',
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

    const transactions = uut(apiTransactions)

    expect(transactions).toHaveLength(1)
    expect(transactions[0]).toEqual({
      hold: false,
      date: new Date('2025-09-12T14:18:22+0300'),
      movements: [
        {
          id: '123456789',
          account: { id: '100002' },
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

  test('converts outgoing transfer to another user card (with currency conversion)', () => {
    const apiTransactions = [
      {
        id: 121291728,
        userId: 1000003,
        cardId: 100003,
        paymentDate: '22/11/2025 10:32:18',
        last4namePayer: '9012, ALEX SIDOROV',
        currCode: 'BYN',
        target: '3456, ALEX SIDOROV',
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
        cardRetailIdRecipient: 900001,
        commentText: null,
        favoriteId: null
      }
    ]

    const transactions = uut(apiTransactions)

    expect(transactions).toEqual([
      {
        comment: null,
        date: new Date('2025-11-22T10:32:18+0300'),
        hold: false,
        merchant: {
          fullTitle: '3456, ALEX SIDOROV',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '100003' },
            fee: 0,
            id: '121291728',
            invoice: {
              sum: -6500,
              instrument: 'BYN'
            },
            sum: -2238.68
          }
        ]
      }
    ])
  })

  test('converts outcome transaction with currency conversion (purchase in foreign currency)', () => {
    const apiTransactions = [
      {
        id: 999888777,
        userId: 1000004,
        cardId: 100004,
        paymentDate: '18/12/2025 16:45:30',
        last4namePayer: '2468, MARIA KOZLOVA',
        currCode: 'USD',
        target: 'AMAZON.COM',
        paymentTypeId: null,
        status: 1,
        paymentName: null,
        paymentType: 'TRANSACTION',
        isEnrollment: false,
        summa: 50.00,
        balanceBefore: 500.00,
        balanceAfter: 340.50,
        currencyTypePayer: 'BYN',
        statusSignature: 'Успешно',
        cardRetailIdRecipient: null,
        commentText: null,
        favoriteId: null
      }
    ]

    const transactions = uut(apiTransactions)

    expect(transactions).toEqual([
      {
        comment: null,
        date: new Date('2025-12-18T16:45:30+0300'),
        hold: false,
        merchant: {
          fullTitle: 'AMAZON.COM',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '100004' },
            fee: 0,
            id: '999888777',
            invoice: {
              sum: -50.00,
              instrument: 'USD'
            },
            sum: -159.50
          }
        ]
      }
    ])
  })

  test('converts transaction with currency conversion but missing balance info (both null)', () => {
    const apiTransactions = [
      {
        id: 555666777,
        userId: 1000005,
        cardId: 100005,
        paymentDate: '22/12/2025 09:15:45',
        last4namePayer: '3579, SERGEY ORLOV',
        currCode: 'BYN',
        target: 'BOOKING.COM',
        paymentTypeId: null,
        status: 1,
        paymentName: null,
        paymentType: 'TRANSACTION',
        isEnrollment: false,
        summa: 100.00,
        balanceBefore: null,
        balanceAfter: null,
        currencyTypePayer: 'EUR',
        statusSignature: 'Успешно',
        cardRetailIdRecipient: null,
        commentText: null,
        favoriteId: null
      }
    ]

    const transactions = uut(apiTransactions)

    expect(transactions).toEqual([
      {
        comment: null,
        date: new Date('2025-12-22T09:15:45+0300'),
        hold: false,
        merchant: {
          fullTitle: 'BOOKING.COM',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '100005' },
            fee: 0,
            id: '555666777',
            invoice: {
              sum: -100.00,
              instrument: 'BYN'
            },
            sum: null
          }
        ]
      }
    ])
  })

  test('converts transaction with currency conversion but only balanceAfter available', () => {
    const apiTransactions = [
      {
        id: 102264531,
        userId: 1000006,
        cardId: 100006,
        paymentDate: '26/04/2025 07:22:15',
        last4namePayer: '4680, OLGA VOLKOVA',
        currCode: 'EUR',
        target: 'PP*P3623E80EB',
        paymentTypeId: null,
        status: 1,
        paymentName: null,
        paymentType: 'TRANSACTION',
        isEnrollment: false,
        summa: 15.65,
        balanceBefore: null,
        balanceAfter: 526.15,
        currencyTypePayer: 'USD',
        statusSignature: 'Успешно',
        cardRetailIdRecipient: null,
        commentText: null,
        favoriteId: null
      }
    ]

    const transactions = uut(apiTransactions)

    expect(transactions).toEqual([
      {
        comment: null,
        date: new Date('2025-04-26T07:22:15+0300'),
        hold: false,
        merchant: {
          fullTitle: 'PP*P3623E80EB',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '100006' },
            fee: 0,
            id: '102264531',
            invoice: {
              sum: -15.65,
              instrument: 'EUR'
            },
            sum: null
          }
        ]
      }
    ])
  })

  test('converts ERIP payment with currency conversion (BYN account, USD transaction, no balances)', () => {
    const apiTransactions = [
      {
        id: 104428613,
        userId: 1000007,
        cardId: 100007,
        paymentDate: '23/05/2025 11:48:20',
        last4namePayer: '7913, DMITRY SOKOLOV',
        currCode: 'BYN',
        target: '4640',
        paymentTypeId: 10004715911,
        status: 1,
        paymentName: 'Polevoy.by',
        paymentType: 'ERIP',
        isEnrollment: false,
        summa: 710,
        balanceBefore: null,
        balanceAfter: null,
        currencyTypePayer: 'USD',
        statusSignature: null,
        cardRetailIdRecipient: null,
        commentText: null,
        favoriteId: null
      }
    ]

    const transactions = uut(apiTransactions)

    expect(transactions).toEqual([
      {
        comment: null,
        date: new Date('2025-05-23T11:48:20+0300'),
        hold: false,
        merchant: {
          fullTitle: '4640',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '100007' },
            fee: 0,
            id: '104428613',
            invoice: {
              sum: -710,
              instrument: 'BYN'
            },
            sum: null
          }
        ]
      }
    ])
  })

  test('converts transaction with USD purchase on USD account (only balanceAfter, no conversion)', () => {
    const apiTransactions = [
      {
        id: 113484813,
        userId: 1000008,
        cardId: 100008,
        paymentDate: '05/09/2025 13:15:42',
        last4namePayer: '8024, ANNA BELOVA',
        currCode: 'USD',
        target: 'WWW.NASVOBODY.COM',
        paymentTypeId: null,
        status: 1,
        paymentName: null,
        paymentType: 'TRANSACTION',
        isEnrollment: false,
        summa: 206,
        balanceBefore: null,
        balanceAfter: 136.19,
        currencyTypePayer: 'USD',
        statusSignature: 'Успешно',
        cardRetailIdRecipient: null,
        commentText: null,
        favoriteId: null
      }
    ]

    const transactions = uut(apiTransactions)

    expect(transactions).toEqual([
      {
        comment: null,
        date: new Date('2025-09-05T13:15:42+0300'),
        hold: false,
        merchant: {
          fullTitle: 'WWW.NASVOBODY.COM',
          location: null,
          mcc: null
        },
        movements: [
          {
            account: { id: '100008' },
            fee: 0,
            id: '113484813',
            invoice: null,
            sum: -206
          }
        ]
      }
    ])
  })
})
