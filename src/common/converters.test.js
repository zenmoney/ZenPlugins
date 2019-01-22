import { formatComment, formatRate } from './converters'

describe('formatRate', () => {
  it('should never output rate below 1', () => {
    expect(formatRate({ invoiceSum: 50, sum: 50 })).toEqual('1.0000')
    expect(formatRate({ invoiceSum: 50, sum: 49 })).toEqual('1.0204')
    expect(formatRate({ invoiceSum: 49, sum: 50 })).toEqual('1/1.0204')
  })
})

describe('formatComment', () => {
  it(`should output nothing when there's no invoice`, () => {
    expect(formatComment({ sum: 120, fee: 0, accountInstrument: 'USD', invoice: null }))
      .toEqual(null)
  })
  it('should include invoice sum+instrument when there is one', () => {
    expect(formatComment({ sum: 120, fee: 0, accountInstrument: 'USD', invoice: { sum: 100, instrument: 'EUR' } }))
      .toEqual('100.00 EUR\n(rate=1/1.2000)')
  })
  it('should include fee/cashback when there is one', () => {
    expect(formatComment({ sum: 120, fee: -3, accountInstrument: 'USD', invoice: null }))
      .toEqual('3.00 USD fee')
    expect(formatComment({ sum: 120, fee: 3, accountInstrument: 'USD', invoice: null }))
      .toEqual('3.00 USD cashback')
    expect(formatComment({ sum: 120, fee: -3, accountInstrument: 'USD', invoice: { sum: 100, instrument: 'EUR' } }))
      .toEqual('3.00 USD fee\n100.00 EUR\n(rate=1/1.2000)')
    expect(formatComment({ sum: 120, fee: 3, accountInstrument: 'USD', invoice: { sum: 100, instrument: 'EUR' } }))
      .toEqual('3.00 USD cashback\n100.00 EUR\n(rate=1/1.2000)')
  })
})

// TODO add toZenmoneyTransaction tests after shape discussion
