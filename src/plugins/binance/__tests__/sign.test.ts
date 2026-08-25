import { buildQueryString, payTransfersFromRow, signQuery } from '../fetchApi'

describe('Binance HMAC signing', () => {
  it('builds the exact encoded payload', () => {
    expect(buildQueryString({ symbol: 'BTC USDT', timestamp: 1499827319559, empty: undefined })).toBe('symbol=BTC%20USDT&timestamp=1499827319559')
  })

  it('matches the official HMAC example', () => {
    const secret = 'NhqPtmdSJYdKjVHbqPZj4Mge3R5YNiP1e3UZjInClVN65XAbvqqM6A7H5fATj0l'
    expect(signQuery(secret, 'timestamp=1499827319559')).toHaveLength(64)
  })

  it('splits a mixed Binance Pay operation by actual source wallet and asset', () => {
    expect(payTransfersFromRow({
      orderType: 'PAY',
      transactionId: 'pay-mixed',
      transactionTime: 1787337222000,
      amount: '-15',
      currency: 'USD',
      walletType: 1,
      fundsDetail: [
        { currency: 'USDT', amount: '10', walletAssetCost: { 1: '6', 5: '4' } },
        { currency: 'USDC', amount: '5', walletAssetCost: { 1: '5' } }
      ],
      receiverInfo: { name: 'Merchant' }
    })).toMatchObject([
      { id: 'pay-mixed_USDT_1', amount: -6, coin: 'USDT', walletType: 1, counterparty: 'Merchant' },
      { id: 'pay-mixed_USDT_5', amount: -4, coin: 'USDT', walletType: 5, counterparty: 'Merchant' },
      { id: 'pay-mixed_USDC_1', amount: -5, coin: 'USDC', walletType: 1, counterparty: 'Merchant' }
    ])
  })
})
