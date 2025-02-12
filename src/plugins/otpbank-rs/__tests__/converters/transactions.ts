import { AccountType } from '../../../../types/zenmoney'
import { OtpTransaction } from '../../models'
import { convertTransaction } from '../../converters'
import { parseTransaction } from '../../parsers'

describe('convertTransaction', () => {
  it('should parse merchant with location', () => {
    const apiTransaction: OtpTransaction = {
      id: 'test123',
      date: new Date('2023-01-01'),
      title: '1111****1111: PLACANJE MTS RACUNA>BEOGRAD           RS',
      amount: 100,
      currencyCode: 'USD',
      currencyCodeNumeric: '840',
      status: 'OK',
      merchant: ''
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
    expect(result.merchant).toEqual({
      title: 'PLACANJE MTS RACUNA',
      city: 'BEOGRAD',
      country: 'RS',
      mcc: null,
      location: null
    })
  })

  it('should parse merchant with dash separator', () => {
    const apiTransaction: OtpTransaction = {
      id: 'test456',
      date: new Date('2023-01-01'),
      title: 'MasterCard Platinum debit - SAMA SAMA PRIME HO BADUNG',
      amount: 50,
      currencyCode: 'EUR',
      currencyCodeNumeric: '978',
      merchant: ''
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
    expect(result.merchant).toEqual({
      title: 'SAMA SAMA PRIME HO BADUNG',
      city: null,
      country: null,
      mcc: null,
      location: null
    })
  })

  it('should parse merchant with slash separator', () => {
    const apiTransaction: OtpTransaction = {
      id: 'test789',
      date: new Date('2023-01-01'),
      title: 'ASICS BEACHWALK/AX09 BALI',
      amount: 75,
      currencyCode: 'EUR',
      currencyCodeNumeric: '978',
      merchant: ''
    }

    const account = {
      id: '789',
      type: AccountType.ccard as AccountType.ccard,
      title: 'Test Account',
      instrument: 'EUR',
      balance: 500,
      creditLimit: 0,
      syncIds: ['789']
    }

    const result = convertTransaction(apiTransaction, account)

    expect(result.date).toEqual(new Date('2023-01-01'))
    expect(result.movements[0].sum).toBe(75)
    expect(result.merchant).toEqual({
      title: 'ASICS BEACHWALK',
      city: 'AX09 BALI',
      country: null,
      mcc: null,
      location: null
    })
  })
})

describe('transaction updates', () => {
  it('should generate same ID for same transaction with different status', () => {
    const apiTransaction1 = [
      '', '941', 'RSD',
      '03.02.2025 00:00:00',
      '1111****1111: PLACANJE MTS RACUNA>BEOGRAD           RS',
      '', 'ALEKSANDR BELIAKOV', '',
      '87315630766501', // transaction number
      '4587.63', // amount debit
      '', // amount credit
      '', '', '', '', '',
      '325930070737698417'
    ]

    const apiTransaction2 = [...apiTransaction1]
    apiTransaction2[4] = '1111****1111: PLACANJE MTS RACUNA>BEOGRAD           RS (Processed)'

    const transaction1 = parseTransaction(apiTransaction1)
    const transaction2 = parseTransaction(apiTransaction2)

    expect(transaction1.id).toBe(transaction2.id)
    expect(transaction1.amount).toBe(transaction2.amount)
    expect(transaction1.title).not.toBe(transaction2.title)
  })
})
