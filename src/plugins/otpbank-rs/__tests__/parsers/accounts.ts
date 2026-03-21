import { parseAccounts, parseCards } from '../../parsers'

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

describe('parseCards', () => {
  it('should parse only virtual cards from GetAllCard', () => {
    const apiCards: string[][] = [
      ['', 'Visa Virtual debit', 'AKTIVNA', 'OSNOVNA', '', '1', '1111', '30.06.2032 00:00:00', '9', '1', 'Račun prepaid kartice', '', '', '', '', '', '1', '0', '1', '1', '1111********1111', '', '', '', '', '134.78', '978', 'EUR', '1234', 'ALEKS ALEKS', '683', '', '1111********1111'],
      ['', 'Mastercard Platinum debit', 'AKTIVNA', 'OSNOVNA', '', '1', '2222', '31.12.2029 00:00:00', '7', '1', 'Račun debitne kartice', '', '', '', '', '', '0', '0', '1', '1', '2222********2222', '', '', '', '', '1421.10', '978', 'EUR', '4321', 'ALEKS ALEKS', '668', '', '2222********2222']
    ]

    const result = parseCards(apiCards)

    expect(result).toHaveLength(1)
    expect(result[0].primaryCardId).toBe('1111')
    expect(result[0].productCodeCore).toBe('9')
    expect(result[0].currencyCode).toBe('EUR')
    expect(result[0].currencyCodeNumeric).toBe('978')
    expect(result[0].maskedPan).toBe('1111********1111')
  })
})
