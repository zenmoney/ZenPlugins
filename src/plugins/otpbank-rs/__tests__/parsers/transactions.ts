import { parseTransactions } from '../../parsers'

describe('parseTransactions', () => {
  it('should parse API transactions to OtpTransaction', () => {
    const apiTransactions: string[][] = [
      ['0', '840', 'USD', '01.01.2023', 'Test Transaction', '0', '0', '0', '0', '100', '0']
    ]

    const result = parseTransactions(apiTransactions)

    expect(result).toHaveLength(1)
    expect(result[0].date).toEqual(new Date(2023, 0, 1))
    expect(result[0].title).toBe('Test Transaction')
    expect(result[0].amount).toBe(-100)
    expect(result[0].currencyCode).toBe('USD')
    expect(result[0].currencyCodeNumeric).toBe('840')
  })
})
