import { convertOperation } from '../../converters'

describe('convertOperation', () => {
  it('converts a card EXPENSE (RUB) with negative amount and numeric currency code', () => {
    const apiOp = {
      id: 700001,
      accountId: 1000002,
      operationType: 'EXPENSE',
      operationKind: 'FINANCIAL',
      accountNumber: '40817810000000000002',
      date: '2024-01-15 12:00:00',
      timestamp: 1705320000000,
      amount: -1234.56,
      currency: '810',
      status: 'SUCCESS',
      note: 'Тестовое описание операции',
      mccCode: '5411',
      payer: 'Тестовый Плательщик, счет 40817810000000000002, БИК 044525900',
      recepient: 'Тестовый Получатель, счет 30232810000000000000, БИК 044525900',
      category: 'Прочее',
      locationName: 'TEST MERCHANT MOSCOW RU'
    }
    const tx = convertOperation(apiOp, '1000002')
    if (tx == null) {
      throw new Error('expected non-null transaction')
    }
    expect(tx.hold).toBe(false)
    expect(tx.date.getTime()).toBe(1705320000000)
    expect(tx.movements).toEqual([{
      id: '700001',
      account: { id: '1000002' },
      invoice: null,
      sum: -1234.56,
      fee: 0
    }])
    expect(tx.merchant).toEqual({
      fullTitle: 'TEST MERCHANT MOSCOW RU',
      mcc: 5411,
      location: null
    })
    expect(tx.comment).toBe('Тестовое описание операции')
  })

  it('converts an INCOME on USD account from /accounts/statement', () => {
    const apiOp = {
      id: 700002,
      accountId: 2000003,
      operationType: 'INCOME',
      accountNumber: '40817840000000000003',
      date: '2024-01-16 09:00:00',
      timestamp: 1705395600000,
      amount: 100,
      currency: '840',
      currencyDesc: 'Доллар Сша',
      status: 'SUCCESS',
      note: 'Тестовое поступление',
      payer: 'Тестовый Банк-Отправитель, счет 30233840000000000000, БИК 044525900',
      recepient: 'Тестовый Получатель, счет 40817840000000000003, БИК 044525900',
      category: '- внутренние безналичные расчеты'
    }
    const tx = convertOperation(apiOp, '2000003')
    if (tx == null) {
      throw new Error('expected non-null transaction')
    }
    expect(tx.movements[0].sum).toBe(100)
    expect(tx.merchant).toEqual({
      fullTitle: 'Тестовый Банк-Отправитель',
      mcc: null,
      location: null
    })
  })

  it('rejects operations without amount or currency', () => {
    expect(convertOperation({ id: 1, date: '2024-01-01 00:00:00', amount: null, currency: '810', status: 'SUCCESS' }, 'x')).toBeNull()
    expect(convertOperation({ id: 1, date: '2024-01-01 00:00:00', amount: 5, currency: null, status: 'SUCCESS' }, 'x')).toBeNull()
  })
})
