import { convertTransactions } from '../../../converters'
import { accounts, entries, usdId } from '../../../__fixtures__/conversion'

describe('ZEN.COM captured history', () => {
  it('STATUS-001 omits the two rejected instructions and preserves every accepted record', () => {
    const result = convertTransactions(entries, accounts(), new Set(accounts().map(account => account.id)))
    expect(result).toHaveLength(18)
    expect(result.filter(transaction => transaction.movements.length === 2)).toHaveLength(10)
  })

  it('ID-001 preserves complete results across repeated and overlapping pages', () => {
    const selected = new Set(accounts().map(account => account.id))
    const result = convertTransactions(entries, accounts(), selected)
    expect(convertTransactions([...entries, ...entries], accounts(), selected)).toEqual(result)
    expect(convertTransactions(entries, accounts(), selected)).toEqual(result)
    expect(convertTransactions([...entries].reverse(), accounts(), selected)).toEqual(result)
    expect(convertTransactions(entries, accounts(), new Set([usdId]))).toEqual(result.filter(transaction => transaction.movements.some(movement => 'id' in movement.account && movement.account.id === usdId)))
    expect(convertTransactions(entries, accounts(), new Set())).toEqual([])
  })
})
