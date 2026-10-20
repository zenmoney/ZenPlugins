import { convertTransactions } from '../../../converters'
import { accounts, entries, accountId } from '../../../__fixtures__/conversion'
import { stringAt } from '../../../validation'

describe('ZEN.COM captured purchase', () => {
  it('AMOUNT-001, MERCHANT-001/003 and COMMENT-002 preserves purchase currency and separate merchant place fields', () => {
    const row = entries[11]
    expect(convertTransactions([row], accounts(), new Set([accountId]))).toEqual([{
      date: new Date('2026-09-27T16:16:12Z'),
      hold: false,
      movements: [{ id: `${stringAt(row, 'id')}:${accountId}`, account: { id: accountId }, sum: -11.19, invoice: { sum: -1309.65, instrument: 'RSD' }, fee: 0 }],
      merchant: { title: 'MP101 OAZA', city: 'BEOGRAD', country: 'SRB', mcc: null, location: null },
      comment: null
    }])
  })
})
