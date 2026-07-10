import { collapseLetterSpacing, looksLikeSimbankStatement, parseStatementText } from '../parser-pdf'
import { convertAccount, convertTransactions } from '../converters'
import { AccountType } from '../../../types/zenmoney'

// Anonymized copy of a real statement layout, mirroring the text `parsePdf` (pdfjs)
// produces: "Label :  value" prefixes, letter-spaced glyph runs (currency, some
// merchant names), the per-page header that repeats, a wrapped description, a
// positive amount and a negative running balance.
const TEXT = [
  'ВЫПИСКА ПО КАРТЕ',
  'Период :  21-12-2025 - 21-06-2026',
  'Номер карты клиента :  402183****0412',
  'Имя клиента :  Иван Иванов',
  'Валюта :  K G S',
  'Остаток на начало периода :  2 4 7   0 9 0 , 5 2   K G S',
  'Остаток на конец периода :  1 9 8   6 6 1 , 8 0   K G S',
  'Сумма установленного лимита :  2 0 0   0 0 0 , 0 0   K G S',
  'Сумма использованного лимита :  1   3 3 8 , 2 0   K G S',
  'Дата Детали операции Сумма',
  'Плата за',
  'кредит',
  'Баланс после',
  'операции',
  '21-12-2025',
  '09:49:14',
  'SB061-BBCC (LALA P -579,48 - 47 090,52',
  '21-12-2025',
  '09:49:18',
  'Simbank -0,52 - 47 090,00',
  '21-12-2025',
  '11:54:01',
  'Регулярный',
  'платеж "Пу-пу-пу"',
  '-100,00 - 46 520,01',
  '22-12-2025',
  '21:50:40',
  'Самат Дербишалиев +0,01 - 26 390,01',
  '18-06-2026',
  '11:46:29',
  'G r a b -2 688,44 - -418,44',
  '21-06-2026',
  '04:49:58',
  'P A D I N I   C O N C E P T   S T O R E -6 621,00 - -1 338,20'
].join('\n')

describe('collapseLetterSpacing', () => {
  it('collapses letter-spaced runs while keeping word gaps', () => {
    expect(collapseLetterSpacing('G r a b')).toBe('Grab')
    expect(collapseLetterSpacing('P A D I N I   C O N C E P T   S T O R E')).toBe('PADINI CONCEPT STORE')
    expect(collapseLetterSpacing('K   M A R K E T   M O N A R C H Y   D N')).toBe('K MARKET MONARCHY DN')
  })

  it('leaves normal text (single-spaced real words) untouched', () => {
    expect(collapseLetterSpacing('SB061-BBCC (LALA P')).toBe('SB061-BBCC (LALA P')
    expect(collapseLetterSpacing('VTS Netflix.com')).toBe('VTS Netflix.com')
    expect(collapseLetterSpacing('Самат Дербишалиев')).toBe('Самат Дербишалиев')
  })

  it('does not collapse a name that merely has single-letter words', () => {
    // Mixed tokens (not every token is a single char) → keep as-is, never "KFCBISHKEK".
    expect(collapseLetterSpacing('K F C BISHKEK')).toBe('K F C BISHKEK')
    expect(collapseLetterSpacing('H & M - LOT 10')).toBe('H & M - LOT 10')
  })
})

describe('parseStatementText', () => {
  it('recognizes a Simbank statement', () => {
    expect(looksLikeSimbankStatement(TEXT)).toBe(true)
    expect(looksLikeSimbankStatement('hello world')).toBe(false)
  })

  it('parses account metadata (letter-spaced balance/currency/limit)', () => {
    const { account } = parseStatementText(TEXT)
    expect(account).toEqual({
      id: '402183****0412',
      title: 'Simbank *0412',
      balance: -1338.20, // own funds = "Баланс после операции" of the latest row
      creditLimit: 200000,
      usedLimit: 1338.20,
      instrument: 'KGS',
      date: '2026-06-21T00:00:00.000'
    })
  })

  it('parses transaction rows (skips header noise, joins wrapped/letter-spaced descriptions)', () => {
    const { transactions } = parseStatementText(TEXT)
    expect(transactions).toHaveLength(6)
    expect(transactions.map(t => [t.date, t.description, t.amount, t.balance])).toEqual([
      ['2025-12-21T09:49:14.000', 'SB061-BBCC (LALA P', '-579,48', '47090,52'],
      ['2025-12-21T09:49:18.000', 'Simbank', '-0,52', '47090,00'],
      ['2025-12-21T11:54:01.000', 'Регулярный платеж "Пу-пу-пу"', '-100,00', '46520,01'],
      ['2025-12-22T21:50:40.000', 'Самат Дербишалиев', '+0,01', '26390,01'],
      ['2026-06-18T11:46:29.000', 'Grab', '-2688,44', '-418,44'],
      ['2026-06-21T04:49:58.000', 'PADINI CONCEPT STORE', '-6621,00', '-1338,20']
    ])
  })

  it('keeps a money-shaped token inside the description (no column shift)', () => {
    const text = [
      'ВЫПИСКА ПО КАРТЕ',
      'Simbank',
      'Период :  21-12-2025 - 21-06-2026',
      'Номер карты клиента :  402183****0412',
      'Валюта :  K G S',
      'Остаток на конец периода :  900,00 KGS',
      '21-12-2025',
      '09:00:00',
      'Fuel 35,50 -100,00 - 900,00'
    ].join('\n')
    const { transactions } = parseStatementText(text)
    expect(transactions).toHaveLength(1)
    expect([transactions[0].description, transactions[0].amount, transactions[0].balance]).toEqual(['Fuel 35,50', '-100,00', '900,00'])
  })

  it('parses the credit-fee column without dropping the row', () => {
    const text = [
      'ВЫПИСКА ПО КАРТЕ',
      'Simbank',
      'Период :  21-12-2025 - 21-06-2026',
      'Номер карты клиента :  402183****0412',
      'Остаток на конец периода :  -54 169,93 KGS',
      '26-05-2026',
      '11:12:47',
      'Эльвира М. -7 416,00 216,00 -54 169,93'
    ].join('\n')
    const { transactions } = parseStatementText(text)
    expect(transactions).toHaveLength(1)
    expect([transactions[0].description, transactions[0].amount, transactions[0].balance]).toEqual(['Эльвира М.', '-7416,00', '-54169,93'])
  })

  it('refuses the import when a dated row cannot be parsed (no silent loss)', () => {
    const text = [
      'ВЫПИСКА ПО КАРТЕ',
      'Simbank',
      'Период :  21-12-2025 - 21-06-2026',
      'Номер карты клиента :  402183****0412',
      'Остаток на конец периода :  100,00 KGS',
      '21-12-2025',
      '09:00:00',
      'Some operation with no parsable amount column'
    ].join('\n')
    expect(() => parseStatementText(text)).toThrow()
  })

  it('takes the account balance from the latest transaction (own funds)', () => {
    const text = [
      'Simbank',
      'Период :  21-12-2025 - 21-06-2026',
      'Номер карты клиента :  402183****0412',
      '21-12-2025',
      '09:00:00',
      'Grab -10,00 - 90,00',
      '22-12-2025',
      '09:00:00',
      'Grab -40,00 - 50,00'
    ].join('\n')
    const { account } = parseStatementText(text)
    expect(account.balance).toBe(50.00)
  })

  it('gives a row the same movement id regardless of description language', () => {
    const make = (desc: string): string => [
      'Simbank',
      'Номер карты клиента :  402183****0412',
      '21-12-2025',
      '09:00:00',
      `${desc} -100,00 - 90,00`
    ].join('\n')
    const ru = parseStatementText(make('Регулярный платеж "Пу-пу-пу"'))
    const ky = parseStatementText(make('Туруктуу төлөм "Пу-пу-пу"'))
    expect(ru.transactions[0].description).not.toBe(ky.transactions[0].description)
    // ...but the dedup id matches, so importing the same statement in two languages
    // doesn't double the transactions.
    expect(ru.transactions[0].uid).toBe(ky.transactions[0].uid)
  })

  it('builds stable, unique movement ids', () => {
    const { transactions } = parseStatementText(TEXT)
    const uids = transactions.map(t => t.uid)
    expect(new Set(uids).size).toBe(uids.length)
    // Re-parsing the same text yields identical ids.
    expect(parseStatementText(TEXT).transactions.map(t => t.uid)).toEqual(uids)
  })

  it('converts to ZenMoney account and transactions with correct signs', () => {
    const { account, transactions } = parseStatementText(TEXT)
    const zenAccount = convertAccount(account)
    expect(zenAccount.syncIds).toEqual(['402183****0412'])
    // Credit card: own funds = available - limit (negative = debt to bank).
    expect(zenAccount.type).toBe(AccountType.ccard)
    expect(zenAccount.balance).toBe(-1338.20)
    expect(zenAccount.creditLimit).toBe(200000)
    expect(zenAccount.totalAmountDue).toBe(1338.20)

    const converted = convertTransactions(account.id, transactions)
    const sums = converted.map(t => t.transaction.movements[0].sum)
    expect(sums).toEqual([-579.48, -0.52, -100, 0.01, -2688.44, -6621])
    // Real merchant vs service-row comment classification.
    const merchant = converted[0].transaction.merchant
    expect(merchant != null && 'fullTitle' in merchant ? merchant.fullTitle : null).toBe('SB061-BBCC (LALA P')
    expect(converted[1].transaction.merchant).toBeNull()
    expect(converted[1].transaction.comment).toBe('Simbank')
    expect(converted[2].transaction.merchant).toBeNull()
    expect(converted[2].transaction.comment).toBe('Регулярный платеж "Пу-пу-пу"')
    expect(converted[4].transaction.movements[0].fee).toBe(0)
  })
})
