import { dropOffsettingSinglesSameAccount } from '../../transferCleanup'
import { Transaction, Movement } from '../../../../types/zenmoney'

describe('dropOffsettingSinglesSameAccount', () => {
  it('removes opposite-sign singles on same account in same minute', () => {
    const date = new Date('2025-11-28T10:00:00.000Z')
    const baseMovement = (sum: number): Movement => ({
      id: sum > 0 ? 'plus' : 'minus',
      account: { id: 'KZ987654312KZT' },
      invoice: null,
      sum,
      fee: 0
    })

    const incomeTx: Transaction = {
      hold: false,
      date,
      comment: null,
      merchant: null,
      movements: [baseMovement(1998.48)]
    }

    const outcomeTx: Transaction = {
      hold: false,
      date: new Date('2025-11-28T10:00:30.000Z'),
      comment: null,
      merchant: null,
      movements: [baseMovement(-1998.48)]
    }

    const keepTx: Transaction = {
      hold: false,
      date,
      comment: null,
      merchant: null,
      movements: [{
        id: 'keep',
        account: { id: 'OTHER' },
        invoice: null,
        sum: 100,
        fee: 0
      }]
    }

    const cleaned = dropOffsettingSinglesSameAccount([incomeTx, outcomeTx, keepTx])
    expect(cleaned).toHaveLength(1)
    expect(cleaned[0].movements[0].id).toBe('keep')
  })
})
