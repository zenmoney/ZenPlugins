import { fetchTransactions } from '../../api'

function makeNetworkResponse (body) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://m.bcc.kz/mock',
    headers: {
      forEach: () => {}
    },
    text: async () => JSON.stringify(body)
  }
}

function makeHtmlResponse (html) {
  return {
    ok: false,
    status: 504,
    statusText: 'Gateway Timeout',
    url: 'https://m.bcc.kz/mock',
    headers: {
      forEach: () => {}
    },
    text: async () => html
  }
}

describe('bcc-kz fetchTransactions web api', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('uses GET_EXT_STATEMENT query in web format', async () => {
    global.fetch.mockResolvedValueOnce(makeNetworkResponse({
      success: true,
      stmt: []
    }))

    await fetchTransactions(
      {
        accessToken: 'bearer-token',
        sessionCode: 'session-code'
      },
      { productId: 14120379 },
      new Date('2026-02-27T00:00:00+06:00'),
      new Date('2026-03-05T00:00:00+06:00')
    )

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const url = global.fetch.mock.calls[0][0]
    expect(url).toContain('action=GET_EXT_STATEMENT')
    expect(url).toContain('account_id=14120379')
    expect(url).toContain('date_begin=27.02.2026')
    expect(url).toContain('date_end=05.03.2026')
    expect(url).toContain('session_code=session-code')
    expect(url).toContain('timestamp=')
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer bearer-token')
  })

  it('falls back to chunked requests on html 504 response', async () => {
    global.fetch
      .mockResolvedValueOnce(makeHtmlResponse('<html><h1>504 Gateway Time-out</h1></html>'))
      .mockResolvedValueOnce(makeNetworkResponse({
        success: true,
        stmt: [{ trn_id: 'a' }]
      }))
      .mockResolvedValueOnce(makeNetworkResponse({
        success: true,
        stmt: [{ trn_id: 'b' }]
      }))

    const result = await fetchTransactions(
      {
        accessToken: 'bearer-token',
        sessionCode: 'session-code'
      },
      { productId: 14120379 },
      new Date('2026-01-01T00:00:00+06:00'),
      new Date('2026-02-09T00:00:00+06:00')
    )

    expect(global.fetch).toHaveBeenCalledTimes(3)
    expect(global.fetch.mock.calls[1][0]).toContain('date_begin=01.01.2026')
    expect(global.fetch.mock.calls[1][0]).toContain('date_end=31.01.2026')
    expect(global.fetch.mock.calls[2][0]).toContain('date_begin=01.02.2026')
    expect(global.fetch.mock.calls[2][0]).toContain('date_end=09.02.2026')
    expect(result).toEqual([{ trn_id: 'a' }, { trn_id: 'b' }])
  })
})
