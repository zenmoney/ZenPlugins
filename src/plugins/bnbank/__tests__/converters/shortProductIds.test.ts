export {}

// Complete Iskra graph from mail_inbound 164442, build 158, products response 6.
// IDs, masked PANs and balances are anonymized consistently, preserving ID lengths,
// equal balances, decimal structure, currencies, field presence and all products.
const fixtures: Array<{ records: Array<{ cards: unknown[], accounts: unknown[] }> }> = jest.requireActual('./iskra-products-164442.json')
interface LegacyAccount {
  id: string
  type: string
  title: string
  currencyCode: string
  instrument: string
  balance: number
  syncID: string[]
}
const { convertCard, convertCheckingAccount }: {
  convertCard: (data: unknown) => LegacyAccount
  convertCheckingAccount: (data: unknown) => LegacyAccount
} = jest.requireActual('../../converters')
const { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId }: {
  ensureSyncIDsAreUniqueButSanitized: (options: { accounts: LegacyAccount[], sanitizeSyncId: (id: string) => string }) => LegacyAccount[]
  sanitizeSyncId: (id: string) => string
} = jest.requireActual('../../../../common/accounts')

it('keeps every product and supplies valid sync IDs when Iskra uses three-digit product IDs', () => {
  const graph = fixtures[0].records[0]
  const accounts = [...graph.cards.map(convertCard), ...graph.accounts.map(convertCheckingAccount)]
  const expected: LegacyAccount[] = [
    { id: '612', type: 'card', title: 'Пластиковая Mastercard, BYN', currencyCode: 'BYN', instrument: 'BYN', balance: 24.55, syncID: ['0621'] },
    { id: '2103', type: 'card', title: 'Пластиковая Mastercard, BYN', currencyCode: 'BYN', instrument: 'BYN', balance: 1234.56, syncID: ['2103', '8241'] },
    { id: '2137', type: 'card', title: 'Оранжевая Цифровая', currencyCode: 'BYN', instrument: 'BYN', balance: 0.67, syncID: ['2137', '8742'] },
    { id: '2217', type: 'card', title: 'Цифровая Mastercard, BYN', currencyCode: 'BYN', instrument: 'BYN', balance: 24.55, syncID: ['2217', '3143'] },
    { id: '5051', type: 'card', title: 'Цифровая Белкарт, BYN', currencyCode: 'BYN', instrument: 'BYN', balance: 0.02, syncID: ['5051', '5244'] },
    { id: '2104', type: 'card', title: 'Оранжевая Цифровая', currencyCode: 'USD', instrument: 'USD', balance: 2.80, syncID: ['2104', '7045'] },
    { id: '714', type: 'checking', title: 'Текущий счет', currencyCode: 'BYN', instrument: 'BYN', balance: 0.02, syncID: ['bnb:714'] },
    { id: '715', type: 'checking', title: 'Текущий счет', currencyCode: 'USD', instrument: 'USD', balance: 2500, syncID: ['bnb:715'] },
    { id: '719', type: 'checking', title: 'Текущий счет', currencyCode: 'EUR', instrument: 'EUR', balance: 60.42, syncID: ['bnb:719'] },
    { id: '717', type: 'checking', title: 'Текущий счет', currencyCode: 'RUB', instrument: 'RUB', balance: 75.26, syncID: ['bnb:717'] }
  ]
  expect(accounts).toEqual(expected)
  expect(ensureSyncIDsAreUniqueButSanitized({ accounts, sanitizeSyncId })).toEqual(expected.map(account => ({
    ...account,
    syncID: account.syncID.map(id => id.slice(-4))
  })))
})
