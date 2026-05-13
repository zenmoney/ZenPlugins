import { shouldSyncCardAccount } from '../../converters'
import type { FetchCardAccount } from '../../types/fetch'

const makeAccount = (overrides: Partial<FetchCardAccount> = {}): FetchCardAccount => ({
  internalAccountId: 'internal-card-account-1',
  currency: '933',
  openDate: 1627506000000,
  accountNumber: 'TEST-CARD-ACCOUNT-0001',
  cardAccountNumber: 'card-account-0001',
  productCode: 'CARD-TEST',
  productName: 'Тестовая карта BYN',
  contractId: 'contract-card-1',
  interestRate: 0.01,
  accountStatus: 'OPEN',
  ibanNum: 'TEST-IBAN-CARD-0001',
  cards: [
    {
      cardNumberMasked: '555544******1111',
      cardHash: 'card-hash',
      cardStatus: 'OPEN',
      cardStatusCode: 1,
      owner: 'TEST USER',
      tariffName: 'Test BYN',
      balance: 0,
      payment: '0',
      accountId: 'card-account-0001',
      stateSignature: 'OPEN',
      cardProductId: 162,
      cardId: 857411864,
      salary: false,
      virtual: false
    }
  ],
  ...overrides
})

describe('shouldSyncCardAccount', () => {
  it('returns false for closed card accounts', () => {
    expect(shouldSyncCardAccount(makeAccount({
      accountStatus: 'INACTIVE',
      cards: [
        {
          ...makeAccount().cards[0],
          cardStatus: 'CLOSED',
          cardStatusCode: 9,
          stateSignature: 'CLOSED'
        }
      ]
    }))).toBe(false)
  })

  it('returns true for open card accounts with active cards', () => {
    expect(shouldSyncCardAccount(makeAccount())).toBe(true)
  })
})
