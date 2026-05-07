import { parseAccounts, parseTransactions, parseSinglePdfString, normalizeSpacedText, isEubankStatement } from '../../api'

const sampleStatement = `АО "Евразийский Банк"
A25Y5K2, г. Алматы, ул. Кунаева, 56
Тел: +7 (727) 332 7722, eubank.kz
WhatsApp: +7 (777) 000-77-22
БИК: EURIKZKA
Выписка по счёту: \tДата формирования : 13.04.2026 21:00:58
Период : 14.03.2026 - 14.04.2026
ФИО : ИВАНОВ ИВАН ИВАНОВИЧ
ИИН : 000000000000
Номер карты : 401234******9876
Валюта счёта: KZT
Номер счёта \tKZ123456789B01234567
Доступно на 14.03.2026 \t8500.00 ₸
Доступно на 14.04.2026 \t5230.50 ₸
Приход за период \t850000 ₸
Расход за период \t-1500000.00 ₸
Валюта счёта: USD
Номер счёта \tKZ123456789B01234567
Доступно на 14.03.2026 \t0 $
Доступно на 14.04.2026 \t1.25 $
Приход за период \t5000.00 $
Расход за период \t-4998.75 $

Доступно на 14.03.2026 : 8500.00 ₸ / 0 $
Дата \tТип операции \tДетали операции \tСумма операции \tВалюта операции Сумма в валюте
счета
Номер карты/
счёта
14.03.2026
15:52:00 Финансы \tДепозит \t20000 \tKZT \t+20000 \tСчёт: **4567
14.03.2026
15:52:33 Кафе и рестораны STARBUCKS
COFFEE SHOP 5400 \tKZT \t-5400 \tКарта: **9876
14.03.2026
16:39:35 Кафе и рестораны \tIP TYAN \t27600 \tKZT \t-27600 \tКарта: **9876
19.03.2026
12:19:22 Путешествия AIRBNB *
HM3AJJZFHC 242.65 \tUSD \t-242.65 \tКарта: **9876
19.03.2026
17:15:55 Финансы \tТекущий счет \t243 \tUSD \t+243 \tСчёт: **4567
08.04.2026
15:31:57 Пополнение \tВ терминале \t7792.21 \tUSD \t+7792.21 \tСчёт: **4567
08.04.2026
15:37:14 Финансы \tVisa Infinite \t7792.49 \tUSD \t-7792.49 \tСчёт: **4567
27.03.2026
14:17:37 Пополнение Пополнение с
Бонусов 139000 \tKZT \t+139000 \tСчёт: **4567
26.03.2026
12:09:19
Здоровье и
красота
BEAUTY-SMILE
DENTAL CLIN 139000 \tKZT \t-139000 \tКарта: **9876
13.04.2026
17:05:25 Финансы \tДепозит \t30000 \tKZT \t+30000 \tСчёт: **4567
Доступно на 14.04.2026 : 5230.50 ₸ / 1.25 $`

const spacedStatement = `А О   " Е в р а з и й с к и й   Б а н к "
A 2 5 Y 5 K 2 ,   г .   А л м а т ы ,   у л .   К у н а е в а ,   5 6
Т е л :   + 7   ( 7 2 7 )   3 3 2   7 7 2 2 ,   e u b a n k . k z
Б И К :   E U R I K Z K A
В ы п и с к а   п о   с ч ё т у : Д а т а   ф о р м и р о в а н и я   :   1 3 . 0 4 . 2 0 2 6   2 1 : 0 0 : 5 8
П е р и о д   :   1 4 . 0 3 . 2 0 2 6   -   1 4 . 0 4 . 2 0 2 6
Н о м е р   к а р т ы   :   4 0 1 2 3 4 * * * * * * 9 8 7 6
В а л ю т а   с ч ё т а :   K Z T
Н о м е р   с ч ё т а K Z 1 2 3 4 5 6 7 8 9 B 0 1 2 3 4 5 6 7
Д о с т у п н о   н а   1 4 . 0 3 . 2 0 2 6 8 5 0 0 . 0 0   ₸
Д о с т у п н о   н а   1 4 . 0 4 . 2 0 2 6 5 2 3 0 . 5 0   ₸
П р и х о д   з а   п е р и о д 8 5 0 0 0 0   ₸
Р а с х о д   з а   п е р и о д - 1 5 0 0 0 0 0 . 0 0   ₸
В а л ю т а   с ч ё т а :   U S D
Н о м е р   с ч ё т а K Z 1 2 3 4 5 6 7 8 9 B 0 1 2 3 4 5 6 7
Д о с т у п н о   н а   1 4 . 0 3 . 2 0 2 6 0   $
Д о с т у п н о   н а   1 4 . 0 4 . 2 0 2 6 1 . 2 5   $
Д а т а Т и п   о п е р а ц и и Д е т а л и   о п е р а ц и и С у м м а   о п е р а ц и и В а л ю т а   о п е р а ц и и
С у м м а   в   в а л ю т е
с ч е т а
Н о м е р   к а р т ы /
с ч ё т а
1 4 . 0 3 . 2 0 2 6
1 5 : 5 2 : 0 0
Ф и н а н с ы   Д е п о з и т 2 0 0 0 0 K Z T + 2 0 0 0 0 С ч ё т :   * * 4 5 6 7
1 4 . 0 3 . 2 0 2 6
1 5 : 5 2 : 3 3
К а ф е   и   р е с т о р а н ы   S T A R B U C K S
C O F F E E   S H O P 5 4 0 0 K Z T - 5 4 0 0 К а р т а :   * * 9 8 7 6
Д о с т у п н о   н а   1 4 . 0 4 . 2 0 2 6   :   5 2 3 0 . 5 0   ₸   /   1 . 2 5   $`

describe('normalizeSpacedText', () => {
  it('should normalize text with per-character spacing', () => {
    const result = normalizeSpacedText('А О   " Е в р а з и й с к и й   Б а н к "')
    expect(result).toBe('АО "Евразийский Банк"')
  })

  it('should normalize numbers and dates', () => {
    const result = normalizeSpacedText('1 4 . 0 3 . 2 0 2 6')
    expect(result).toBe('14.03.2026')
  })

  it('should not modify normal text', () => {
    const result = normalizeSpacedText('АО "Евразийский Банк"')
    expect(result).toBe('АО "Евразийский Банк"')
  })

  it('should handle merged fields after normalization', () => {
    const result = normalizeSpacedText('Д о с т у п н о   н а   1 4 . 0 4 . 2 0 2 6 5 2 3 0 . 5 0   ₸')
    expect(result).toBe('Доступно на 14.04.20265230.50 ₸')
  })
})

describe('isEubankStatement', () => {
  it('should detect normal text', () => {
    expect(isEubankStatement('АО "Евразийский Банк"')).toBe(true)
  })

  it('should detect spaced text', () => {
    expect(isEubankStatement('А О   " Е в р а з и й с к и й   Б а н к "')).toBe(true)
  })

  it('should return false for other banks', () => {
    expect(isEubankStatement('Kaspi Bank')).toBe(false)
  })
})

describe('parseAccounts', () => {
  it('should parse multi-currency accounts from normal text', () => {
    const accounts = parseAccounts(sampleStatement)
    expect(accounts).toHaveLength(2)

    expect(accounts[0]).toEqual({
      id: 'KZ123456789B01234567',
      balance: 5230.50,
      instrument: 'KZT',
      cardNumber: '401234******9876'
    })

    expect(accounts[1]).toEqual({
      id: 'KZ123456789B01234567',
      balance: 1.25,
      instrument: 'USD',
      cardNumber: '401234******9876'
    })
  })

  it('should parse accounts from normalized spaced text', () => {
    const normalized = normalizeSpacedText(spacedStatement)
    const accounts = parseAccounts(normalized)
    expect(accounts).toHaveLength(2)
    expect(accounts[0].id).toBe('KZ123456789B01234567')
    expect(accounts[0].instrument).toBe('KZT')
    expect(accounts[0].balance).toBe(5230.50)
    expect(accounts[1].instrument).toBe('USD')
    expect(accounts[1].balance).toBe(1.25)
  })
})

describe('parseTransactions', () => {
  it('should parse transactions from normal text', () => {
    const transactions = parseTransactions(sampleStatement, 'test-uid')
    expect(transactions.length).toBeGreaterThan(0)

    const starbucks = transactions.find(t => t.details.includes('STARBUCKS'))
    expect(starbucks).toBeDefined()
    if (starbucks != null) {
      expect(starbucks.amount).toBe(5400)
      expect(starbucks.instrument).toBe('KZT')
      expect(starbucks.isCardOperation).toBe(true)
    }

    const deposit = transactions.find(t => t.details.includes('Депозит') && t.time === '15:52:00')
    expect(deposit).toBeDefined()
    if (deposit != null) {
      expect(deposit.amount).toBe(20000)
      expect(deposit.instrument).toBe('KZT')
    }
  })

  it('should parse transactions from normalized spaced text', () => {
    const normalized = normalizeSpacedText(spacedStatement)
    const transactions = parseTransactions(normalized, 'test-uid')
    expect(transactions.length).toBeGreaterThan(0)

    const deposit = transactions.find(t => t.details.includes('Депозит'))
    expect(deposit).toBeDefined()
    if (deposit != null) {
      expect(deposit.amount).toBe(20000)
      expect(deposit.instrument).toBe('KZT')
      expect(deposit.isCardOperation).toBe(false)
    }

    const starbucks = transactions.find(t => t.details.includes('STARBUCKS'))
    expect(starbucks).toBeDefined()
    if (starbucks != null) {
      expect(starbucks.amount).toBe(5400)
      expect(starbucks.instrument).toBe('KZT')
      expect(starbucks.isCardOperation).toBe(true)
    }
  })
})

describe('parseSinglePdfString', () => {
  it('should return accounts, transactions and statementDate from normal text', () => {
    const result = parseSinglePdfString(sampleStatement, 'test-uid')
    expect(result.accounts).toHaveLength(2)
    expect(result.transactions.length).toBeGreaterThan(0)
    expect(result.statementDate).toBe('2026-04-14T00:00:00.000')
  })
})
