import { buildQueryString, signRequest, stripEmpty } from '../../fetchApi'

describe('Bybit V5 request signing', () => {
  const apiSecret = 'secret'
  const timestamp = '1700000000000'
  const apiKey = 'api-key'
  const recvWindow = '20000'

  it('signs the exact POST JSON payload sent in the request body', () => {
    const body = stripEmpty({
      type: 'SIDE_QUERY_AUTH',
      createBeginTime: 1,
      createEndTime: 2,
      page: 1,
      limit: 100,
      empty: '',
      missing: undefined
    })

    expect(body).toEqual({
      type: 'SIDE_QUERY_AUTH',
      createBeginTime: 1,
      createEndTime: 2,
      page: 1,
      limit: 100
    })

    const payload = JSON.stringify(body)
    expect(signRequest(apiSecret, timestamp, apiKey, recvWindow, payload)).toBe('acc8916b5dc03d3f55f8353263a637d389c249687f428d367c28f76b39e1999f')
  })

  it('signs the exact GET query string sent in the request URL', () => {
    const payload = buildQueryString({
      accountType: 'eb_convert_funding',
      side: 0,
      coin: 'USDT/USDC',
      empty: '',
      missing: undefined
    })

    expect(payload).toBe('accountType=eb_convert_funding&side=0&coin=USDT%2FUSDC')
    expect(signRequest(apiSecret, timestamp, apiKey, recvWindow, payload)).toBe('1ba2e324a0b1ceb2545e1466d81cdf654e78d31f154d7cc337da100f9b187674')
  })
})
