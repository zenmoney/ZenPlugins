import {
  convertDepositTransaction
} from '../../converters'

describe('convertDepositTransaction', () => {
  it('returns null for INTEREST activity', () => {
    const deposit = { id: 'DP-001' }
    const rawTx = {
      activity: { type: 'INTEREST', description: 'Interest payment' },
      amount: 50000,
      currency: { name: 'UZS', scale: 2 },
      paymentDate: '2025-03-01 10:00:00.+0000'
    }
    expect(convertDepositTransaction(deposit, rawTx)).toBeNull()
  })

  it('converts PARTIAL_REPLENISHMENT as credit', () => {
    const deposit = { id: 'DP-002' }
    const rawTx = {
      activity: { type: 'PARTIAL_REPLENISHMENT', description: 'Пополнение вклада' },
      amount: 1000000,
      currency: { name: 'UZS', scale: 2 },
      paymentDate: '2025-03-15 12:30:00.+0000'
    }
    const result = convertDepositTransaction(deposit, rawTx)
    expect(result).not.toBeNull()
    expect(result.movements[0].account.id).toBe('DP-002')
    expect(result.movements[0].sum).toBe(10000)
    expect(result.comment).toBe('Пополнение вклада')
    expect(result.hold).toBe(false)
  })
})
