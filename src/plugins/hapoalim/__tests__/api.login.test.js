/* eslint-disable @typescript-eslint/no-var-requires */

describe('hapoalim api login', () => {
  let login
  let openWebViewAndInterceptRequestMock
  let fetchMock
  let fetchJsonMock

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    openWebViewAndInterceptRequestMock = jest.fn(async ({ url, intercept }) => {
      expect(url).toBe('https://login.bankhapoalim.co.il/cgi-bin/poalwwwc?reqName=getLogonPage')

      const apiRequestResult = intercept({
        url: 'https://login.bankhapoalim.co.il/ServerServices/general/accounts?lang=he',
        headers: {
          cookie: 'TS=api-cookie; XSRF-TOKEN=api-xsrf'
        }
      })
      expect(apiRequestResult).toBeNull()

      const portalRequestResult = intercept({
        url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
        headers: {
          cookie: 'TS=portal-cookie; XSRF-TOKEN=portal-xsrf'
        }
      })

      expect(portalRequestResult.auth.cookieHeader).toContain('TS=portal-cookie')
      expect(portalRequestResult.auth.cookieHeader).toContain('XSRF-TOKEN=portal-xsrf')
      expect(portalRequestResult.auth.xsrfToken).toBe('portal-xsrf')

      return portalRequestResult
    })

    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
      headers: {},
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })
    fetchJsonMock = jest.fn()

    global.ZenMoney = {
      openWebView: jest.fn()
    }

    jest.doMock('../../../common/network', () => ({
      __esModule: true,
      fetch: fetchMock,
      fetchJson: fetchJsonMock,
      openWebViewAndInterceptRequest: openWebViewAndInterceptRequestMock,
      ParseError: class ParseError extends Error {}
    }))

    login = require('../api').login
  })

  it('waits for an authenticated portal request, restores rest context and refreshes cookies from response headers', async () => {
    fetchMock.mockResolvedValue({
      status: 200,
      url: 'https://login.bankhapoalim.co.il/portalserver/HomePage',
      headers: {
        'set-cookie': 'TS=rotated-cookie; Path=/, XSRF-TOKEN=rotated-xsrf; Path=/'
      },
      body: 'window.bnhpApp = { restContext: "/pib" }'
    })

    const auth = await login()

    expect(openWebViewAndInterceptRequestMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://login.bankhapoalim.co.il/portalserver/HomePage',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Cookie: expect.stringContaining('TS=portal-cookie')
        })
      })
    )
    expect(auth).toMatchObject({
      xsrfToken: 'rotated-xsrf',
      restContext: 'pib'
    })
    expect(auth.cookieHeader).toContain('TS=rotated-cookie')
    expect(auth.cookieHeader).toContain('XSRF-TOKEN=rotated-xsrf')
  })
})
