import { convertMasterCardTransaction } from '../../converters'

describe('convertMasterCardTransaction', () => {
  it('converts regular outcome (back: false)', () => {
    const card = { id: 'mc-card', instrument: 'USD' }
    const rawTx = {
      transDate: 1700000000000,
      amount: '-1500',
      fee: '0',
      currency: { name: 'USD' },
      merchantName: 'AMAZON',
      back: false
    }
    const result = convertMasterCardTransaction(card, rawTx)
    expect(result).not.toBeNull()
    expect(result.movements[0].sum).toBe(-1500)
    expect(result.merchant.title).toBe('AMAZON')
    expect(result.hold).toBe(false)
  })

  it('converts refund (back: true) — no merchant', () => {
    const card = { id: 'mc-card', instrument: 'USD' }
    const rawTx = {
      transDate: 1700000000000,
      amount: '500',
      fee: '0',
      currency: { name: 'USD' },
      merchantName: 'AMAZON',
      back: true
    }
    const result = convertMasterCardTransaction(card, rawTx)
    expect(result).not.toBeNull()
    expect(result.movements[0].sum).toBe(500)
    expect(result.merchant).toBeNull()
  })

  it('returns null for zero amount', () => {
    const card = { id: 'mc-card', instrument: 'UZS' }
    const rawTx = {
      transDate: 1700000000000,
      amount: '0',
      fee: '0',
      currency: { name: 'UZS' },
      merchantName: 'TEST',
      back: false
    }
    expect(convertMasterCardTransaction(card, rawTx)).toBeNull()
  })
})
