import { firstYearToQuery } from '../../api'

/**
 * Pure, clock-free coverage of the year window. The interesting cases are years in
 * the future, which is exactly where clock mocking is brittle — so pass the year in.
 */
describe('firstYearToQuery', () => {
  it('floors at the card launch year, so a 1990 start date is not a decades-long crawl', () => {
    expect(firstYearToQuery(new Date('1990-01-01T00:00:00Z'), 2026)).toBe(2025)
  })

  it('YEARS LATER it still reaches the launch year — no silent history truncation', () => {
    // A "max 5 years back" cap would return 2026 here (2031 - 5) and silently drop
    // the user's 2025 transactions from their first import. Only the launch year
    // may floor the range.
    expect(firstYearToQuery(new Date('2025-06-01T00:00:00Z'), 2031)).toBe(2025)
    expect(firstYearToQuery(new Date('1990-01-01T00:00:00Z'), 2040)).toBe(2025)
  })

  it('starts one year before fromDate, so a New-Year transaction filed under the previous year is still found', () => {
    expect(firstYearToQuery(new Date('2027-01-01T00:00:00Z'), 2027)).toBe(2026)
  })

  it('never starts after the current year', () => {
    expect(firstYearToQuery(new Date('2030-06-01T00:00:00Z'), 2026)).toBe(2026)
  })
})
