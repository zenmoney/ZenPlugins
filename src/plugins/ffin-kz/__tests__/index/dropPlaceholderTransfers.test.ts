import { dropPlaceholderTransfers } from '../../transferCleanup'
import { Transaction, AccountType } from '../../../../types/zenmoney'

describe('dropPlaceholderTransfers', () => {
  it('removes transfers where one leg is placeholder account', () => {
    const date = new Date('2025-11-28T19:00:00.000Z')
    const placeholderTransfer: Transaction = {
      hold: false,
      date,
      comment: null,
      merchant: { title: 'placeholder', country: null, city: null, mcc: null, location: null },
      movements: [
        {
          id: 'real',
          account: { id: 'ACC-DEPOSIT-RAW' },
          invoice: null,
          sum: 40000,
          fee: 0
        },
        {
          id: null,
          account: { type: AccountType.ccard, instrument: 'KZT', company: null, syncIds: null },
          invoice: null,
          sum: -40000,
          fee: 0
        }
      ]
    }

    const validTransfer: Transaction = {
      hold: false,
      date,
      comment: null,
      merchant: { title: 'keep', country: null, city: null, mcc: null, location: null },
      movements: [
        {
          id: 'from',
          account: { id: 'ACC1' },
          invoice: null,
          sum: -1000,
          fee: 0
        },
        {
          id: 'to',
          account: { id: 'ACC2' },
          invoice: null,
          sum: 1000,
          fee: 0
        }
      ]
    }

    const kept = dropPlaceholderTransfers([placeholderTransfer, validTransfer])
    expect(kept).toHaveLength(1)
    const merchant = kept[0].merchant as any
    expect(merchant?.title ?? merchant?.fullTitle).toBe('keep')
  })

  it('keeps valid transfer from deposit statement to ccard placeholder', () => {
    const date = new Date('2026-02-01T19:00:00.000Z')
    const depositToCardTransfer: Transaction = {
      hold: false,
      date,
      comment: null,
      merchant: null,
      movements: [
        {
          id: 'from-deposit',
          account: { id: 'KZ00000B000000002KZT' },
          invoice: null,
          sum: -70000,
          fee: 0
        },
        {
          id: null,
          account: { type: AccountType.ccard, instrument: 'KZT', company: null, syncIds: null },
          invoice: null,
          sum: 70000,
          fee: 0
        }
      ]
    }

    const kept = dropPlaceholderTransfers([depositToCardTransfer])
    expect(kept).toHaveLength(1)
  })
})
