import { AltynAccount } from '../../../models'
import { convertAccounts } from '../../../converters'

describe('convertAccounts', () => {
  it('should convert ruble account', () => {
    const accounts: AltynAccount[] = [
      {
        account_number: 'A-100000000001',
        bank_name: null,
        bic: null,
        bank_inn: null,
        bank_kpp: null,
        cor_account: null,
        currency: 'RUB',
        balance: '12345.67'
      }
    ]
    expect(convertAccounts(accounts)).toEqual([
      {
        account: {
          id: 'A-100000000001',
          type: 'checking',
          title: 'Altyn A-100000000001',
          instrument: 'RUB',
          balance: 12345.67,
          syncIds: ['A-100000000001']
        },
        accountNumber: 'A-100000000001'
      }
    ])
  })

  it('should convert account with integer balance', () => {
    const accounts: AltynAccount[] = [
      {
        account_number: 'A-200000000002',
        bank_name: null,
        bic: null,
        bank_inn: null,
        bank_kpp: null,
        cor_account: null,
        currency: 'USD',
        balance: '0'
      }
    ]
    expect(convertAccounts(accounts)).toEqual([
      {
        account: {
          id: 'A-200000000002',
          type: 'checking',
          title: 'Altyn A-200000000002',
          instrument: 'USD',
          balance: 0,
          syncIds: ['A-200000000002']
        },
        accountNumber: 'A-200000000002'
      }
    ])
  })

  it('should convert multiple accounts', () => {
    const accounts: AltynAccount[] = [
      {
        account_number: 'A-300000000003',
        bank_name: null,
        bic: null,
        bank_inn: null,
        bank_kpp: null,
        cor_account: null,
        currency: 'RUB',
        balance: '100.50'
      },
      {
        account_number: 'A-400000000004',
        bank_name: null,
        bic: null,
        bank_inn: null,
        bank_kpp: null,
        cor_account: null,
        currency: 'EUR',
        balance: '200'
      }
    ]
    const result = convertAccounts(accounts)
    expect(result).toHaveLength(2)
    expect(result[0].account.instrument).toBe('RUB')
    expect(result[1].account.instrument).toBe('EUR')
    expect(result[0].account.balance).toBe(100.50)
    expect(result[1].account.balance).toBe(200)
  })
})
