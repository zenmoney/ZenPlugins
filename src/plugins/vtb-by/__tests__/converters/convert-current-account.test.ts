import { AccountType } from '../../../../types/zenmoney'
import { convertCurrentAccount } from '../../converters'
import type { FetchCurrentAccount } from '../../types/fetch'

describe('convertCurrentAccount', () => {
  it('converts a VTB current account', () => {
    const account: FetchCurrentAccount = {
      internalAccountId: 'internal-current-account-1',
      currency: '643',
      openDate: 1736283600000,
      accountNumber: 'TEST-CURRENT-ACCOUNT-0001',
      productCode: 'CURRENT-TEST',
      productName: 'Тестовый текущий счет',
      balanceAmount: 0,
      contractId: 'contract-current-1',
      interestRate: 0.01,
      accountStatus: 'OPEN',
      ibanNum: 'TEST-IBAN-CURRENT-0001'
    }

    expect(convertCurrentAccount(account)).toEqual({
      id: 'contract-current-1',
      title: 'Тестовый текущий счет',
      balance: 0,
      instrument: 'RUB',
      syncIds: ['TEST-IBAN-CURRENT-0001', 'TEST-CURRENT-ACCOUNT-0001', 'contract-current-1'],
      type: AccountType.checking,
      archived: false,
      _meta: {
        productKind: 'current',
        statementInternalAccountId: null,
        statementCardHash: null
      }
    })
  })
})
