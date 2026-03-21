
import * as fs from 'fs'
import * as path from 'path'
import { detectLocale, splitSections, parseHeader, parseTransactions } from '../parser'
import { isDepositStatement, parseDepositHeader } from '../deposit-parser'
import { parseAccountTransactions } from '../account-parser'
import { normalizeText } from '../utils'

const TEST_DATA_DIR = path.join(__dirname, 'test_data')

describe('Fortebank KZ E2E Parsing', () => {
  describe('RU Statement', () => {
    const filePath = path.join(TEST_DATA_DIR, 'statementKZT-RU.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    it('should recognize RU locale', () => {
      const locale = detectLocale(fileContent)
      expect(locale).toBe('ru')
    })

    it('should normalize text correctly', () => {
      const raw = 'П о к у п к а'
      const normalized = normalizeText(raw)
      expect(normalized).toBe('Покупка')
    })

    it('should parse sections correctly', () => {
      const locale = detectLocale(fileContent)
      const sections = splitSections(fileContent, locale)

      expect(sections.header).toBeDefined()
      expect(sections.transactions).toBeDefined()
      expect(sections.attic).toBeDefined()

      // Check that header contains account info raw text
      expect(sections.header).toContain('Н о м е р   с ч е т а')
      expect(sections.header).toContain('K Z 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9')

      // Check that transactions section contains some transaction data
      expect(sections.transactions).toContain('3 0 . 1 1 . 2 0 2 5')
      expect(sections.transactions).toContain('- 5 5 5 0 . 0 0')
    })

    it('should parse header details correctly', () => {
      const locale = detectLocale(fileContent)
      const sections = splitSections(fileContent, locale)
      const header = parseHeader(sections.header, locale)

      expect(header.accountNumber).toBe('KZ999999999999999999')
      expect(header.currency).toBe('KZT')
      expect(header.balance).toBe(2000.00)
    })

    it('should parse all transactions correctly', () => {
      const locale = detectLocale(fileContent)
      const sections = splitSections(fileContent, locale)
      const transactions = parseTransactions(sections.transactions)

      expect(transactions).toHaveLength(10)

      // Transaction 1
      expect(transactions[0]).toMatchObject({
        date: '30.11.2025',
        amount: -5550.00,
        description: expect.stringContaining('Покупка\nIP ZOKIROV'),
        mcc: 5411,
        operation: 'Покупка',
        parsedDetails: expect.objectContaining({
          mcc: 5411
        })
      })

      // Transaction 7 (Multicurrency/Conversion case?)
      expect(transactions[6].date).toBe('26.11.2025')
      expect(transactions[6].amount).toBe(-1473.45)
      expect(transactions[6].description).toContain('(2.82 USD)')
      expect(transactions[6].description).toContain('aliexpress Singapore SG')
    })
  })

  describe('EN Statement', () => {
    const filePath = path.join(TEST_DATA_DIR, 'statementKZT-EN.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    it('should recognize EN locale', () => {
      const locale = detectLocale(fileContent)
      expect(locale).toBe('en')
    })

    it('should parse sections correctly', () => {
      const locale = detectLocale(fileContent)
      const sections = splitSections(fileContent, locale)

      expect(sections.header).toBeDefined()
      expect(sections.transactions).toBeDefined()
      expect(sections.attic).toBeDefined()

      expect(sections.header).toContain('A c c o u n t   n u m b e r')
      expect(sections.header).toContain('K Z 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9')
    })

    it('should parse header details correctly', () => {
      const locale = detectLocale(fileContent)
      const sections = splitSections(fileContent, locale)
      const header = parseHeader(sections.header, locale)

      expect(header.accountNumber).toBe('KZ999999999999999999')
      expect(header.currency).toBe('KZT')
      expect(header.balance).toBe(15000.00)
    })

    it('should parse all transactions correctly', () => {
      const locale = detectLocale(fileContent)
      const sections = splitSections(fileContent, locale)
      const transactions = parseTransactions(sections.transactions)

      expect(transactions.length).toBeGreaterThan(0)

      const firstTransaction = transactions.find(t => t.amount === -9907.00)
      expect(firstTransaction).toBeDefined()
      expect(firstTransaction?.date).toBe('01.12.2025')
      expect(firstTransaction?.description).toContain('Purchase')
      expect(firstTransaction?.mcc).toBe(5411)

      const transferTransaction = transactions.find(t => t.amount === 6000.00)
      expect(transferTransaction).toBeDefined()
      expect(transferTransaction?.description).toContain('Account replenishment')
    })
  })

  describe('Deposit Statement', () => {
    const filePath = path.join(TEST_DATA_DIR, 'deposit_statementKZT-RU.txt')
    const fileContent = fs.readFileSync(filePath, 'utf-8')

    it('should be recognized as deposit statement', () => {
      expect(isDepositStatement(fileContent)).toBe(true)
    })

    it('should parse deposit header correctly', () => {
      const header = parseDepositHeader(fileContent)
      expect(header.isDeposit).toBe(true)
      expect(header.accountNumber).toBe('KZ1296502F0020935820')
      expect(header.currency).toBe('KZT')
      expect(header.startDate).toBe('2025-12-11')
      expect(header.percent).toBe(17.00)
      expect(header.productName).toContain('Сберегательный вклад')
      expect(header.balance).toBe(3600000)
    })

    it('should parse deposit transactions correctly', () => {
      // Reusing account parser logic for transactions
      const transactions = parseAccountTransactions(fileContent)
      expect(transactions.length).toBeGreaterThan(0)

      // Transaction 1: Replenishment 3 600 000
      const tx1 = transactions.find(t => t.amount === 3600000)
      expect(tx1).toBeDefined()
      expect(tx1?.date).toBe('11.12.2025')
      expect(tx1?.operation).toBe('Account replenishment')
      // "Пополнение счета" is usually the description in account statements.
      // Let's check test data content:
      // 1 1 . 1 2 . 2 0 2 5
      // Ф И О \ Н а и м е н о в а н и е : ...
      // ... П о п о л н е н и е   с ч ё т а
      // 3   6 0 0   0 0 0 , 0 0 -
      //
      // Account parser splits by date.
      // It extracts operation if possible.
    })
  })
})
