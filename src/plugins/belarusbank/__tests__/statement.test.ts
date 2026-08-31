import { convertCard } from '../converters'
import { parseStatementTransactions } from '../statement'

// Test records are synthetic and must not be copied from real bank data.
describe('Belarusbank statement parser', () => {
  it('parses major-unit amounts, signs and a row split by a page header', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: 'BYN' })
    const text = [
      '10.01.2025',
      '10:10:56',
      '10.01.2025250,00 BYN+250,00250,00Дополнительный взнос',
      '10.01.2025',
      '11:09:25',
      '11.01.2025250,00 BYN250,000,00',
      'Оплата товаров и услуг',
      '05.02.2026 06.02.2026321,00 RUB+11,110,00Перевод средств держателю карты',
      'Дата и',
      'время',
      'совершения',
      'операции',
      'Номер карты',
      '07:28:13',
      'PERSON TO PERSON',
      '0000***1111',
      '08.02.2026',
      '21:51:12',
      '08.02.20260,00 BYN0,000,00Капитализация',
      'Реквизиты банка:'
    ].join('\n')

    const transactions = parseStatementTransactions(text, account)

    expect(transactions).toHaveLength(3)
    expect(transactions.map((transaction) => transaction.movements[0].sum)).toEqual([250, -250, 11.11])
    expect(transactions[2]).toMatchObject({
      hold: false,
      date: new Date('2026-02-05T07:28:13+03:00'),
      groupKeys: ['belarusbank:p2p:2026-02-05T04:28:13.000Z:RUB:321.00'],
      comment: 'Перевод средств держателю карты PERSON TO PERSON',
      movements: [{
        account: { id: 'card-1' },
        sum: 11.11,
        invoice: { sum: 321, instrument: 'RUB' }
      }]
    })
    expect(transactions.every((transaction) => transaction.movements[0].id?.match(/^[a-f0-9]{32}$/) != null)).toBe(true)
  })

  it('does not scale a decimal amount by one hundred', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: 'RUB' })
    const transactions = parseStatementTransactions([
      '04.02.2026',
      '08:15:30',
      '04.02.2026 456,77 RUB +456,77 456,78',
      'Зачисление процентов'
    ].join('\n'), account)

    expect(transactions[0].movements[0].sum).toBe(456.77)
  })

  it('keeps identical rows distinct by their occurrence in the statement', () => {
    const account = convertCard({ productId: 'card-1', currencyIso: 'BYN' })
    const row = [
      '04.02.2026',
      '08:15:30',
      '04.02.2026 1,00 BYN 1,00 455,78',
      'Одинаковая операция'
    ]
    const transactions = parseStatementTransactions([...row, ...row].join('\n'), account)

    expect(transactions).toHaveLength(2)
    expect(transactions[0].movements[0].id).not.toBe(transactions[1].movements[0].id)
  })
})
