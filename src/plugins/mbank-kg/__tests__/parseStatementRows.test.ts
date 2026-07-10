import { looksLikeMBankStatement, parseStatementRows } from '../parser-xls'
import { convertAccount, convertTransactions } from '../converters'

// Anonymized copy of a real statement layout (name & account number scrubbed,
// amounts kept representative). Mirrors sheet "report-statement-account-rbs".
const ROWS: string[][] = [
  ['', '', '', '', '', ''],
  ['ОАО "Мбанк"', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Выписка из лицевого счета за период с 01.06.2026 по  21.06.2026', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Лицевой счет: 1099000000000099', '', '', '', '', ''],
  ['Валюта: KGS', '', '', '', '', ''],
  ['ФИО/Наименование клиента: ИВАН ИВАНОВ', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Состояние счета на: 21.06.2026', '', '', '', '', ''],
  ['Текущий остаток средств: 1 540 069,11', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Дата', 'Получатель/Плательщик', 'Дебет', 'Кредит', 'Операция', ''],
  ['28.05.2026 20:42', 'ОАО "МБАНК"', '1 749,13', '0,00', '840\\912 1844160\\STEAMGAMES.COM 4259522985\\ 479338001153467\\', ''],
  ['01.06.2026 14:08', 'ОАО "МБАНК"', '0,00', '1 805 735,73', 'MBIZ_MBANK Заработная плата за Май 2026 г', ''],
  ['01.06.2026 14:17', 'Рахат Б.', '100 000,00', '0,00', 'Перевод по номеру телефона. 996550366144/ Рахат Б./  / Сумма 100,000.00 KGS Счет корреспондента 00020201-00003-417-000006975775 (ФИЛИАЛ "МЕДАКАДЕМИЯ" ОАО "МБАНК").', ''],
  ['10.06.2026 22:44', 'ОАО "МБАНК"', '0,00', '21,80', 'Возврат после корректировки платежа', ''],
  ['', '', '', '', '', ''],
  ['Средства на начало периода:', '', '873 273,24', '', '', ''],
  ['Зачисления за период:', '', '1 971 919,21', '', '', ''],
  ['Списания за период:', '', '1 303 104,80', '', '', ''],
  ['Средства на конец периода:', '', '1 540 069,11', '', '', ''],
  ['', '', '', '', '', ''],
  ['Дата: 21.06.2026', '', '', '', '', ''],
  ['', '', '', '', '', '']
]

describe('parseStatementRows', () => {
  it('recognizes an MBank statement', () => {
    expect(looksLikeMBankStatement(ROWS)).toBe(true)
    expect(looksLikeMBankStatement([['hello', 'world']])).toBe(false)
  })

  it('parses account metadata', () => {
    const { account } = parseStatementRows(ROWS)
    expect(account).toEqual({
      id: '1099000000000099',
      title: 'MBank *0099',
      balance: 1540069.11,
      instrument: 'KGS',
      date: '2026-06-21T00:00:00.000'
    })
  })

  it('parses only transaction rows (skips header/footer/blanks)', () => {
    const { transactions } = parseStatementRows(ROWS)
    expect(transactions).toHaveLength(4)
    expect(transactions.map(t => t.date)).toEqual([
      '2026-05-28T20:42:00.000',
      '2026-06-01T14:08:00.000',
      '2026-06-01T14:17:00.000',
      '2026-06-10T22:44:00.000'
    ])
  })

  it('captures raw debit/credit/payee/description and a stable uid', () => {
    const { transactions } = parseStatementRows(ROWS)
    const first = transactions[0]
    expect(first.debit).toBe('1 749,13')
    expect(first.credit).toBe('0,00')
    expect(first.payee).toBe('ОАО "МБАНК"')
    expect(first.description).toContain('STEAMGAMES.COM')
    expect(first.uid.startsWith('1099000000000099#')).toBe(true)

    // Re-parsing the same rows yields identical ids (dedup stability).
    const again = parseStatementRows(ROWS)
    expect(again.transactions[0].uid).toBe(first.uid)
  })

  it('reads the closing balance from the split-cell footer even without "Текущий остаток"', () => {
    const rows = ROWS.filter(r => !r[0].includes('Текущий остаток средств'))
    expect(parseStatementRows(rows).account.balance).toBe(1540069.11)
  })

  it('falls back to the inline "Текущий остаток" balance when the footer row is absent', () => {
    const rows = ROWS.filter(r => !r[0].includes('Средства на конец периода'))
    expect(parseStatementRows(rows).account.balance).toBe(1540069.11)
  })

  it('defaults instrument to KGS when "Валюта:" is absent', () => {
    const rows = ROWS.filter(r => !r[0].includes('Валюта:'))
    expect(parseStatementRows(rows).account.instrument).toBe('KGS')
  })

  it('gives identical duplicate rows distinct ids (no uniqBy collapse)', () => {
    const dup: string[] = ['13.06.2026 09:10', 'ОАО "МБАНК"', '0,00', '5 000,00', 'CASH IN', '']
    const headerIdx = ROWS.findIndex(r => r[0] === 'Дата')
    const rows = [...ROWS.slice(0, headerIdx + 1), dup, dup, ...ROWS.slice(headerIdx + 1)]
    const { transactions } = parseStatementRows(rows)
    const ids = transactions.map(t => t.uid)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives distinct ids to rows that differ only by payer', () => {
    const headerIdx = ROWS.findIndex(r => r[0] === 'Дата')
    const a: string[] = ['01.06.2026 12:00', 'Cafe A', '100,00', '0,00', 'Оплата товаров', '']
    const b: string[] = ['01.06.2026 12:00', 'Cafe B', '100,00', '0,00', 'Оплата товаров', '']
    const rows = [...ROWS.slice(0, headerIdx + 1), a, b, ...ROWS.slice(headerIdx + 1)]
    const { transactions } = parseStatementRows(rows)
    const ids = transactions.map(t => t.uid)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('throws on a non-MBank sheet', () => {
    expect(() => parseStatementRows([['some', 'random', 'spreadsheet']])).toThrow()
  })

  it('throws when the account number is missing', () => {
    const rows = ROWS.map(r => (r[0].includes('Лицевой счет:') ? ['Лицевой счет: ', ...r.slice(1)] : r))
    expect(() => parseStatementRows(rows)).toThrow()
  })
})

// Anonymized USD statement (mirrors the real foreign-currency account layout):
// a card POS in USD and a RUB→USD currency exchange.
const ROWS_USD: string[][] = [
  ['', '', '', '', '', ''],
  ['ОАО "Мбанк"', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Выписка из лицевого счета за период с 24.03.2026 по  21.06.2026', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Лицевой счет: 1030100000000012', '', '', '', '', ''],
  ['Валюта: USD', '', '', '', '', ''],
  ['ФИО/Наименование клиента: ИВАН ИВАНОВ', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Состояние счета на: 21.06.2026', '', '', '', '', ''],
  ['Текущий остаток средств: 2,94', '', '', '', '', ''],
  ['', '', '', '', '', ''],
  ['Дата', 'Получатель/Плательщик', 'Дебет', 'Кредит', 'Операция', ''],
  ['01.06.2026 23:51', 'ОАО "МБАНК"', '0,09', '0,00', '372\\Dublin\\Google CLOUD DP77zM\\ 479631000202594\\', ''],
  ['09.06.2026 11:16', 'ОАО "МБАНК"', '0,00', '2,28', 'Конвертация валют (из валюты 171.34 RUB в валюту 2.28 USD).; ПЛАТЕЛЬЩИК: 000005446305 RUB ПОЛУЧАТЕЛЬ: 000003892368 USD;  Курс операции: 75.', ''],
  ['', '', '', '', '', ''],
  ['Средства на начало периода:', '', '0,75', '', '', ''],
  ['Зачисления за период:', '', '2,28', '', '', ''],
  ['Списания за период:', '', '0,09', '', '', ''],
  ['Средства на конец периода:', '', '2,94', '', '', ''],
  ['', '', '', '', '', ''],
  ['Дата: 21.06.2026', '', '', '', '', '']
]

describe('parseStatementRows — USD account', () => {
  it('parses a foreign-currency account with the right instrument and balance', () => {
    const { account } = parseStatementRows(ROWS_USD)
    expect(account).toEqual({
      id: '1030100000000012',
      title: 'MBank *0012',
      balance: 2.94,
      instrument: 'USD',
      date: '2026-06-21T00:00:00.000'
    })
  })

  it('converts a USD card POS and a RUB→USD exchange (invoice in RUB)', () => {
    const { account, transactions } = parseStatementRows(ROWS_USD)
    const txs = convertTransactions(account.id, transactions).map(x => x.transaction)
    expect(txs).toHaveLength(2)

    expect(txs[0].merchant).toEqual({ fullTitle: 'Google CLOUD DP77zM', mcc: null, location: null })
    expect(txs[0].movements[0].sum).toBe(-0.09)

    expect(txs[1].movements[0].sum).toBe(2.28)
    expect(txs[1].movements[0].invoice).toEqual({ sum: 171.34, instrument: 'RUB' })
    expect(txs[1].comment).toBeNull()
  })

  it('account balance reconciles with the footer', () => {
    expect(convertAccount(parseStatementRows(ROWS_USD).account).balance).toBe(2.94)
  })
})
