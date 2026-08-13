import { AccountType } from '../../../../types/zenmoney'
import { buildCardNumberMap, convertAccounts } from '../../converters'

describe('convertAccounts', () => {
  it('converts CARD and CURRENT accounts and merges related card numbers', () => {
    const apiAccounts: unknown[] = [
      {
        id: 1000001,
        name: 'Счет в Цифра банк',
        type: 'BANK',
        number: '40817840000000000001',
        currency: 'USD',
        amount: 0,
        subtype: 'CARD',
        state: 'ACTIVE',
        cardIDs: '900001'
      },
      {
        id: 1000002,
        name: 'Счет в Цифра банк',
        type: 'BANK',
        number: '40817810000000000002',
        currency: 'RUB',
        amount: 0,
        subtype: 'CARD',
        state: 'ACTIVE',
        cardIDs: '900001'
      },
      {
        id: 2000003,
        name: 'Текущий счет',
        type: 'BANK',
        number: '40817840000000000003',
        currency: 'USD',
        amount: 0,
        subtype: 'CURRENT',
        state: 'ACTIVE',
        cardIDs: null
      }
    ]
    const apiCards: unknown[] = [
      { id: 900001, number: '220300******0001' }
    ]

    const result = convertAccounts(apiAccounts, buildCardNumberMap(apiCards))

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      account: {
        id: '1000001',
        type: AccountType.ccard,
        title: 'Счет в Цифра банк (USD)',
        instrument: 'USD',
        syncIds: ['40817840000000000001', '220300******0001'],
        balance: 0
      },
      products: [{ id: 1000001, subtype: 'CARD' }]
    })
    expect(result[1].account.type).toBe(AccountType.ccard)
    expect(result[1].account.syncIds).toEqual(['40817810000000000002', '220300******0001'])
    expect(result[2]).toEqual({
      account: {
        id: '2000003',
        type: AccountType.checking,
        title: 'Текущий счет',
        instrument: 'USD',
        syncIds: ['40817840000000000003'],
        balance: 0
      },
      products: [{ id: 2000003, subtype: 'CURRENT' }]
    })
  })

  it('skips non-ACTIVE accounts', () => {
    const result = convertAccounts([
      { id: 1, name: 'Closed', type: 'BANK', number: '11111', currency: 'RUB', amount: 0, subtype: 'CURRENT', state: 'CLOSED', cardIDs: null }
    ], new Map())
    expect(result).toEqual([])
  })
})
