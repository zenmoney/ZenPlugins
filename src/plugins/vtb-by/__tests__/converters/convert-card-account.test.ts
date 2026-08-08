import { AccountType } from '../../../../types/zenmoney'
import { convertCardAccount } from '../../converters'
import type { FetchCardAccount } from '../../types/fetch'

describe('convertCardAccount', () => {
  it('converts a VTB card account', () => {
    const account: FetchCardAccount = {
      internalAccountId: 'internal-card-account-1',
      currency: '933',
      openDate: 1627506000000,
      accountNumber: 'TEST-CARD-ACCOUNT-0001',
      cardAccountNumber: 'card-account-0001',
      productCode: 'CARD-TEST',
      productName: 'Тестовая карта BYN',
      contractId: 'contract-card-1',
      interestRate: 0.01,
      accountStatus: 'INACTIVE',
      ibanNum: 'TEST-IBAN-CARD-0001',
      cards: [
        {
          cardNumberMasked: '555544******1111',
          cardHash: 'card-hash',
          cardStatus: 'CLOSED',
          cardStatusCode: 9,
          owner: 'TEST USER',
          tariffName: 'Test BYN',
          balance: 0,
          payment: '0',
          accountId: 'card-account-0001',
          stateSignature: 'CLOSED',
          cardProductId: 162,
          cardId: 857411864,
          salary: false,
          virtual: false
        }
      ]
    }

    expect(convertCardAccount(account)).toEqual({
      id: 'contract-card-1',
      title: 'Тестовая карта BYN *1111',
      balance: 0,
      instrument: 'BYN',
      syncIds: ['TEST-IBAN-CARD-0001', 'TEST-CARD-ACCOUNT-0001', 'contract-card-1', '1111'],
      type: AccountType.ccard,
      archived: true,
      _meta: {
        productKind: 'card',
        statementInternalAccountId: 'internal-card-account-1',
        statementCardHash: 'card-hash'
      }
    })
  })
})
