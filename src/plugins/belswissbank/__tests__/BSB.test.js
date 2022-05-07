import { formatBsbSmsApiDate, formatBsbArchiveApiDate, isRejectedTransaction } from '../BSB'

describe('formatBsbCardsApiDate', () => {
  it('should return DD.MM.YYYY string considering bank UTC+3 timezone shift', () => {
    expect(formatBsbSmsApiDate(new Date(Date.UTC(2017, 0, 2, 0, 0, 0)))).toBe('02.01.2017')
    expect(formatBsbSmsApiDate(new Date(Date.UTC(2017, 0, 2, 3, 0, 0)))).toBe('02.01.2017')
    expect(formatBsbSmsApiDate(new Date(Date.UTC(2017, 10, 12, 20, 59, 59)))).toBe('12.11.2017')
    expect(formatBsbSmsApiDate(new Date(Date.UTC(2017, 10, 12, 21, 0, 0)))).toBe('13.11.2017')
  })

  it('should throw on non-date', () => {
    for (const nonDate of [undefined, null, '', 1234567890]) {
      expect(() => formatBsbSmsApiDate(nonDate)).toThrow()
    }
  })
})

describe('formatBsbPaymentsApiDate', () => {
  it('should return YYYYMMDD string considering bank UTC+3 timezone shift', () => {
    expect(formatBsbArchiveApiDate(new Date(Date.UTC(2017, 0, 2, 0, 0, 0)))).toBe('20170102')
    expect(formatBsbArchiveApiDate(new Date(Date.UTC(2017, 0, 2, 3, 0, 0)))).toBe('20170102')
    expect(formatBsbArchiveApiDate(new Date(Date.UTC(2017, 10, 12, 20, 59, 59)))).toBe('20171112')
    expect(formatBsbArchiveApiDate(new Date(Date.UTC(2017, 10, 12, 21, 0, 0)))).toBe('20171113')
  })

  it('should throw on non-date', () => {
    for (const nonDate of [undefined, null, '', 1234567890]) {
      expect(() => formatBsbSmsApiDate(nonDate)).toThrow()
    }
  })
})

describe('isRejectedTransaction', () => {
  it('should trim corrupted transactionType', () => {
    expect(isRejectedTransaction({ transactionType: 'Отказ ' })).toBe(true)
  })
})
