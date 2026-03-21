import { parseSinglePdfString, splitCardStatements } from '../../api'

describe('splitCardStatements', () => {
  it('splits one PDF text with multiple card statements and keeps transactions under correct accounts', () => {
    const combinedPdfText = `
Фридом Банк Казахстан
Выписка по карте First Card
Номер счётаВалютаОстаток
KZ111111111111111111 KZT 19,455.00

Дата Сумма Валюта Операция Детали
01.01.2026 -100.00 ₸ KZT Перевод Получатель:

Выписка по карте Second Card
Номер счётаВалютаОстаток
KZ222222222222222222 KZT 5,000.00

Дата Сумма Валюта Операция Детали
02.01.2026 +200.00 ₸ KZT Пополнение PEREVOD BCC.KZ
    `.trim()

    const parts = splitCardStatements(combinedPdfText)
    expect(parts).toHaveLength(2)

    const first = parseSinglePdfString(parts[0], 'uid-1')
    const second = parseSinglePdfString(parts[1], 'uid-2')

    expect(first.account.id).toBe('KZ111111111111111111')
    expect(first.transactions).toHaveLength(1)
    expect(first.transactions[0].statementUid).toBe('uid-1')
    expect(first.transactions[0].date).toBe('2026-01-01T00:00:00.000')

    expect(second.account.id).toBe('KZ222222222222222222')
    expect(second.transactions).toHaveLength(1)
    expect(second.transactions[0].statementUid).toBe('uid-2')
    expect(second.transactions[0].date).toBe('2026-01-02T00:00:00.000')
  })
})
