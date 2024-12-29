import { AccountType } from '../../../../types/zenmoney'
import { OtpTransaction } from '../../models'
import { convertTransaction } from '../../converters'

describe('convertTransaction', () => {
  it('should convert API transaction to Transaction', () => {
    const apiTransaction: OtpTransaction = {
      date: new Date('2023-01-01'),
      title: 'Test Transaction',
      amount: 100,
      currencyCode: 'USD',
      currencyCodeNumeric: '840'
    }

    const account = {
      id: '123',
      type: AccountType.ccard as AccountType.ccard,
      title: 'Test Account',
      instrument: 'USD',
      balance: 1000,
      creditLimit: 0,
      syncIds: ['123']
    }

    const result = convertTransaction(apiTransaction, account)

    expect(result.date).toEqual(new Date('2023-01-01'))
    expect(result.movements[0].sum).toBe(100)
    // expect(result.merchant?.category).toBe('Test Transaction')
  })

  it('should handle transactions without optional fields', () => {
    const apiTransaction: OtpTransaction = {
      date: new Date('2023-01-01'),
      title: 'title',
      amount: 50,
      currencyCode: 'EUR',
      currencyCodeNumeric: '978'
    }

    const account = {
      id: '456',
      type: AccountType.ccard as AccountType.ccard,
      title: 'Test Account',
      instrument: 'EUR',
      balance: 500,
      creditLimit: 0,
      syncIds: ['456']
    }

    const result = convertTransaction(apiTransaction, account)

    expect(result.date).toEqual(new Date('2023-01-01'))
    expect(result.movements[0].sum).toBe(50)
  })
})
