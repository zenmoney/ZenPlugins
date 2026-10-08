import fetchMock from 'fetch-mock'
import { fetch, fetchJson } from './index'
import { convertHeadersToPlainObject, sanitizeNetworkLog } from './logging'

// [model] Only responses normalize headers; request logs preserve names, values and duplicate entries.
describe('[model] shared network headers', () => {
  afterEach(() => {
    fetchMock.restore()
    jest.restoreAllMocks()
  })

  it.each([
    { 'X-Trace': 'trace-7', Authorization: 'model-token' },
    [['X-Trace', 'trace-7'], ['Authorization', 'model-token']],
    new Headers({ 'X-Trace': 'trace-7', Authorization: 'model-token' })
  ] as HeadersInit[])('normalizes names and provides working accessors for %p', init => {
    const headers = convertHeadersToPlainObject(init)
    expect(headers).toEqual({ 'x-trace': 'trace-7', authorization: 'model-token' })
    expect(headers.get('X-TRACE')).toBe('trace-7')
    expect(headers.has('AUTHORIZATION')).toBe(true)
    expect(headers.get('missing')).toBeNull()
    expect([...headers.entries()]).toEqual([['authorization', 'model-token'], ['x-trace', 'trace-7']])
    expect([...headers.keys()]).toEqual(['authorization', 'x-trace'])
    expect([...headers.values()]).toEqual(['model-token', 'trace-7'])
    const receiver = {}
    const callback = jest.fn(function (this: unknown, _value, _name, collection) {
      expect(this).toBe(receiver)
      expect(collection).toBe(headers)
    })
    headers.forEach(callback, receiver)
    expect(callback).toHaveBeenCalledTimes(2)
    expect(JSON.parse(JSON.stringify(headers))).toEqual({ authorization: 'model-token', 'x-trace': 'trace-7' })
  })

  it('accepts native header collections and preserves duplicate values', () => {
    const headers = convertHeadersToPlainObject({
      forEach: (visit: (value: string, key: string) => void) => {
        visit('one', 'X-Trace')
        visit('two', 'x-trace')
      }
    })
    expect(headers).toEqual({ 'x-trace': 'one, two' })
    expect(headers.get('X-Trace')).toBe('one, two')
  })

  it('applies header masks without regard to case or mutation of the mask', () => {
    const headers = convertHeadersToPlainObject({ 'X-DEVICE-ID': 'model-device', Authorization: 'model-token', 'X-Trace': 'trace-7' })
    const mask = Object.freeze({ headers: Object.freeze({ 'X-DEVICE-ID': true, Authorization: true }) })
    expect(sanitizeNetworkLog({ headers }, mask)).toEqual({
      headers: { 'x-device-id': '<string[12]>', authorization: '<string[11]>', 'x-trace': 'trace-7' }
    })
    expect(mask.headers).toEqual({ 'X-DEVICE-ID': true, Authorization: true })
    expect(headers.get('authorization')).toBe('model-token')
  })

  it('joins repeated native header values before masking without changing the input', async () => {
    // Native Headers.forEach visits repeated Set-Cookie entries separately.
    class NativeHeaders {
      forEach (visit: (value: string, name: string) => void): void {
        visit('model-a=one', 'Set-Cookie')
        visit('model-b=two', 'Set-Cookie')
        visit('trace-1', 'X-Trace')
        visit('trace-2', 'X-Trace')
      }
    }
    const headers = new NativeHeaders() as Headers
    const mask = jest.fn((value: unknown) => '<masked>')
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const url = 'https://example.test'
    fetchMock.get(url, { body: 'model response' })
    await fetch(url, { headers, sanitizeRequestLog: { headers: { 'set-cookie': mask } } })
    expect(mask).toHaveBeenCalledTimes(1)
    expect(mask).toHaveBeenCalledWith('model-a=one, model-b=two')
    expect(debug.mock.calls[0][1].headers).toEqual({ 'Set-Cookie': '<masked>', 'X-Trace': 'trace-1, trace-2' })
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-a')
    expect(JSON.stringify(debug.mock.calls)).not.toContain('model-b')
    expect(convertHeadersToPlainObject(headers)).toEqual({ 'set-cookie': 'model-a=one, model-b=two', 'x-trace': 'trace-1, trace-2' })
    expect(fetchMock.lastOptions(url)?.headers).toBe(headers)
  })

  const requestCases: Array<{ headers: HeadersInit, masked: unknown }> = [
    {
      headers: Object.freeze({ Authorization: 'model-token', aUtHoRiZaTiOn: 'other-token', xTraceId: '  trace-7  ', XTraceId: 'trace-8' }),
      masked: { Authorization: '<string[11]>', aUtHoRiZaTiOn: '<string[11]>', xTraceId: '  trace-7  ', XTraceId: 'trace-8' }
    },
    {
      headers: [['Authorization', 'model-token'], ['Authorization', 'other-token'], ['aUtHoRiZaTiOn', 'third-token'], ['xTraceId', '  trace-7  ']],
      masked: [['Authorization', '<string[11]>'], ['Authorization', '<string[11]>'], ['aUtHoRiZaTiOn', '<string[11]>'], ['xTraceId', '  trace-7  ']]
    },
    {
      headers: new Headers({ Authorization: 'model-token', 'X-Trace': 'trace-7' }),
      masked: { authorization: '<string[11]>', 'x-trace': 'trace-7' }
    }
  ]

  it.each(requestCases)('masks raw HTTP request headers and normalizes only response headers: $headers', async ({ headers, masked }) => {
    const url = 'https://example.test/model'
    fetchMock.get(url, { body: 'model response', headers: { 'X-Trace': 'trace-7', 'Set-Cookie': 'model-cookie' } })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    const response = await fetch(url, {
      headers,
      sanitizeRequestLog: { headers: { AUTHORIZATION: true } },
      sanitizeResponseLog: { headers: { 'Set-Cookie': true } }
    })
    expect(fetchMock.lastOptions(url)?.headers).toBe(headers)
    expect(response.headers.get('X-Trace')).toBe('trace-7')
    expect(response.headers['x-trace']).toBe('trace-7')
    expect(debug.mock.calls[0][1].headers).toEqual(masked)
    expect(debug.mock.calls[1][1].headers).toMatchObject({ 'x-trace': 'trace-7', 'set-cookie': '<string[12]>' })
    const output = JSON.stringify(debug.mock.calls)
    for (const secret of ['model-token', 'other-token', 'third-token', 'model-cookie']) expect(output).not.toContain(secret)
    expect(output).toContain('trace-7')
  })

  it.each(requestCases)('passes original request headers to logs and function masks: $headers', async ({ headers }) => {
    const url = 'https://example.test/model'
    fetchMock.get(url, { body: 'model response' })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    await fetch(url, { headers })
    expect(debug.mock.calls[0][1].headers).toBe(headers)
    const mask = jest.fn((request: { headers: HeadersInit }) => ({ ...request, headers: '<masked>' }))
    await fetch(url, { headers, sanitizeRequestLog: mask })
    expect(mask.mock.calls[0][0].headers).toBe(headers)
    expect(debug.mock.calls[2][1].headers).toBe('<masked>')
  })

  it('leaves missing headers absent and propagates mask errors', () => {
    const value = { url: 'https://example.test/model' }
    expect(sanitizeNetworkLog(value, { headers: { Authorization: true } })).toEqual(value)
    const error = new Error('Model mask failed')
    expect(() => sanitizeNetworkLog({ headers: { Authorization: 'model-token' } }, {
      headers: { authorization: () => { throw error } }
    })).toThrow(error)
  })

  it.each([false, true])('preserves raw JSON request headers with logging %p', async log => {
    const url = 'https://example.test/model'
    const headers = Object.freeze({
      Accept: 'model/type',
      accept: 'model/other-type',
      'Content-Type': 'model/body',
      'content-type': 'model/other-body',
      'X-Trace': '  trace-7  ',
      'x-trace': 'trace-8'
    })
    fetchMock.post(url, { body: '{"ok":true}' })
    const debug = jest.spyOn(console, 'debug').mockImplementation(() => {})
    await fetchJson(url, { method: 'POST', headers, body: { model: true }, log })
    if (log) expect(debug.mock.calls[0][1].headers).toEqual(headers)
    expect(fetchMock.lastOptions(url)?.headers).toStrictEqual({
      Accept: 'model/type',
      accept: 'model/other-type',
      'Content-Type': 'model/body',
      'content-type': 'model/other-body',
      'X-Trace': '  trace-7  ',
      'x-trace': 'trace-8'
    })
  })

  it.each([
    { body: undefined, expected: { Accept: 'application/json, text/plain, */*', 'X-Trace': 'trace-7' } },
    { body: false, expected: { Accept: 'application/json, text/plain, */*', 'X-Trace': 'trace-7' } },
    { body: { model: true }, expected: { Accept: 'application/json, text/plain, */*', 'Content-Type': 'application/json;charset=UTF-8', 'X-Trace': 'trace-7' } }
  ])('adds JSON defaults for body $body without changing caller headers', async ({ body, expected }) => {
    const url = 'https://example.test/model'
    const headers = Object.freeze({ 'X-Trace': 'trace-7' })
    fetchMock.post(url, { body: '{"ok":true}' })
    await fetchJson(url, { method: 'POST', headers, body, log: false })
    expect(fetchMock.lastOptions(url)?.headers).toStrictEqual(expected)
  })

  it('disables JSON transformations explicitly with undefined', async () => {
    const url = 'https://example.test/model'
    fetchMock.post(url, { body: 'model raw response' })
    const response = await fetchJson(url, {
      method: 'POST', body: 'model raw request', stringify: undefined, parse: undefined, log: false
    })
    expect(fetchMock.lastOptions(url)?.body).toBe('model raw request')
    expect(response.body).toBe('model raw response')
  })
})
