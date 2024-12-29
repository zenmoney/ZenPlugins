import { convertAccounts } from '../../converters'
import { OtpAccount } from '../../models'
import { AccountType } from '../../../../types/zenmoney'

describe('convertAccounts', () => {
  it('should convert API accounts to ConvertResult', () => {
    const apiAccounts: OtpAccount[] = [
      {
        accountNumber: '123',
        description: 'Test Account',
        currencyCode: 'USD',
        balance: 1000,
        currencyCodeNumeric: '840'
      }
    ]

    const result = convertAccounts(apiAccounts)

    expect(result).toHaveLength(1)
    expect(result[0].account.id).toBe('123')
    expect(result[0].account.type).toBe(AccountType.ccard)
    expect(result[0].account.title).toBe('Test Account')
    expect(result[0].account.instrument).toBe('USD')
    expect(result[0].account.balance).toBe(1000)
    // expect(result[0].account.creditLimit).toBe(1000)
    // expect(result[0].account.syncIds).toContain('1234')
  })

  it('should handle accounts without optional fields', () => {
    const apiAccounts: OtpAccount[] = [
      {
        accountNumber: '456',
        description: 'description',
        currencyCode: 'EUR',
        balance: 500,
        currencyCodeNumeric: '978'
      }
    ]

    const result = convertAccounts(apiAccounts)

    expect(result).toHaveLength(1)
    expect(result[0].account.id).toBe('456')
    expect(result[0].account.type).toBe(AccountType.ccard)
    expect(result[0].account.title).toBe('description')
    expect(result[0].account.instrument).toBe('EUR')
    expect(result[0].account.balance).toBe(500)
    expect(result[0].account.creditLimit).toBe(0)
    expect(result[0].account.syncIds).toContain('456')
  })
})
