import { convertTransactions } from '../../../converters'
import { accounts, entries, accountId, usdId } from '../../../__fixtures__/conversion'
import { stringAt } from '../../../validation'

describe('ZEN.COM captured innerTransfer', () => {
  it('TRANSFER-001/004 preserves both confirmed exchange movements even when USD history is skipped', () => {
    const row = entries[5]
    expect(convertTransactions([row], accounts(), new Set([accountId]))).toEqual([{
      date: new Date('2026-10-13T20:36:51Z'),
      hold: false,
      movements: [
        { id: `${stringAt(row, 'id')}:${accountId}`, account: { id: accountId }, sum: 107.31, invoice: { sum: 120.89, instrument: 'USD' }, fee: 0 },
        { id: `${stringAt(row, 'id')}:${usdId}`, account: { id: usdId }, sum: -120.89, invoice: null, fee: 0 }
      ],
      merchant: null,
      comment: null
    }])
  })
})
