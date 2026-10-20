import { adjustTransactions } from '../../common/transactionGroupHandler'
import { recordedCards, recordedPayments } from './__fixtures__/recordedPayments'
import { convertTransactions } from './converters'

const payment = (id: number): unknown => {
  const result = recordedPayments.find(p => p.id === id)
  if (result === undefined) throw new Error('Missing recorded payment')
  return result
}
const rawPair = [payment(163829740), payment(163829629)]
const outcome = {
  hold: false,
  date: new Date('2026-10-12T16:00:53Z'),
  movements: [{ id: '163829629', account: { id: '100003' }, sum: -664.4, fee: 0, invoice: { sum: -1993.53, instrument: 'BYN' } }],
  merchant: null,
  comment: null,
  groupKeys: ['bsb-transfer:100001:2026-10-12T16:00:53.000Z:BYN:1993.53']
}
const income = {
  hold: false,
  date: new Date('2026-10-12T16:00:53Z'),
  movements: [{ id: '163829740', account: { id: '100001' }, sum: 1993.53, fee: 0, invoice: null }],
  merchant: null,
  comment: null,
  groupKeys: ['bsb-transfer:100001:2026-10-12T16:00:53.000Z:BYN:1993.53']
}
const transfer = {
  hold: false,
  date: new Date('2026-10-12T16:00:53Z'),
  movements: [...outcome.movements, ...income.movements],
  merchant: null,
  comment: null
}

it('keeps each recorded currency movement before grouping (AMOUNT-001, TRANSFER-002)', () => {
  expect([...convertTransactions(rawPair, recordedCards)]).toEqual([income, outcome])
})

it.each([false, true])('joins both recorded FX transfers without inventing or duplicating movements; reversed=%s', reverse => {
  const records = [...rawPair, payment(163774827), payment(163774758)]
  if (reverse) records.reverse()
  const result = adjustTransactions({ transactions: [...convertTransactions(records, recordedCards)] })
  result.sort((a: { date: Date }, b: { date: Date }) => b.date.getTime() - a.date.getTime())
  expect(result).toEqual([transfer, {
    hold: false,
    date: new Date('2026-10-12T11:41:51Z'),
    movements: [{ id: '163774758', account: { id: '100003' }, sum: -31.6, fee: 0, invoice: { sum: -95, instrument: 'BYN' } },
      { id: '163774827', account: { id: '100001' }, sum: 95, fee: 0, invoice: null }],
    merchant: null,
    comment: null
  }])
})

it.each([163829629, 163829740])('preserves an unpaired recorded internal side (%s), including a skipped counterpart', id => {
  const { groupKeys, ...expected } = id === 163829629 ? outcome : income
  expect(adjustTransactions({ transactions: [...convertTransactions([payment(id)], recordedCards)] })).toEqual([expected])
})

it('keeps the human ERIP label as a comment instead of a technical merchant number (COMMENT-001, MERCHANT-002)', () => {
  expect([...convertTransactions([payment(163776233), payment(163389729)], recordedCards)]).toEqual([{
    hold: false,
    date: new Date('2026-10-12T11:49:43Z'),
    movements: [{ id: '163776233', account: { id: '100001' }, sum: -10, fee: 0, invoice: null }],
    merchant: null,
    comment: 'Анна МТБ'
  }, {
    hold: false,
    date: new Date('2026-10-09T23:43:53Z'),
    movements: [{ id: '163389729', account: { id: '100001' }, sum: -100, fee: 0, invoice: null }],
    merchant: null,
    comment: 'Персональная тренировка Иван'
  }])
})

it('preserves recorded purchases, income and a foreign-currency invoice with unknown local sum', () => {
  expect([...convertTransactions([payment(163833871), payment(163798412), payment(163698631)], recordedCards)]).toEqual([{
    hold: false,
    date: new Date('2026-10-12T16:19:20Z'),
    movements: [{ id: '163833871', account: { id: '100001' }, sum: -390.91, fee: 0, invoice: null }],
    merchant: { fullTitle: 'I.-SHOP EVROOPT', mcc: null, location: null },
    comment: null
  }, {
    hold: false,
    date: new Date('2026-10-12T13:38:46Z'),
    movements: [{ id: '163798412', account: { id: '100003' }, sum: 3696, fee: 0, invoice: null }],
    merchant: { fullTitle: 'CON/easystaff', mcc: null, location: null },
    comment: null
  }, {
    hold: false,
    date: new Date('2026-10-12T00:11:04Z'),
    movements: [{ id: '163698631', account: { id: '100001' }, sum: null, fee: 0, invoice: { sum: -3.49, instrument: 'USD' } }],
    merchant: { fullTitle: 'APPLE.COM/BILL', mcc: null, location: null },
    comment: null
  }])
})

it('[model] keeps conversion failures visible without dumping the source record', () => {
  const failure = new Error('model conversion failure')
  const source = new Proxy(payment(163829629) as object, {
    get (target, property, receiver) {
      if (property === 'summa') throw failure
      return Reflect.get(target, property, receiver)
    }
  })
  const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    expect(() => [...convertTransactions([source], recordedCards)]).toThrow(failure)
    expect(errorLog.mock.calls).toEqual([['Failed to convert BSB transaction', { id: 163829629, paymentType: 'TRANSFER' }]])
  } finally {
    errorLog.mockRestore()
  }
})
