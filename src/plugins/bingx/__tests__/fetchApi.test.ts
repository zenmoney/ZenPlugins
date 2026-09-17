import { buildQueryString, signQuery } from '../fetchApi'

describe('BingX request signing', () => {
  it('sorts and signs the exact encoded query string sent to BingX', () => {
    const query = buildQueryString({ timestamp: 1700000000000, symbol: 'BTC-USDT', recvWindow: 5000, empty: undefined })
    expect(query).toBe('recvWindow=5000&symbol=BTC-USDT&timestamp=1700000000000')
    expect(signQuery('secret', query)).toBe('f70971b2211682368f2d05d1ab18d837e4da793c3475e397a9a0451393e487e7')
  })
})
