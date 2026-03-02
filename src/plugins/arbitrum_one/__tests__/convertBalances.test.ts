import { describe, it, expect } from '@jest/globals'
import { convertBalances } from '../converter'
import { SUPPORTED_TOKENS } from '../supportedTokens'

describe('convertBalances', () => {
  it('конвертирует нативный баланс ETH', () => {
    const native = { balance: '1000000000000000000' } // 1 ETH
    const tokens: any[] = []

    const res = convertBalances(native as any, tokens)

    expect(res[0].id).toBe('arbitrum-one-main')
    expect(res[0].instrument).toBe('µETH')
    expect(res[0].balance).toBe(1000000)
  })

  it('конвертирует поддерживаемый токен', () => {
    const tokenMeta = SUPPORTED_TOKENS[0]
    const native = { balance: '0' }
    const tokens = [
      {
        contract: tokenMeta.contract,
        balance: String(10 * 10 ** tokenMeta.decimals),
        symbol: tokenMeta.symbol
      }
    ]

    const res = convertBalances(native as any, tokens as any)

    const tokenAcc = res.find((r) => r.instrument === tokenMeta.symbol)
    expect(tokenAcc).toBeDefined()
    expect(tokenAcc?.balance).toBe(10)
  })
})
