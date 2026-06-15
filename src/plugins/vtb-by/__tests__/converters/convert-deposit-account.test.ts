import { AccountType } from '../../../../types/zenmoney'
import { convertDepositAccount } from '../../converters'
import type { FetchDepositAccount } from '../../types/fetch'

describe('convertDepositAccount', () => {
  it('converts a VTB deposit account', () => {
    const account: FetchDepositAccount = {
      internalAccountId: 'internal-deposit-account-1',
      currency: '643',
      openDate: 1736283600000,
      endDate: 1857243600000,
      accountNumber: 'TEST-DEPOSIT-ACCOUNT-0001',
      productCode: 'DEPOSIT-TEST',
      productName: '"Тестовый вклад", RUB с капитализацией',
      balanceAmount: 1225.71,
      contractId: 'contract-deposit-1',
      interestRate: 15.9,
      accountStatus: 'OPEN',
      ibanNum: 'TEST-IBAN-DEPOSIT-0001',
      personalizedName: 'Тестовый вклад'
    }

    const converted = convertDepositAccount(account)

    expect(converted.id).toBe('contract-deposit-1')
    expect(converted.type).toBe(AccountType.deposit)

    if (converted.type !== AccountType.deposit) {
      throw new Error('Expected deposit account')
    }

    expect(converted.title).toBe('Тестовый вклад')
    expect(converted.instrument).toBe('RUB')
    expect(converted.syncIds).toEqual(['TEST-IBAN-DEPOSIT-0001', 'TEST-DEPOSIT-ACCOUNT-0001', 'contract-deposit-1'])
    expect(converted.balance).toBe(1225.71)
    expect(converted.percent).toBe(15.9)
    expect(converted.capitalization).toBe(true)
    expect(converted.payoffInterval).toBe('month')
    expect(converted.payoffStep).toBe(1)
    expect(converted.archived).toBe(false)
    expect(converted._meta).toEqual({
      productKind: 'deposit',
      statementInternalAccountId: 'internal-deposit-account-1',
      statementCardHash: null
    })
  })
})
