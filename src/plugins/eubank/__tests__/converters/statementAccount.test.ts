import { convertPdfStatementAccount } from '../../converters/accounts'

describe('convertPdfStatementAccount', () => {
  it('should convert KZT account', () => {
    const result = convertPdfStatementAccount(
      {
        id: 'KZ123456789B01234567',
        balance: 5230.50,
        instrument: 'KZT',
        cardNumber: '401234******9876'
      },
      '2026-04-14T00:00:00.000'
    )
    expect(result.account).toEqual({
      id: '1234567-KZT',
      balance: 5230.50,
      instrument: 'KZT',
      syncIds: ['KZ123456789B01234567', '401234******9876'],
      title: '*9876 KZT',
      type: 'ccard'
    })
    expect(result.date).toEqual(new Date('2026-04-14T00:00:00.000'))
  })

  it('should convert USD account', () => {
    const result = convertPdfStatementAccount(
      {
        id: 'KZ123456789B01234567',
        balance: 1.25,
        instrument: 'USD',
        cardNumber: '401234******9876'
      },
      '2026-04-14T00:00:00.000'
    )
    expect(result.account).toEqual({
      id: '1234567-USD',
      balance: 1.25,
      instrument: 'USD',
      syncIds: ['KZ123456789B01234567', '401234******9876'],
      title: '*9876 USD',
      type: 'ccard'
    })
  })

  it('should work without card number', () => {
    const result = convertPdfStatementAccount(
      {
        id: 'KZ123456789B01234567',
        balance: 100,
        instrument: 'EUR',
        cardNumber: null
      },
      '2026-04-14T00:00:00.000'
    )
    expect(result.account.title).toBe('*4567 EUR')
    expect(result.account.syncIds).toEqual(['KZ123456789B01234567'])
  })
})
