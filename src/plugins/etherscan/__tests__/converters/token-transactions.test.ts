import { convertTransactions } from '../../tokens/converters'
import { ETHER_MAINNET } from '../../common/config'
import type { TokenAccount, TokenTransaction } from '../../tokens/types'

const account: TokenAccount = {
  id: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  balance: 0,
  contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7'
}

const baseTransaction: TokenTransaction = {
  blockNumber: '1',
  timeStamp: '1658608646',
  hash: '0x90bb0dcbe8fa38387145aa17d6ad99f57da91d4c6d4b65b5f7cf56454f73234b',
  nonce: '1',
  blockHash: '0x1',
  from: '0x1111111111111111111111111111111111111111',
  contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  to: account.id,
  value: '1000000',
  tokenName: 'Tether USD',
  tokenSymbol: 'USDT',
  tokenDecimal: '6',
  transactionIndex: '1',
  gas: '21000',
  gasPrice: '1000000000',
  gasUsed: '21000',
  cumulativeGasUsed: '21000',
  input: 'deprecated',
  confirmations: '1'
}

describe('token convertTransactions', () => {
  it('filters out movements with absolute value below 0.01', () => {
    const list = convertTransactions(
      account,
      [{ ...baseTransaction, value: '1' }],
      ETHER_MAINNET
    )

    expect(list).toHaveLength(0)
  })

  it('keeps movements with absolute value at least 0.01', () => {
    const list = convertTransactions(
      account,
      [{ ...baseTransaction, value: '10000' }],
      ETHER_MAINNET
    )

    expect(list).toHaveLength(1)
    expect(list[0].movements[0].sum).toBe(0.01)
  })
})
