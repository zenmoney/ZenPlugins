import { getMobileExchangeRates } from '../../api'

describe('getMobileExchangeRates', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('parses exchange rates when response.json throws and response.text is string', async () => {
    global.fetch = async () => ({
      ok: true,
      json: () => {
        throw new TypeError('this.text.then is not a function')
      },
      text: '{"success":true,"message":null,"data":{"mobile":[{"buyRate":"1,23","sellRate":"1,24","buyCode":"USD","sellCode":"KZT"}],"cash":[],"non_cash":[]},"status":200}'
    }) as unknown as Response

    await expect(getMobileExchangeRates()).resolves.toEqual({
      USD_KZT: {
        buyRate: 1.23,
        sellRate: 1.24
      }
    })
  })
})
