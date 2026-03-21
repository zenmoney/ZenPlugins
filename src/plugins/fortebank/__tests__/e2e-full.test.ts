import * as fs from 'fs'
import * as path from 'path'
import { detectLocale, splitSections, parseHeader, parseTransactions } from '../parser'

const TEST_DATA_DIR = path.join(__dirname, 'test_data')

describe('Fortebank KZ E2E Parsing - Full Real Data', () => {
  const filePath = path.join(TEST_DATA_DIR, 'statementKZT-RU-full.txt')
  const fileContent = fs.readFileSync(filePath, 'utf-8')

  it('should recognize RU locale', () => {
    const locale = detectLocale(fileContent)
    expect(locale).toBe('ru')
  })

  it('should parse sections correctly', () => {
    const locale = detectLocale(fileContent)
    const sections = splitSections(fileContent, locale)

    expect(sections.header).toContain('И В А Н О В   И В А Н   И В А Н О В И Ч')
    expect(sections.header).toContain('K Z 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9 9')
    expect(sections.transactions).toContain('3 0 . 1 1 . 2 0 2 5')
    expect(sections.attic).toContain('С ф о р м и р о в а н о   в   И н т е р н е т   Б а н к и н г е')
  })

  it('should parse header details correctly', () => {
    const locale = detectLocale(fileContent)
    const sections = splitSections(fileContent, locale)
    const header = parseHeader(sections.header, locale)

    expect(header.accountNumber).toBe('KZ999999999999999999')
    expect(header.currency).toBe('KZT')
    expect(header.balance).toBe(20860.52)
  })

  it('should parse all transactions correctly', () => {
    const locale = detectLocale(fileContent)
    const sections = splitSections(fileContent, locale)
    const transactions = parseTransactions(sections.transactions)

    // Count total transactions manually from the file: 173 transactions (based on parser output and grep check)
    expect(transactions).toHaveLength(173)

    // 1. Simple Purchase
    const t1 = transactions[0] // 30.11.2025 -5550.00 KZT
    expect(t1).toMatchObject({
      date: '30.11.2025',
      amount: -5550.00,
      operation: 'Покупка',
      parsedDetails: expect.objectContaining({
        mcc: 5411,
        merchantName: 'IP ZOKIROV'
      })
    })

    // 2. Payment (utility)
    // 10.11.2025 -8415.31 KZT Платеж Алсеко ...
    const tPayment = transactions.find(t => t.date === '10.11.2025' && t.amount === -8415.31)
    expect(tPayment).toBeDefined()
    expect(tPayment?.operation).toBe('Платеж') // Not in KNOWN_OPERATIONS probably? Or detected as fallback?
    // Actually 'Платеж' is not in the list I added earlier? I added 'Оплата', 'Purchase', 'Payment'.
    // Wait, 'Платеж' might fall through to default or be detected if added.
    // Let's check KNOWN_OPERATIONS in parser.ts... it has 'Оплата', but 'Платеж' might be missing.
    // If missing, it will be 'Purchase' (if negative) or 'Account replenishment' (if positive).
    // This test will fail if 'Платеж' is not detected. I should add it if it fails.

    // 3. Cash Withdrawal
    // 25.11.2025 -63000.00 KZT Снятие наличных денег ...
    const tWithdrawal = transactions.find(t => t.date === '25.11.2025' && t.amount === -63000.00)
    expect(tWithdrawal).toMatchObject({
      operation: 'Снятие наличных денег', // Fully matched now
      parsedDetails: expect.objectContaining({
        merchantBank: 'Kaspi Bank',
        atmCode: 'ATM/POS: RCL01115',
        merchantLocation: 'NAURYZ ALMATY KZ'
      })
    })

    // 4. Multi-currency Purchase
    // 31.10.2025 -1375.29 KZT (31000.00 UZS) Yandex.Go ...
    const tMulti = transactions.find(t => t.date === '31.10.2025' && t.amount === -1375.29)
    expect(tMulti).toBeDefined()
    expect(tMulti?.description).toContain('(31000.00 UZS)')
    expect(tMulti?.parsedDetails?.merchantName).toContain('Yandex.Go')
    expect(tMulti?.parsedDetails?.mcc).toBe(4789)
    expect(tMulti?.parsedDetails?.foreignAmount).toBe(-31000)
    expect(tMulti?.parsedDetails?.foreignCurrency).toBe('UZS')

    // 5. Replenishment / Transfer
    // 29.11.2025 119000.00 KZT Пополнение счета Перевод собственных средств...
    const tReplenish = transactions.find(t => t.date === '29.11.2025' && t.amount === 119000.00)
    expect(tReplenish).toMatchObject({
      operation: 'Пополнение счета',
      details: expect.stringContaining('Перевод собственных средств')
    })

    // 6. Refund
    // 22.11.2025 31821.00 KZT Возврат денег OZON.KZ ...
    const tRefund = transactions.find(t => t.date === '22.11.2025' && t.amount === 31821.00)
    expect(tRefund).toMatchObject({
      operation: 'Возврат денег', // "Возврат денег" matches "Возврат" prefix?
      parsedDetails: expect.objectContaining({
        merchantName: expect.stringContaining('OZON.KZ') // Rough check
      })
    })

    // 7. Transfer (Outgoing)
    // 26.11.2025 -50000.00 KZT Перевод Получатель: 440043******8524
    const tTransfer = transactions.find(t => t.date === '26.11.2025' && t.amount === -50000.00)
    expect(tTransfer).toMatchObject({
      operation: 'Перевод',
      parsedDetails: expect.objectContaining({
        receiver: expect.stringContaining('440043******8524')
      })
    })
  })
})
