import { parseAccounts } from '../../parsers'

describe('parseAccounts', () => {
  it('should parse API accounts to OtpAccount', () => {
    const apiAccounts: string[][] = [
      ['0', '123', 'Test Account', 'USD', '0', '1000', '0', '0', '0', '0', '0', '0', '0', '0', '840']
    ]

    const result = parseAccounts(apiAccounts)

    expect(result).toHaveLength(1)
    expect(result[0].accountNumber).toBe('123')
    expect(result[0].description).toBe('Test Account')
    expect(result[0].currencyCode).toBe('USD')
    expect(result[0].balance).toBe(1000)
    expect(result[0].currencyCodeNumeric).toBe('840')
  })
})
