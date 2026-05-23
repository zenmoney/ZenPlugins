import { describe, it, expect } from '@jest/globals'
import { normalizeMerchant, KNOWN_CONTRACTS } from '../merchants'

describe('normalizeMerchant', () => {
  it('возвращает Unknown для пустого адреса', () => {
    expect(normalizeMerchant('', '0x0')).toBe('Unknown')
  })

  it('распознаёт Self', () => {
    expect(normalizeMerchant('0xAbC', '0xabc')).toBe('Self')
  })

  it('распознаёт известный контракт', () => {
    const addr = Object.keys(KNOWN_CONTRACTS)[0]
    expect(normalizeMerchant(addr, '0x0')).toBe(KNOWN_CONTRACTS[addr])
  })

  it('форматирует неизвестный контракт', () => {
    const addr = '0x1111111111111111111111111111111111111111'
    const res = normalizeMerchant(addr, '0x0')
    expect(res.startsWith('Contract ')).toBe(true)
  })

  it('возвращает исходный addr для не‑контрактов', () => {
    expect(normalizeMerchant('Some Name', '0x0')).toBe('Some Name')
  })
})
