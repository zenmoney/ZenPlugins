import { formatCommentFeeLine, toZenMoneyTransaction } from './converters'

describe('formatCommentFeeLine', () => {
  it('should output nothing when there\'s no fee', () => {
    expect(formatCommentFeeLine(0, 'USD'))
      .toEqual(null)
  })
  it('should include fee/cashback when there is one', () => {
    expect(formatCommentFeeLine(-3, 'USD'))
      .toEqual('3.00 USD fee')
    expect(formatCommentFeeLine(3, 'USD'))
      .toEqual('3.00 USD cashback')
  })
})

it('[model] preserves the incoming invoice when only the debit has a known account amount', () => {
  // The receiving account has no reported credit amount in its own currency.
  const date = new Date('2026-10-22T06:37:17Z')
  const accounts = { source: { instrument: 'EUR' }, card: { instrument: 'RUB' } }
  expect(toZenMoneyTransaction({
    date,
    hold: false,
    comment: null,
    merchant: null,
    movements: [
      { account: { id: 'source' }, id: 'debit', sum: -0.05, invoice: null, fee: 0 },
      { account: { id: 'card' }, id: 'credit', sum: null, invoice: { sum: 0.05, instrument: 'EUR' }, fee: 0 }
    ]
  }, accounts)).toEqual({
    date,
    hold: false,
    comment: null,
    outcome: 0.05,
    outcomeAccount: 'source',
    outcomeBankID: 'debit',
    income: null,
    incomeAccount: 'card',
    incomeBankID: 'credit',
    opIncome: 0.05,
    opIncomeInstrument: 'EUR'
  })
})
