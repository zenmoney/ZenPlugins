import { convertAccounts } from '../../converters'
import { JupiterBalance, JupiterCard } from '../../models'

const balance: JupiterBalance = { currency: 'USD', spendableBalance: 100.5, withdrawableBalance: 100.5 }

describe('convertAccounts', () => {
  it('maps the Jupiter card account to a single ccard USD account', () => {
    const cards: JupiterCard[] = [{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }]
    expect(convertAccounts(cards, balance)).toEqual([{
      id: 'acct_1',
      type: 'ccard',
      title: 'Jupiter •1234',
      instrument: 'USD',
      balance: 100.5,
      syncIds: ['1234'],
      savings: false
    }])
  })

  it('groups several cards sharing one card account into ONE account', () => {
    const cards: JupiterCard[] = [
      { id: 'card_1', cardAccountId: 'acct_1', last4: '1111' },
      { id: 'card_2', cardAccountId: 'acct_1', last4: '2222' }
    ]
    const accounts = convertAccounts(cards, balance)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].id).toBe('acct_1')
    expect(accounts[0].syncIds).toEqual(['1111', '2222'])
    expect(accounts[0].title).toBe('Jupiter •1111/2222')
  })

  it('emits one account per distinct card account; balance only on the primary', () => {
    const cards: JupiterCard[] = [
      { id: 'card_1', cardAccountId: 'acct_1', last4: '1111' },
      { id: 'card_2', cardAccountId: 'acct_2', last4: '2222' }
    ]
    const accounts = convertAccounts(cards, balance)
    expect(accounts).toHaveLength(2)
    expect(accounts.map((a) => a.id)).toEqual(['acct_1', 'acct_2'])
    // the balance endpoint is global, so it can't be attributed to the second one
    expect(accounts[0].balance).toBe(100.5)
    expect(accounts[1].balance).toBeNull()
    expect(accounts[1].syncIds).toEqual(['2222'])
  })

  it('NEVER invents an id from another field when cardAccountId is missing', () => {
    // the account id is ZenMoney's primary key: deriving it from card.id instead
    // would change the account's identity and duplicate it in the ledger forever
    expect(convertAccounts([{ id: 'card_1', last4: '1234' }], balance)).toEqual([])
  })

  it('keeps the account id stable even if some cards lack cardAccountId', () => {
    const accounts = convertAccounts([
      { id: 'card_1', cardAccountId: 'acct_1', last4: '1111' },
      { id: 'card_2', last4: '2222' }
    ], balance)
    expect(accounts).toHaveLength(1)
    expect(accounts[0].id).toBe('acct_1')
  })

  it('defaults the instrument to USD when the balance currency is empty', () => {
    const accounts = convertAccounts([{ id: 'card_1', cardAccountId: 'acct_1', last4: '1234' }], {
      currency: '',
      spendableBalance: 0,
      withdrawableBalance: 0
    })
    expect(accounts[0].instrument).toBe('USD')
  })
})
