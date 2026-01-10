import { AccountReferenceById, AccountType } from '../../../types/zenmoney'
import { convertAccount, convertTransaction, convertDeposit } from '../converters'
import { ParsedTransaction, ParsedHeader } from '../models'

describe('Fortebank Converters', () => {
  describe('convertAccount', () => {
    it('should convert parsed header to account', () => {
      const header = {
        accountNumber: 'KZ1234567890',
        currency: 'KZT'
      }
      const account = convertAccount(header)
      expect(account).toEqual({
        id: 'KZ1234567890',
        title: 'KZ1234567890',
        type: AccountType.checking,
        instrument: 'KZT',
        syncIds: ['KZ1234567890'],
        balance: null
      })
    })

    it('should handle missing header fields', () => {
      const account = convertAccount({})
      expect(account.id).toBe('unknown-account')
      expect(account.instrument).toBe('KZT')
    })

    it('should convert header with balance', () => {
      const header = {
        accountNumber: 'KZ123',
        currency: 'KZT',
        balance: 123.45
      }
      const account = convertAccount(header)
      expect(account.balance).toBe(123.45)
    })
  })

  describe('convertDeposit', () => {
    it('should convert deposit header correctly', () => {
      const header: ParsedHeader = {
        accountNumber: 'KZDEPOSIT123',
        currency: 'USD',
        balance: 5000,
        isDeposit: true,
        productName: 'Saving Account',
        percent: 5.5,
        startDate: '2025-01-01',
        startBalance: 1000
      }

      const account = convertDeposit(header) as any // Casting to any to access deposit specific fields or check type safely

      expect(account.id).toBe('KZDEPOSIT123')
      expect(account.type).toBe(AccountType.deposit)
      expect(account.title).toBe('Saving Account')
      expect(account.instrument).toBe('USD')
      expect(account.percent).toBe(5.5)
      expect(account.startBalance).toBe(1000)
      expect(account.startDate.getFullYear()).toBe(2025)
      expect(account.startDate.getMonth()).toBe(0) // Jan is 0
      expect(account.startDate.getDate()).toBe(1)
    })
  })

  describe('convertTransaction', () => {
    it('should convert parsed expense transaction', () => {
      const pt: ParsedTransaction = {
        date: '01.01.2023',
        amount: -100.00,
        description: 'Purchase SuperStore',
        mcc: 5411,
        operation: 'Purchase',
        details: 'SuperStore',
        originString: ''
      }
      const transaction = convertTransaction(pt, 'acc1')
      expect(transaction.date).toEqual(new Date(2023, 0, 1))
      expect(transaction.movements[0].sum).toBe(-100.00)
      expect((transaction.movements[0].account as AccountReferenceById).id).toBe('acc1')
      // Expect parsed merchant (fallback logic)
      expect(transaction.merchant).toEqual({
        title: 'SuperStore',
        city: null,
        country: null,
        mcc: 5411,
        location: null
      })
      expect(transaction.comment).toBe('')
    })

    it('should convert transaction with location', () => {
      const pt: ParsedTransaction = {
        date: '03.01.2023',
        amount: -500.00,
        description: 'Payment Starbucks Almaty KZ',
        operation: 'Payment',
        details: 'Starbucks Almaty KZ',
        originString: ''
      }
      const transaction = convertTransaction(pt, 'acc1')
      expect(transaction.merchant).toEqual({
        title: 'Starbucks',
        city: 'Almaty',
        country: 'Kazakhstan',
        mcc: null,
        location: null
      })
      expect(transaction.comment).toBe('Payment Starbucks')
    })

    it('should convert parsed income transaction', () => {
      const pt: ParsedTransaction = {
        date: '02.01.2023',
        amount: 1000.00,
        description: 'Transfer',
        operation: 'Transfer',
        details: '',
        originString: ''
      }
      const transaction = convertTransaction(pt, 'acc1')
      expect(transaction.date).toEqual(new Date(2023, 0, 2))
      expect(transaction.movements[0].sum).toBe(1000.00)
      expect(transaction.merchant).toBeNull()
      expect(transaction.comment).toBe('Transfer')
    })

    it('should use parsedDetails when available', () => {
      const pt: ParsedTransaction = {
        date: '04.01.2023',
        amount: -5000.00,
        description: 'Cash withdrawal Halyk Bank, ATM 12345, Almaty',
        operation: 'Cash withdrawal',
        details: 'Halyk Bank, ATM 12345, Almaty',
        parsedDetails: {
          merchantBank: 'Halyk Bank',
          atmCode: 'ATM 12345',
          merchantLocation: 'Almaty, KZ'
        },
        originString: ''
      }

      const transaction = convertTransaction(pt, 'acc1')
      expect(transaction.merchant).toBeNull()
      expect(transaction.comment).toContain('Bank: Halyk Bank')
      expect(transaction.comment).toContain('ATM: ATM 12345')
    })

    it('should use parsedDetails for Purchase', () => {
      const pt: ParsedTransaction = {
        date: '05.01.2023',
        amount: -200.00,
        description: 'Purchase Apple Services, Bank X, MCC: 1234',
        operation: 'Purchase',
        details: 'Apple Services, Bank X, MCC: 1234',
        parsedDetails: {
          merchantName: 'Apple Services',
          merchantBank: 'Bank X',
          mcc: 1234
        },
        originString: ''
      }

      const transaction = convertTransaction(pt, 'acc1')
      expect(transaction.merchant).toEqual({
        title: 'Apple Services',
        city: null,
        country: null,
        mcc: 1234,
        location: null
      })
      expect(transaction.comment).toBe('Bank: Bank X')
    })

    it('should convert transaction with foreign currency', () => {
      const pt: ParsedTransaction = {
        date: '06.01.2023',
        amount: -1375.29,
        description: 'Yandex.Go (31000.00 UZS)',
        operation: 'Purchase',
        details: 'Yandex.Go (31000.00 UZS)',
        parsedDetails: {
          merchantName: 'Yandex.Go',
          mcc: 4789,
          foreignAmount: -31000,
          foreignCurrency: 'UZS'
        },
        originString: ''
      }

      const transaction = convertTransaction(pt, 'acc1')
      expect(transaction.movements[0].invoice).toEqual({
        sum: -31000,
        instrument: 'UZS'
      })
    })
  })
})
