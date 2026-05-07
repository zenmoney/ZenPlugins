import * as fs from 'fs'
import * as path from 'path'
import { isAccountStatement, parseAccountHeader, parseAccountTransactions } from '../account-parser'

const TEST_DATA_DIR = path.join(__dirname, 'test_data')

describe('Account Statement Parser', () => {
  describe('compact card statement format', () => {
    const content = `
Выписка по карточному счету
TEST USER
ИИН: 111111111111
Доступно на 13.04.2026: 0.00 KZT
Номер счета: KZ000000000000000001
Валюта счета: KZT
Детализация выписки по Дебетовой карте
Дата Сумма Описание Детализация
13.04.2026 -99.98 KZT Перевод На счет: KZ000000000000000002
11.04.2026 2510.70 KZT Платеж АЛСЕКО;NameVC=Коммуналка;VC=2;VC2=3;ServiceId=190;PAYMENT_ID=test-payment-id-compact-0001;USEBONUS=1;BONUS_AMOUNT=2510.70
11.04.2026 -48025.09 KZT Платеж АЛСЕКО;NameVC=Коммуналка;VC=2;VC2=3;ServiceId=190;PAYMENT_ID=test-payment-id-compact-0001;USEBONUS=1;BONUS_AMOUNT=2510.70
11.04.2026 100.00 KZT Пополнение счета BCC, ATM/POS: 124884, PEREVOD BCC.KZ, Al-Farabi 38, ALMATY, KZ
11.04.2026 45503.70 KZT Пополнение счета BCC, ATM/POS: 124884, PEREVOD BCC.KZ, Al-Farabi 38, ALMATY, KZ
11.04.2026 10.67 KZT Пополнение счета Снятие со вклада (КНП 322) ;ISJUR
Сформировано в Интернет Банкинге
    `

    it('should detect compact card statement as account statement', () => {
      expect(isAccountStatement(content)).toBe(true)
    })

    it('should parse compact card statement header correctly', () => {
      const header = parseAccountHeader(content)
      expect(header.accountNumber).toBe('KZ000000000000000001')
      expect(header.currency).toBe('KZT')
      expect(header.balance).toBe(0)
    })

    it('should parse compact card statement transactions correctly', () => {
      const transactions = parseAccountTransactions(content)
      expect(transactions).toHaveLength(6)

      expect(transactions[0]).toMatchObject({
        date: '13.04.2026',
        amount: -99.98,
        operation: 'Transfer',
        parsedDetails: expect.objectContaining({
          receiverAccount: 'KZ000000000000000002'
        })
      })

      expect(transactions[1]).toMatchObject({
        date: '11.04.2026',
        amount: 2510.70,
        operation: 'Платеж'
      })

      expect(transactions[3]).toMatchObject({
        date: '11.04.2026',
        amount: 100,
        operation: 'Account replenishment',
        description: 'BCC, ATM/POS: 124884, PEREVOD BCC.KZ, Al-Farabi 38, ALMATY, KZ'
      })
    })

    it('should treat correspondent-account replenishment as internal transfer', () => {
      const transferContent = `
Выписка по карточному счету
TEST USER
ИИН: 111111111111
Доступно на 13.04.2026: 0.00 KZT
Номер счета: KZ000000000000000001
Валюта счета: KZT
Детализация выписки по Дебетовой карте
Дата Сумма Описание Детализация
13.04.2026 99.98 KZT Пополнение счета Bank: IRTYKZKA (АО ForteBank), Счёт- корреспондент: KZ000000000000000002 Пополнение счёта
      `

      const [transaction] = parseAccountTransactions(transferContent)
      expect(transaction).toMatchObject({
        date: '13.04.2026',
        amount: 99.98,
        operation: 'Transfer',
        parsedDetails: expect.objectContaining({
          receiverAccount: 'KZ000000000000000002',
          receiver: expect.stringContaining('KZ000000000000000002')
        })
      })
    })
  })

  describe('account_statementKZT_EN.txt', () => {
    const file = 'account_statementKZT_EN.txt'
    const content = fs.readFileSync(path.join(TEST_DATA_DIR, file), 'utf8')

    it('should detect as account statement', () => {
      expect(isAccountStatement(content)).toBe(true)
    })

    it('should parse header correctly', () => {
      const header = parseAccountHeader(content)
      expect(header.accountNumber).toBe('KZ000000000000000000')
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
