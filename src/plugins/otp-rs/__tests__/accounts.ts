import { parseAccounts } from '../parsers'

describe('parseAccounts', () => {
  it('should parse API accounts with RSD and EUR currencies', () => {
    const apiAccounts: string[][] = [
      [
        '',
        '1234567890',
        'Tekući računi fizičkih lica u RSD',
        'RSD',
        '555555.75',
        '545555.75',
        '',
        '',
        '',
        '1',
        '8265211',
        '',
        'NAME SURNAME',
        '1',
        '941',
        '',
        'N',
        'True',
        '1234567890',
        '3610.00',
        '',
        '1',
        '0'
      ],
      [
        '',
        '0987654321',
        'Tekući računi fizičkih lica u EUR',
        'EUR',
        '100.00',
        '100.00',
        '',
        '',
        '',
        '1',
        '8265222',
        '',
        'NAME SURNAME',
        '4',
        '978',
        '',
        'N',
        'True',
        '0987654321',
        '0.00',
        '',
        '1',
        '0'
      ]
    ]

    const result = parseAccounts(apiAccounts)

    expect(result).toHaveLength(2)

    // Check RSD account
    expect(result[0].accountNumber).toBe('1234567890')
    expect(result[0].description).toBe('Tekući računi fizičkih lica u RSD')
    expect(result[0].currencyCode).toBe('RSD')
    expect(result[0].balance).toBe(545555.75)
    expect(result[0].currencyCodeNumeric).toBe('941')

    // Check EUR account
    expect(result[1].accountNumber).toBe('0987654321')
    expect(result[1].description).toBe('Tekući računi fizičkih lica u EUR')
    expect(result[1].currencyCode).toBe('EUR')
    expect(result[1].balance).toBe(100)
    expect(result[1].currencyCodeNumeric).toBe('978')
  })
})
