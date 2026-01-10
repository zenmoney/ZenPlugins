import * as fs from 'fs'
import * as path from 'path'
import { isAccountStatement, parseAccountHeader, parseAccountTransactions } from '../account-parser'

const TEST_DATA_DIR = path.join(__dirname, 'test_data')

describe('Account Statement Parser', () => {
  describe('account_statementKZT_EN.txt', () => {
    const file = 'account_statementKZT_EN.txt'
    const content = fs.readFileSync(path.join(TEST_DATA_DIR, file), 'utf8')

    it('should detect as account statement', () => {
      expect(isAccountStatement(content)).toBe(true)
    })

    it('should parse header correctly', () => {
      const header = parseAccountHeader(content)
      expect(header.accountNumber).toBe('KZ2396502F0018705204')
      expect(header.currency).toBe('KZT')
      // Available amount: 0.46 (based on actual file parsing of "0,46" at end of line)
      expect(header.balance).toBe(0.46)
    })

    it('should parse transactions correctly', () => {
      const transactions = parseAccountTransactions(content)
      // Count lines/transactions manually from file content used in verification
      // 10.11: -100k
      // 10.11: -1400k (Expense) -> Wait, layout says Receipts Expenses.
      // 10.11.2025
      // ...
      // - 100 000,00  (This is under Receipts/Expenses columns?)
      // Let's check logic.
      // 10.11.2025 ... 1 400 000,00 - : This ends with -, so it is Expense?
      // Actually standard format in these files seems to be:
      // Amount is at the end of line or next line.
      // - 100 000,00 means negative?

      expect(transactions.length).toBeGreaterThan(0)

      // Transaction 1: 10.11.2025 -100 000.00
      const t1 = transactions.find(t => t.date === '10.11.2025' && t.amount === -100000)
      expect(t1).toBeDefined()
      expect(t1?.operation).toBe('Transfer') // "П е р е в о д" detected via known ops or fallback to Purchase? "Transfer" is in KNOWN_OPERATIONS.
      // Parsing logic maps "Перевод" to "Transfer"

      // Transaction with forex commission: 11.11.2025 -1078.30
      const tForex = transactions.find(t => t.date === '11.11.2025' && t.amount === -1078.30)
      expect(tForex).toBeDefined()
      expect(tForex?.description).toContain('ForteForex')

      // Transaction with forex security: 11.11.2025 -1078300.00 (Wait, 1 078 300,00)
      const tSec = transactions.find(t => t.date === '11.11.2025' && t.amount === -1078300)
      expect(tSec).toBeDefined()
    })
  })

  describe('account_statementRUB-KZ.txt', () => {
    const file = 'account_statementRUB-KZ.txt'
    const content = fs.readFileSync(path.join(TEST_DATA_DIR, file), 'utf8')

    it('should detect as account statement', () => {
      expect(isAccountStatement(content)).toBe(true)
    })

    it('should parse header correctly', () => {
      const header = parseAccountHeader(content)
      expect(header.accountNumber).toBe('KZ999999999999999999')
      expect(header.currency).toBe('RUB')
      // Available sum: 314,00
      expect(header.balance).toBe(314.00)
    })

    it('should parse transactions correctly', () => {
      const transactions = parseAccountTransactions(content)
      expect(transactions.length).toBeGreaterThan(0)

      // 01.12.2025 -60 000.00
      const t1 = transactions.find(t => t.date === '01.12.2025' && t.amount === -60000)
      expect(t1).toBeDefined()
      expect(t1?.parsedDetails?.merchantName).toContain('TEST USER') // Structured name extraction
      expect(t1?.description).toContain('ПЕРЕВОД')
    })
  })

  describe('account_statementRUB-RU.txt', () => {
    const file = 'account_statementRUB-RU.txt'
    const content = fs.readFileSync(path.join(TEST_DATA_DIR, file), 'utf8')

    it('should detect as account statement', () => {
      expect(isAccountStatement(content)).toBe(true)
    })

    it('should parse header correctly', () => {
      const header = parseAccountHeader(content)
      expect(header.accountNumber).toBe('KZ999999999999999999')
      expect(header.currency).toBe('RUB')
      // Balance: 314,00
      expect(header.balance).toBe(314.00)
    })

    it('should parse transactions correctly', () => {
      const transactions = parseAccountTransactions(content)
      expect(transactions.length).toBeGreaterThan(0)

      // 01.12.2025 -60 000.00
      const t1 = transactions.find(t => t.date === '01.12.2025' && t.amount === -60000)
      expect(t1).toBeDefined()
      // Expect merchant name to be extracted from "ФИО\Наименование : TEST USER"
      expect(t1?.parsedDetails?.merchantName).toContain('TEST USER')
    })
  })

  describe('account_statementUSD-RU.txt', () => {
    const file = 'account_statementUSD-RU.txt'
    const content = fs.readFileSync(path.join(TEST_DATA_DIR, file), 'utf8')

    it('should detect as account statement', () => {
      expect(isAccountStatement(content)).toBe(true)
    })

    it('should parse header correctly', () => {
      const header = parseAccountHeader(content)
      expect(header.accountNumber).toBe('KZ999999999999999999')
      expect(header.currency).toBe('USD')
      // Balance: 27 000,00
      expect(header.balance).toBe(27000.00)
    })

    it('should parse transactions correctly', () => {
      const transactions = parseAccountTransactions(content)
      expect(transactions.length).toBe(8) // Counted visually from file

      // 11.11.2025 -2050.00
      const t1 = transactions.find(t => t.date === '11.11.2025' && t.amount === 2050)
      expect(t1).toBeDefined()
      expect(t1?.description).toContain('ForteForex')

      // 11.11.2025 -50.00 Transfer
      const t2 = transactions.find(t => t.date === '11.11.2025' && t.amount === -50)
      expect(t2).toBeDefined()
      expect(t2?.parsedDetails?.merchantName).toBe('TEST USER')
    })
  })
})
