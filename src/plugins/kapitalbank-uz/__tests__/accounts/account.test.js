import {
  convertAccount
} from '../../converters'

describe('convertAccount', () => {
  it('converts USD account', () => {
    expect(convertAccount({
      guid: 'AC-abcd1234-0000-0000-0000-000000000001',
      accountNumber: 'UZ12345678901234567890',
      currency: { name: 'USD', scale: 2 },
      balance: 150075
    })).toEqual({
      id: 'AC-abcd1234-0000-0000-0000-000000000001',
      title: 'Счёт USD *0001',
      syncIds: ['UZ12345678901234567890'],
      instrument: 'USD',
      type: 'checking',
      balance: 1500.75
    })
  })

  it('converts UZS account', () => {
    expect(convertAccount({
      guid: 'AC-abcd1234-0000-0000-0000-000000000002',
      accountNumber: 'UZ98765432109876543210',
      currency: { name: 'UZS', scale: 2 },
      balance: 5000000000
    })).toEqual({
      id: 'AC-abcd1234-0000-0000-0000-000000000002',
      title: 'Счёт UZS *0002',
      syncIds: ['UZ98765432109876543210'],
      instrument: 'UZS',
      type: 'checking',
      balance: 50000000
    })
  })
})
