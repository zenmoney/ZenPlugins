import { convertAccounts, convertCards } from '../../converters'
import { OtpAccount, OtpCard } from '../../models'
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

describe('convertCards', () => {
  it('should create separate account per card and currency', () => {
    const cards: OtpCard[] = [
      {
        primaryCardId: '1111',
        productCodeCore: '9',
        cardTitle: 'Visa Virtual debit',
        maskedPan: '1111********1111',
        currencyCode: 'RSD',
        currencyCodeNumeric: '941',
        balance: 0,
        accountNumber: '12345678',
        isVirtual: true
      },
      {
        primaryCardId: '2222',
        productCodeCore: '9',
        cardTitle: 'Visa Virtual debit',
        maskedPan: '2222********2222',
        currencyCode: 'EUR',
        currencyCodeNumeric: '978',
        balance: 134.78,
        accountNumber: '87654321',
        isVirtual: true
      }
    ]

    const result = convertCards(cards)

    expect(result).toHaveLength(2)
    expect(result[0].account.id).toBe('virtual_1111_RSD')
    expect(result[1].account.id).toBe('virtual_2222_EUR')
    expect(result[0].account.type).toBe(AccountType.ccard)
    expect(result[1].account.syncIds).toContain('2222********2222')
    expect(result[0].products[0].source).toBe('cardTurnover')
    expect(result[0].products[0].accountType).toBe('DIN')
    expect(result[1].products[0].accountType).toBe('DEV')
  })
})
