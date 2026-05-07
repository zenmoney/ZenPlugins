import * as fs from 'fs'
import * as path from 'path'
import { isDepositStatement, parseDepositHeader } from '../deposit-parser'

const TEST_DATA_DIR = path.join(__dirname, 'test_data')

describe('Deposit Parser', () => {
  it('should parse compact deposit statement header', () => {
    const compactDepositText = `
Выписка по сберегательному счету
№ KZ000000000000000003, (KZT)
Клиент: TEST USER ИИН: 111111111111
За период: 13.03.2026 - 13.04.2026
Наименование продукта: СРОЧНЫЙ ДЕПОЗИТ ДЛЯ ФИЗИЧЕСКИХ ЛИЦ В СДБО, С ЧАСТИЧНЫМ ИЗЪЯТИЕМ_6 мес
№ договора: TEST/ADM/2026/000001
Дата договора: 10.01.2026
Дата последней пролонгации: -
Ставка по вкладу: 14,40%
Всего за период:
Остаток средств на начало Поступления Выплаченное вознаграждение Расходы Остаток средств на конец Доступная сумма
10,00 110,65 12,55 10,67 109,98 99,98
Дата выплаты вознаграждения: 30.04.2026
Сумма неснижаемого остатка: 1 000,00
    `

    const header = parseDepositHeader(compactDepositText)
    expect(header.isDeposit).toBe(true)
    expect(header.accountNumber).toBe('KZ000000000000000003')
    expect(header.currency).toBe('KZT')
    expect(header.startDate).toBe('2026-01-10')
    expect(header.percent).toBe(14.4)
    expect(header.balance).toBe(109.98)
    expect(header.startBalance).toBe(10)
  })

  const depositText = fs.readFileSync(path.join(TEST_DATA_DIR, 'deposit_statementKZT-RU.txt'), 'utf-8')

  it('should detect deposit statement', () => {
    expect(isDepositStatement(depositText)).toBe(true)
  })

  it('should parse deposit header', () => {
    const header = parseDepositHeader(depositText)
    expect(header.isDeposit).toBe(true)
    expect(header.accountNumber).toBe('KZ1296502F0020935820')
    expect(header.currency).toBe('KZT')
    expect(header.startDate).toBe('2025-12-11') // 11.12.2025
    expect(header.percent).toBe(17.00)
    expect(header.productName).toContain('Сберегательный вклад')
    // Start Balance: 0,00
    expect(header.startBalance).toBe(0)
    // End Balance: 3 600 000,00 (5th item)
    // Numbers: 0,00 | 3 600 000,00 | 0,00 | 0,00 | 3 600 000,00 | 3 500 000,00
    // Index:   0    | 1            | 2    | 3    | 4            | 5
    // Balance should be index 4 (End Balance) = 3600000
    expect(header.balance).toBe(3600000)
  })

  it('should parse EN deposit header', () => {
    const enText = fs.readFileSync(path.join(TEST_DATA_DIR, 'deposit_statementKZT-EN.txt'), 'utf-8')
    const header = parseDepositHeader(enText)
    expect(header.isDeposit).toBe(true)
    expect(header.accountNumber).toBe('KZ6996502F0020935473')
    expect(header.currency).toBe('KZT')
    expect(header.startDate).toBe('2025-12-11')
    expect(header.percent).toBe(17.00)
    expect(header.productName).toContain('Savings deposit')
    expect(header.balance).toBe(1500000)
  })

  it('should parse KZ deposit header', () => {
    const kzText = fs.readFileSync(path.join(TEST_DATA_DIR, 'deposit_statementKZT-KZ.txt'), 'utf-8')
    const header = parseDepositHeader(kzText)
    expect(header.isDeposit).toBe(true)
    expect(header.accountNumber).toBe('KZ3996502F0020935722')
    expect(header.currency).toBe('KZT')
    expect(header.startDate).toBe('2025-12-11')
    expect(header.percent).toBe(16.60)
    expect(header.productName).toContain('Толықтыру')
    expect(header.balance).toBe(1500000)
  })

  it('should not detect card statement as deposit when details mention "вклада"', () => {
    const cardStatementText = `
      Выписка по карточному счету
      Номер счета: KZ000000000000000000
      08.02.2026 23508.71 KZT Пополнение счета Снятие со вклада (КНП 322)
    `

    expect(isDepositStatement(cardStatementText)).toBe(false)
  })
})
