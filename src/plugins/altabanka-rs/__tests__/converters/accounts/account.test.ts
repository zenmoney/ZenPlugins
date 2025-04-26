import { AccountInfo } from '../../../types'
import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('should convert accounts-1', () => {
    const accounts: AccountInfo[] = [
      {
        id: 'GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8',
        balance: 6471.0,
        name: 'ACCOUNT NAME',
        currency: 'TRY',
        cardNumber: '0011',
        accountNumber: '0022'
      }
    ]
    // toMatchInlineSnapshot
    expect(convertAccounts(accounts)).toEqual(
      [
        {
          available: 6471,
          balance: 6471,
          creditLimit: 0,
          id: 'GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8',
          instrument: 'TRY',
          syncIds: ['GTqs0fbZAP4rVJNP3KU2GaTRZEG9aJ5qodGQBp6Rek8'],
          title: 'ACCOUNT NAME',
          type: 'ccard'
        }
      ]
    )
  })

  it('should convert accounts-2', () => {
    const accounts: AccountInfo[] = [
      {
        accountNumber: '0001000512876',
        balance: 249233.58,
        cardNumber: '0xC4952DBB2BB24ECAFF9655505605F0F0',
        currency: 'RSD',
        id: '0001000512876-0xC4952DBB2BB24ECAFF9655505605F0F0',
        name: '4242XXXXXXXX4061'
      },
      {
        accountNumber: '0001000512876',
        balance: 249233.58,
        cardNumber: '0x3A7A78AB70965C9C2323270A293FA54F',
        currency: 'RSD',
        id: '0001000512876-0x3A7A78AB70965C9C2323270A293FA54F',
        name: '9891XXXXXXXX6625'
      },
      {
        accountNumber: '0001000512876',
        balance: 249233.58,
        cardNumber: '',
        currency: 'RSD',
        id: '0001000512876',
        name: 'Tekući račun'
      },
      {
        accountNumber: '0001000512877',
        balance: 2979.07,
        cardNumber: '',
        currency: 'EUR',
        id: '0001000512877',
        name: 'Štedni račun'
      }
    ]
    expect(convertAccounts(accounts.filter(a => a.cardNumber === ''))).toEqual(
      [
        {
          available: 249233.58,
          balance: 249233.58,
          creditLimit: 0,
          id: '0001000512876',
          instrument: 'RSD',
          syncIds: ['0001000512876'],
          title: 'Tekući račun',
          type: 'ccard'
        },
        {
          available: 2979.07,
          balance: 2979.07,
          creditLimit: 0,
          id: '0001000512877',
          instrument: 'EUR',
          syncIds: ['0001000512877'],
          title: 'Štedni račun',
          type: 'ccard'
        }
      ]
    )
  })

  it('should convert accounts-3', () => {
    const accounts: AccountInfo[] = [
      {
        accountNumber: '0001000210460',
        balance: 450968.42,
        cardNumber: '0xC4952DBB2BB21FC5D03DD70479E08E9D',
        currency: 'RSD',
        id: '0001000210460-0xC4952DBB2BB21FC5D03DD70479E08E9D',
        name: '4242XXXXXXXX6963'
      },
      {
        accountNumber: '0001000210460',
        balance: 450968.42,
        cardNumber: '0x3A7A78AB7096C7A1A4D47503D17609AF',
        currency: 'RSD',
        id: '0001000210460-0x3A7A78AB7096C7A1A4D47503D17609AF',
        name: '9891XXXXXXXX3864'
      },
      {
        accountNumber: '0001000210460',
        balance: 450968.42,
        cardNumber: '',
        currency: 'RSD',
        id: '0001000210460',
        name: 'Tekući račun'
      },
      {
        accountNumber: '0031000248471',
        balance: 0,
        cardNumber: '',
        currency: 'RUB',
        id: '0031000248471',
        name: 'Štedni račun'
      }
    ]
    expect(convertAccounts(accounts.filter(a => a.cardNumber === ''))).toEqual(
      [
        {
          available: 450968.42,
          balance: 450968.42,
          creditLimit: 0,
          id: '0001000210460',
          instrument: 'RSD',
          syncIds: ['0001000210460'],
          title: 'Tekući račun',
          type: 'ccard'
        },
        {
          available: 0,
          balance: 0,
          creditLimit: 0,
          id: '0031000248471',
          instrument: 'RUB',
          syncIds: ['0031000248471'],
          title: 'Štedni račun',
          type: 'ccard'
        }
      ]
    )
  })

  it('should convert accounts-4', () => {
    const accounts: AccountInfo[] = [
      {
        accountNumber: '0001000328053',
        balance: 1780241.23,
        cardNumber: '0x8B6259B7CF1CDD4FDF47D31FD86B3C88',
        currency: 'RSD',
        id: '0001000328053-0x8B6259B7CF1CDD4FDF47D31FD86B3C88',
        name: '4029XXXXXXXX4561'
      },
      {
        accountNumber: '0001000328053',
        balance: 1780241.23,
        cardNumber: '0x3A7A78AB70968A5B862BE543D64756ED',
        currency: 'RSD',
        id: '0001000328053-0x3A7A78AB70968A5B862BE543D64756ED',
        name: '9891XXXXXXXX4652'
      },
      {
        accountNumber: '0001000328053',
        balance: 1780241.23,
        cardNumber: '',
        currency: 'RSD',
        id: '0001000328053',
        name: 'Tekući račun'
      },
      {
        accountNumber: '0031000384634',
        balance: 892.43,
        cardNumber: '',
        currency: 'EUR',
        id: '0031000384634',
        name: 'Štedni račun'
      }
    ]
    expect(convertAccounts(accounts.filter(a => a.cardNumber === ''))).toEqual(
      [
        {
          available: 1780241.23,
          balance: 1780241.23,
          creditLimit: 0,
          id: '0001000328053',
          instrument: 'RSD',
          syncIds: ['0001000328053'],
          title: 'Tekući račun',
          type: 'ccard'
        },
        {
          available: 892.43,
          balance: 892.43,
          creditLimit: 0,
          id: '0031000384634',
          instrument: 'EUR',
          syncIds: ['0031000384634'],
          title: 'Štedni račun',
          type: 'ccard'
        }
      ]
    )
  })
})
