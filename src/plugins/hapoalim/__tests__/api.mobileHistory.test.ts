import { createMobileHistoryLoader, MobileHistoryResponse, MobileHistoryRequest } from '../mobileHistory'

// [model] Synthetic records exercise transport/completeness invariants only.
// Native paging provenance: APK44.2.0/763, Lqr/a, Lqr/f/g, Lmm/a.g/i.
// These are not bank fixtures or evidence of transaction interpretation.
const from = new Date('2026-10-01T00:00:00+02:00')
const to = new Date('2026-10-15T12:00:00+02:00')
const account = '12-702-1001'
const page = (transactions: unknown[], cursor: string | null = null, integrity: string | null = 'MODEL_PRIVATE_INTEGRITY'): MobileHistoryResponse => ({
  status: 200, body: { transactions }, headers: { get: name => name === 'content-type' ? 'application/json' : name === 'data-header' ? cursor : name === 'integrity-header' ? integrity : null }
})
const row = (id: number): object => ({ modelId: id, amount: 7 })
function setup (): { request: jest.Mock<Promise<MobileHistoryResponse>, [string, MobileHistoryRequest]>, load: ReturnType<typeof createMobileHistoryLoader> } {
  const request = jest.fn<Promise<MobileHistoryResponse>, [string, MobileHistoryRequest]>()
  return { request, load: createMobileHistoryLoader({ request, isActive: () => true }) }
}

describe('[model] mobile history header-driven pagination', () => {
  it.each([null, ''])('ends only on native EOF, including a full50 final page (%s)', async eof => {
    const { request, load } = setup()
    const rows = Array.from({ length: 50 }, (_, i) => row(i))
    request.mockResolvedValue(page(rows, eof))
    expect(await load(account, from, to)).toEqual(rows)
    expect(request).toHaveBeenCalledTimes(1)
    const [url, options] = request.mock.calls[0]
    const parsed = new URL(url)
    expect(parsed.origin).toBe('https://iphone.bankhapoalim.co.il')
    expect(parsed.pathname).toBe('/ServerServices/current-account/transactions')
    expect(Object.fromEntries(parsed.searchParams)).toEqual({ numItemsPerPage: '50', sortCode: '1', retrievalStartDate: '20261001', retrievalEndDate: '20261015', dataGroupCatenatedKey: '', accountId: account, appId: 'bankApp3Generation', _lang: 'he-IL' })
    expect(options).toEqual({ method: 'POST', timeout: 15000, headers: { Accept: 'application/json', 'Content-Type': 'application/json;charset=UTF-8', 'Accept-Encoding': 'identity' } })
  })

  it('continues short/empty pages, uses each data handle and the initial integrity token', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page([row(1)], 'MODEL/ONE?x=1'))
      .mockResolvedValueOnce(page([], 'MODEL_TWO', 'MODEL_IGNORED_ROTATION'))
      .mockResolvedValueOnce(page([row(2)], 'MODEL_THREE'))
      .mockResolvedValueOnce(page([row(3)]))
    expect(await load(account, from, to)).toEqual([row(1), row(2), row(3)])
    expect(request.mock.calls.slice(1).map(([url]) => new URL(url).pathname)).toEqual([
      '/ServerServices/current-account/transactions/MODEL%2FONE%3Fx%3D1',
      '/ServerServices/current-account/transactions/MODEL_TWO',
      '/ServerServices/current-account/transactions/MODEL_THREE'
    ])
    for (const [, options] of request.mock.calls.slice(1)) expect(options.headers['integrity-header']).toBe('MODEL_PRIVATE_INTEGRITY')
  })

  it('preserves two identical legitimate rows within a page without inventing IDs', async () => {
    const { request, load } = setup()
    const equal = row(1)
    request.mockResolvedValue(page([equal, { ...equal }]))
    expect(await load(account, from, to)).toEqual([equal, equal])
  })

  it.each([null, 'MODEL_NEXT'])('preserves every row when POST50 returns60, with header EOF (%s)', async cursor => {
    const { request, load } = setup()
    const first = Array.from({ length: 60 }, (_, i) => row(i))
    const last = cursor === null ? [] : [row(60), row(61)]
    request.mockResolvedValueOnce(page(first, cursor))
    if (cursor !== null) request.mockResolvedValueOnce(page(last))
    expect(await load(account, from, to)).toEqual([...first, ...last])
    expect(request).toHaveBeenCalledTimes(cursor === null ? 1 : 2)
    for (const [url] of request.mock.calls) expect(new URL(url).searchParams.get('numItemsPerPage')).toBe('50')
  })

  it('accepts an additional60-row continuation without truncation', async () => {
    const { request, load } = setup()
    const first = Array.from({ length: 50 }, (_, i) => row(i))
    const last = Array.from({ length: 60 }, (_, i) => row(i + 50))
    request.mockResolvedValueOnce(page(first, 'MODEL_NEXT')).mockResolvedValueOnce(page(last))
    expect(await load(account, from, to)).toEqual([...first, ...last])
  })

  it('fails a resource-overflow page without partial success and resets for another account', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page(Array.from({ length: 100001 }, () => row(1))))
      .mockResolvedValueOnce(page([row(2)]))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'history-row-limit' })
    expect(await load('12-702-1002', from, to)).toEqual([row(2)])
    expect(request).toHaveBeenCalledTimes(2)
    expect(new URL(request.mock.calls[1][0]).pathname).toBe('/ServerServices/current-account/transactions')
  })

  it('fails a cumulative resource overflow before reporting the overflowing page', async () => {
    const request = jest.fn<Promise<MobileHistoryResponse>, [string, MobileHistoryRequest]>()
    const onPage = jest.fn(async () => {})
    const load = createMobileHistoryLoader({ request, isActive: () => true, onPage })
    request.mockResolvedValueOnce(page(Array.from({ length: 60000 }, (_, i) => row(i)), 'MODEL_NEXT'))
      .mockResolvedValueOnce(page(Array.from({ length: 40001 }, (_, i) => row(i + 60000))))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'history-row-limit' })
    expect(onPage).toHaveBeenCalledTimes(1)
    expect(onPage).toHaveBeenCalledWith({ pageOrdinal: 1, rowCount: 60000, totalRows: 60000, hasMore: true })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('accepts the exact resource boundary without a spread-argument overflow', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page(Array.from({ length: 100000 }, (_, i) => row(i))))
    const rows = await load(account, from, to)
    expect(rows).toHaveLength(100000)
    expect(rows[0]).toEqual(row(0))
    expect(rows[99999]).toEqual(row(99999))
  })

  it('accepts a stable server handle while different records keep arriving', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page([row(1)], 'MODEL_SAME'))
      .mockResolvedValueOnce(page([row(2)], 'MODEL_SAME'))
      .mockResolvedValueOnce(page([row(3)]))
    expect(await load(account, from, to)).toEqual([row(1), row(2), row(3)])
  })

  it('fails repeated whole pages even if the handle changes, without exposing private tokens', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page([row(1)], 'MODEL_ONE'))
      .mockResolvedValueOnce(page([{ amount: 7, modelId: 1 }], 'MODEL_TWO'))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'repeated-page', message: 'Bank Hapoalim mobile history stopped: repeated-page' })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('fails empty-page handle cycles instead of looping or claiming success', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page([], 'MODEL_ONE')).mockResolvedValueOnce(page([], 'MODEL_TWO')).mockResolvedValueOnce(page([], 'MODEL_ONE'))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'repeated-page' })
    expect(request).toHaveBeenCalledTimes(3)
  })

  it('fails a partially overlapping page instead of importing a replay or dropping rows', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page([row(1), row(2)], 'MODEL_ONE')).mockResolvedValueOnce(page([row(2), row(3)]))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'overlapping-pages' })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('enforces an overall deadline after awaits without returning a partial statement', async () => {
    const { request, load } = setup()
    let now = 0
    const clock = jest.spyOn(Date, 'now').mockImplementation(() => now)
    request.mockImplementation(async () => { now = 120000; return page([row(1)], 'MODEL_LATE') })
    try {
      await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'history-deadline' })
      expect(request).toHaveBeenCalledTimes(1)
    } finally { clock.mockRestore() }
  })

  it.each(['request', 'onPage'])('bounds a never-settling %s and ignores its late continuation', async stage => {
    jest.useFakeTimers({ doNotFake: ['performance'] })
    let release: ((value: MobileHistoryResponse) => void) | undefined
    const gate = new Promise<MobileHistoryResponse>(resolve => { release = resolve })
    const request = jest.fn(async () => stage === 'request' ? await gate : page([row(1)], 'MODEL_NEXT'))
    const onPage = jest.fn(async () => { if (stage === 'onPage') await gate })
    const load = createMobileHistoryLoader({ request, isActive: () => true, onPage })
    let outcome: unknown = null
    const first = load(account, from, to).catch((error: unknown) => { outcome = error })
    const flush = async (): Promise<void> => { for (let i = 0; i < 20; i++) await Promise.resolve() }
    try {
      await flush()
      jest.advanceTimersByTime(120000)
      await flush()
      expect(outcome).toEqual(expect.objectContaining({ kind: 'history-deadline' }))
      request.mockResolvedValue(page([row(2)]))
      onPage.mockResolvedValue(undefined)
      expect(await load('12-702-1002', from, to)).toEqual([row(2)])
      if (release === undefined) throw new Error('Missing model gate')
      release(page([row(3)], 'MODEL_LATE'))
      await flush()
      await first
      expect(request).toHaveBeenCalledTimes(2)
      expect(jest.getTimerCount()).toBe(0)
    } finally {
      release?.(page([]))
      await flush()
      jest.useRealTimers()
    }
  })

  it.each([null, ''])('fails a continuation without integrity (%s)', async integrity => {
    const { request, load } = setup()
    request.mockResolvedValue(page([row(1)], 'MODEL_ONE', integrity))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'missing-integrity' })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it.each([204, 302, 401, 500])('does not turn HTTP%s into EOF or retry', async status => {
    const { request, load } = setup()
    request.mockResolvedValue({ ...page([]), status })
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'unexpected-history-response' })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it.each([null, {}, { transactions: null }, { transactions: [null] }])('fails unknown envelopes without returning partial rows', async body => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page([row(1)], 'MODEL_ONE')).mockResolvedValueOnce({ ...page([]), body })
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'unexpected-history-response' })
  })

  it.each(['.', '..', 'MODEL\nHEADER', 'x'.repeat(8193)])('refuses unsafe continuation path segments', async cursor => {
    const { request, load } = setup()
    request.mockResolvedValue(page([row(1)], cursor))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'unexpected-history-response' })
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('propagates an exact later network failure and does not fall back or resend', async () => {
    const { request, load } = setup()
    const failure = new Error('MODEL_NETWORK_FAILURE')
    request.mockResolvedValueOnce(page([row(1)], 'MODEL_ONE')).mockRejectedValueOnce(failure)
    await expect(load(account, from, to)).rejects.toBe(failure)
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('isolates both accounts and repeated runs from previous handles', async () => {
    const { request, load } = setup()
    request.mockResolvedValueOnce(page([row(1)], 'MODEL_A')).mockResolvedValueOnce(page([row(2)]))
      .mockResolvedValueOnce(page([row(3)], 'MODEL_B')).mockResolvedValueOnce(page([row(4)]))
      .mockResolvedValueOnce(page([row(1)], 'MODEL_NEW')).mockResolvedValueOnce(page([row(2)]))
    expect(await load(account, from, to)).toEqual([row(1), row(2)])
    expect(await load('12-702-1002', from, to)).toEqual([row(3), row(4)])
    expect(await load(account, from, to)).toEqual([row(1), row(2)])
    for (const index of [0, 2, 4]) expect(new URL(request.mock.calls[index][0]).pathname).toBe('/ServerServices/current-account/transactions')
    expect(request.mock.calls[3][0]).toContain('/MODEL_B?')
  })

  it('rejects concurrent paging and never follows a late response after cancellation', async () => {
    let active = true
    let release: ((value: MobileHistoryResponse) => void) | undefined
    const request = jest.fn(async () => await new Promise<MobileHistoryResponse>(resolve => { release = resolve }))
    const onPage = jest.fn(async () => {})
    const load = createMobileHistoryLoader({ request, isActive: () => active, onPage })
    const first = load(account, from, to)
    await expect(load('12-702-1002', from, to)).rejects.toMatchObject({ kind: 'concurrent-history' })
    active = false
    if (release === undefined) throw new Error('Missing model response continuation')
    release(page([row(1)], 'MODEL_LATE'))
    await expect(first).rejects.toMatchObject({ kind: 'history-inactive' })
    expect(onPage).not.toHaveBeenCalled()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('fails the page bound without publishing 1000 incomplete pages', async () => {
    const { request, load } = setup()
    let ordinal = 0
    request.mockImplementation(async () => page([row(++ordinal)], `MODEL_${ordinal}`))
    await expect(load(account, from, to)).rejects.toMatchObject({ kind: 'history-page-limit' })
    expect(request).toHaveBeenCalledTimes(1000)
  })
})
