import { convertTransactions } from '../../../converters'
import { accounts, entries, accountId, external } from '../../../__fixtures__/conversion'
import { stringAt } from '../../../validation'

describe('ZEN.COM captured topup', () => {
  it('AMOUNT-001/002 and TRANSFER-001 imports the top-up and its separately posted fee exactly once', () => {
    const rows = entries.slice(1, 3)
    expect(convertTransactions(rows, accounts(), new Set([accountId]))).toEqual([
      {
        date: new Date('2026-10-13T20:37:56Z'),
        hold: false,
        movements: [{ id: `${stringAt(rows[0], 'id')}:${accountId}`, account: { id: accountId }, sum: -2.25, invoice: null, fee: 0 }],
        merchant: { title: 'UAB ZEN.COM', city: null, country: null, mcc: null, location: null },
        comment: 'Fee for account top-up Apple Pay **1001'
      },
      {
        date: new Date('2026-10-13T20:37:56Z'),
        hold: false,
        movements: [
          { id: `${stringAt(rows[1], 'id')}:${accountId}`, account: { id: accountId }, sum: 77.25, invoice: null, fee: 0 },
          { id: null, account: { ...external('EUR', ['41111111******1001']), type: 'ccard' }, sum: -77.25, invoice: null, fee: 0 }
        ],
        merchant: { title: 'UAB ZEN.COM', city: null, country: null, mcc: null, location: null },
        comment: 'ZEN account top-up Apple Pay **1001'
      }
    ])
  })
})
