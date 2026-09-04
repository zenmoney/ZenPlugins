import { convertTransaction } from '../../tokens/converters'
import { TokenAccount, TokenTransaction } from '../../tokens/types'

const account: TokenAccount = {
  id: '0xAbC',
  balance: 0,
  contractAddress: '0x55d398326f99059ff775485246999027b3197955'
}

const transfer: TokenTransaction = {
  blockNumber: '1',
  timeStamp: '1710000000',
  hash: '0xtransaction',
  nonce: '0',
  blockHash: '0xblock',
  from: '0xabc',
  contractAddress: account.contractAddress,
  to: '0xrecipient',
  value: '1000000000000000000',
  tokenName: 'Tether USD',
  tokenSymbol: 'USDT',
  tokenDecimal: '18',
  transactionIndex: '12',
  gas: '0',
  gasPrice: '0',
  gasUsed: '0',
  cumulativeGasUsed: '0',
  input: '0x',
  confirmations: '1'
}

describe('BSC token transaction conversion', () => {
  it('uses log index to keep transfers from one transaction distinct', () => {
    const first = convertTransaction(account, { ...transfer, logIndex: '5' })
    const second = convertTransaction(account, { ...transfer, logIndex: '6' })

    expect(first?.movements[0].id).toBe('0xtransaction:5')
    expect(second?.movements[0].id).toBe('0xtransaction:6')
  })

  it('treats an address with different letter case as the same wallet', () => {
    expect(convertTransaction(account, transfer)?.movements[0].sum).toBe(-1)
  })

  it('ignores stablecoin dust below one dollar', () => {
    expect(convertTransaction(account, {
      ...transfer,
      from: '0xsender',
      to: account.id,
      value: '999999000000000000'
    })).toBe(null)
  })

  it('keeps an intentional outgoing transfer below one dollar', () => {
    expect(convertTransaction(account, { ...transfer, value: '500000000000000000' })?.movements[0].sum).toBe(-0.5)
  })
})
