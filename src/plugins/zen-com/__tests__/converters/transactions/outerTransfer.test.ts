import { convertTransactions } from '../../../converters'
import { accounts, entries, accountId, usdId, external } from '../../../__fixtures__/conversion'
import { additionalHistory } from '../../../__fixtures__/additionalHistory'
import { stringAt } from '../../../validation'

describe('ZEN.COM captured outerTransfer', () => {
  it('TRANSFER-001 preserves the incoming buddy transfer and sender identity', () => {
    expect(convertTransactions([additionalHistory[0]], accounts(), new Set([usdId]))).toEqual([{
      date: new Date('2026-09-23T17:39:22Z'),
      hold: false,
      movements: [
        { id: `00000000-0000-764c-8000-000000001000:${usdId}`, account: { id: usdId }, sum: 600, invoice: null, fee: 0 },
        { id: null, account: external('USD', ['GB00000000000000001000']), sum: -600, invoice: null, fee: 0 }
      ],
      merchant: { title: 'Taylor Example', city: null, country: null, mcc: null, location: null },
      comment: null
    }])
  })

  it('TRANSFER-001 preserves MoneySend amounts without treating the receiving ZEN card as the source', () => {
    expect(convertTransactions([additionalHistory[2], additionalHistory[3]], accounts(), new Set([accountId]))).toEqual([
      {
        date: new Date('2026-07-05T19:22:29Z'),
        hold: false,
        movements: [
          { id: `00000000-0000-3d8c-8000-000000001002:${accountId}`, account: { id: accountId }, sum: 25, invoice: null, fee: 0 },
          { id: null, account: external('EUR'), sum: -25, invoice: null, fee: 0 }
        ],
        merchant: { title: 'P2P', city: 'YEREVAN', country: 'ARM', mcc: null, location: null },
        comment: null
      },
      {
        date: new Date('2026-07-05T19:21:08Z'),
        hold: false,
        movements: [
          { id: `00000000-0000-3af7-8000-000000001003:${accountId}`, account: { id: accountId }, sum: 0.06, invoice: { sum: 25, instrument: 'AMD' }, fee: 0 },
          { id: null, account: external('AMD'), sum: -25, invoice: null, fee: 0 }
        ],
        merchant: { title: 'P2P', city: 'YEREVAN', country: 'ARM', mcc: null, location: null },
        comment: null
      }
    ])
  })

  it('TRANSFER-001 and MERCHANT-003 preserves the outgoing buddy transfer recipient', () => {
    const row = entries[0]
    expect(convertTransactions([row], accounts(), new Set([accountId]))).toEqual([{
      date: new Date('2026-10-13T20:39:04Z'),
      hold: false,
      movements: [
        { id: `${stringAt(row, 'id')}:${accountId}`, account: { id: accountId }, sum: -852, invoice: null, fee: 0 },
        { id: null, account: external('EUR'), sum: 852, invoice: null, fee: 0 }
      ],
      merchant: { title: 'Taylor Example', city: null, country: null, mcc: null, location: null },
      comment: null
    }])
  })
})
