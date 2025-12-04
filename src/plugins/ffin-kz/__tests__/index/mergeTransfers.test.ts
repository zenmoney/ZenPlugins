import { mergeSinglesIntoSelfTransfers } from '../../index'
import { Transaction, Movement } from '../../../../types/zenmoney'

describe('mergeSinglesIntoSelfTransfers', () => {
  it('merges single incoming with self-transfer in same minute between card and deposit', () => {
    const date = new Date('2025-11-29T10:15:00.000Z')
    const depositMovement: Movement = {
      id: 'self-leg-plus',
      account: { id: 'KZDEPOSIT0001' },
      invoice: null,
      sum: 20000,
      fee: 0
    }
    const depositMovementMinus: Movement = {
      id: 'self-leg-minus',
      account: { id: 'KZDEPOSIT0001' },
      invoice: null,
      sum: -20000,
      fee: 0
    }
    const selfTransfer: Transaction = {
      hold: false,
      date,
      comment: null,
      merchant: null,
      movements: [depositMovement, depositMovementMinus]
    }

    const singleIncoming: Transaction = {
      hold: false,
      date,
      comment: null,
      merchant: null,
      movements: [
        {
          id: 'card-single',
          account: { id: 'KZCARD0001' },
          invoice: null,
          sum: 20000,
          fee: 0
        }
      ]
    }

    const merged = mergeSinglesIntoSelfTransfers([selfTransfer, singleIncoming])
    expect(merged).toHaveLength(1)
    const [tx] = merged
    expect(tx.movements).toHaveLength(2)
    const [m1, m2] = tx.movements as [Movement, Movement]

    // One leg is the original single (card) with positive sum
    expect(m1.account).toEqual({ id: 'KZCARD0001' })
    expect(m1.sum).toBe(20000)
    // Second leg is the deposit with opposite sum
    expect(m2.account).toEqual({ id: 'KZDEPOSIT0001' })
    expect(m2.sum).toBe(-20000)
  })
})
