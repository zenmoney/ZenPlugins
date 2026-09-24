import { describe, it, expect } from '@jest/globals'
import { convertTransactions } from '../converter'
import { SUPPORTED_TOKENS } from '../supportedTokens'

describe('convertTransactions', () => {
  it('конвертирует исходящую ETH транзакцию', () => {
    const nativeTxs = [
      {
        hash: '0x1',
        from: '0xaaa',
        to: '0xbbb',
        value: '1000000000000000000', // 1 ETH
        gasUsed: '21000',
        gasPrice: '1000000000',
        timeStamp: '1700000000'
      }
    ]

    const res = convertTransactions(nativeTxs as any, [], '0xaaa')

    expect(res).toHaveLength(1)
    const tx = res[0]
    expect(tx.movements[0].sum).toBe(-1000000)
    expect(tx.movements[0].fee).toBeGreaterThan(0)
    expect(tx.merchant.fullTitle).toBe('0xbbb')
  })

  it('конвертирует входящую ETH транзакцию', () => {
    const nativeTxs = [
      {
        hash: '0x2',
        from: '0xccc',
        to: '0xddd',
        value: '2000000000000000000', // 2 ETH
        gasUsed: '21000',
        gasPrice: '1000000000',
        timeStamp: '1700000001'
      }
    ]

    const res = convertTransactions(nativeTxs as any, [], '0xddd')

    expect(res).toHaveLength(1)
    const tx = res[0]
    expect(tx.movements[0].sum).toBe(2000000)
    expect(tx.movements[0].fee).toBe(0)
    expect(tx.merchant.fullTitle).toBe('0xccc')
  })

  it('конвертирует ERC20 транзакцию', () => {
    const tokenMeta = SUPPORTED_TOKENS[0]

    const nativeTxs: any[] = []
    const tokenTxs = [
      {
        hash: '0x3',
        from: '0xaaa',
        to: '0xbbb',
        contract: tokenMeta.contract,
        value: String(5 * 10 ** tokenMeta.decimals),
        timeStamp: '1700000002'
      }
    ]

    const res = convertTransactions(nativeTxs as any, tokenTxs as any, '0xaaa')

    expect(res).toHaveLength(1)
    const tx = res[0]
    expect(tx.movements[0].sum).toBe(-5)
    expect(tx.movements[0].account.id).toBe(
      `arbitrum-one-${tokenMeta.symbol.toLowerCase()}`
    )
  })
})
