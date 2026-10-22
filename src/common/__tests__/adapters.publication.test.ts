export {}

interface AdapterApi {
  adaptScrapeToMain: (scrape: (args: Record<string, unknown>) => Promise<unknown>) => (args: Record<string, unknown>) => Promise<unknown>
  provideScrapeDates: (scrape: (args: Record<string, unknown>) => Promise<unknown>) => (args: Record<string, unknown>) => Promise<unknown>
}

const { adaptScrapeToMain, provideScrapeDates } = jest.requireActual<AdapterApi>('../adapters')
const { UserInteractionError, InvalidLoginOrPasswordError } = jest.requireActual<typeof import('../../errors')>('../../errors')
const originalHost = global.ZenMoney
const CHECKPOINT = 'scrape/lastSuccessDate'
const PREVIOUS = '2026-09-10T12:00:00.000Z'
const STARTED = '2026-10-12T12:00:00.000Z'
const latestAuth = { token: 'MODEL_CONFIRMED_AUTH' }
const account = { id: 'model-account', type: 'checking', title: 'Model', instrument: 'USD', balance: 0, syncIds: ['1234'] }
const output = { accounts: [account], transactions: [] }

// [model] SDK/domain publication ordering, not bank payloads or native rollback.
// Reuses the earlier SDK regression design against the current implementation.
describe('[model] standard scrape checkpoint publication', () => {
  let data: Map<string, unknown>
  let events: string[]
  let acceptedResults: unknown[]
  let host: {
    getData: jest.Mock<unknown, [string]>
    setData: jest.Mock<void, [string, unknown]>
    saveData: jest.Mock<unknown, []>
    getPreferences: () => { startDate: string }
    manifest: { isSubscriptionRequired: boolean }
    features: { transactionDtoV2: boolean, dateProcessing: boolean }
    addAccount: jest.Mock<void, [unknown]>
    addTransaction: jest.Mock<void, [unknown]>
    setResult: jest.Mock<void, [unknown]>
  }

  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'performance'] })
    jest.setSystemTime(new Date(STARTED))
    for (const method of ['log', 'debug', 'error', 'warn'] as const) jest.spyOn(console, method).mockImplementation(() => {})
    data = new Map<string, unknown>([[CHECKPOINT, PREVIOUS], ['auth', latestAuth]])
    events = []
    acceptedResults = []
    host = {
      getData: jest.fn(key => data.get(key)),
      setData: jest.fn((key, value) => { data.set(key, value); if (key === CHECKPOINT) events.push('checkpoint') }),
      saveData: jest.fn(() => { events.push('saveData') }),
      getPreferences: () => ({ startDate: '2026-09-01' }),
      manifest: { isSubscriptionRequired: false },
      features: { transactionDtoV2: true, dateProcessing: true },
      addAccount: jest.fn((_accounts: unknown) => { events.push('addAccount') }),
      addTransaction: jest.fn((_transactions: unknown) => { events.push('addTransaction') }),
      setResult: jest.fn(result => { events.push('setResult'); acceptedResults.push(result) })
    }
    // A partial native boundary; saveData has a public synchronous/void contract.
    global.ZenMoney = host as unknown as typeof ZenMoney
  })

  afterEach(() => {
    const timers = jest.getTimerCount()
    global.ZenMoney = originalHost
    jest.useRealTimers()
    jest.restoreAllMocks()
    expect(timers).toBe(0)
  })

  it('prepares both collections and calls native publication before saving the successful checkpoint', async () => {
    await adaptScrapeToMain(async () => output)({})
    expect(events).toEqual(['addAccount', 'addTransaction', 'checkpoint', 'saveData', 'setResult'])
    expect(acceptedResults).toEqual([{ success: true }])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it.each(['addAccount', 'addTransaction', 'setData', 'saveData', 'setResult'] as const)('preserves checkpoint/auth and original error when %s throws', async method => {
    const failure = new Error('MODEL_PUBLICATION_FAILURE')
    host[method].mockImplementationOnce(() => { throw failure })
    await adaptScrapeToMain(async () => output)({})
    expect(acceptedResults).toEqual([failure])
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it.each(['addAccount', 'addTransaction'] as const)('keeps a failed first import eligible for its entire history after %s rejects', async method => {
    data.delete(CHECKPOINT)
    const failure = new Error('MODEL_FIRST_IMPORT_REJECTED')
    host[method].mockImplementationOnce(() => { throw failure })
    await adaptScrapeToMain(async () => output)({})
    expect(data.has(CHECKPOINT)).toBe(false)
    expect(acceptedResults).toEqual([failure])
    const retry = jest.fn(async () => output)
    await adaptScrapeToMain(retry)({})
    expect(retry).toHaveBeenCalledWith({ preferences: {}, fromDate: new Date(2026, 8, 1), toDate: null, isFirstRun: true })
    expect(acceptedResults).toEqual([failure, { success: true }])
  })

  it('does not inspect an undocumented return value from the public void saveData API', async () => {
    const result = Object.defineProperty({}, 'then', { get: () => { throw new Error('MODEL_RETURN_MUST_NOT_BE_READ') } })
    host.saveData.mockReturnValueOnce(result)
    await adaptScrapeToMain(async () => output)({})
    expect(acceptedResults).toEqual([{ success: true }])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
  })

  it.each([false, true])('contains a failed error-result callback without an unhandled rejection (after success attempt: %s)', async afterSuccess => {
    host.setResult.mockImplementation(() => { throw new Error('MODEL_RESULT_CALLBACK_FAILURE') })
    await expect(adaptScrapeToMain(async () => {
      if (!afterSuccess) throw new Error('MODEL_SCRAPE_FAILURE')
      return output
    })({})).resolves.toBeUndefined()
    expect(host.setResult).toHaveBeenCalledTimes(afterSuccess ? 2 : 1)
    expect(console.warn).toHaveBeenCalledWith('Error result callback failed; native outcome is unknown')
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it('contains an exactly-once native host that consumes success before throwing', async () => {
    let consumed = false
    host.setResult.mockImplementation(() => {
      if (consumed) throw new Error('MODEL_RESULT_ALREADY_CONSUMED')
      consumed = true
      throw new Error('MODEL_CONSUMED_SUCCESS_FAILURE')
    })
    await expect(adaptScrapeToMain(async () => output)({})).resolves.toBeUndefined()
    expect(host.setResult).toHaveBeenCalledTimes(2)
    expect(console.warn).toHaveBeenCalledWith('Error result callback failed; native outcome is unknown')
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it.each(['non-configurable', 'circular'])('reports a generic failure when presentation fails for a %s object', async kind => {
    let failure: unknown
    if (kind === 'non-configurable') failure = Object.defineProperty({}, 'message', { value: 'MODEL_LOCKED_ERROR', configurable: false, writable: false })
    else {
      const circular: { self?: unknown } = {}
      circular.self = circular
      failure = circular
    }
    await expect(adaptScrapeToMain(async () => { throw failure })({})).resolves.toBeUndefined()
    expect(acceptedResults).toHaveLength(1)
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] Error presentation failed' })
    expect(console.warn).toHaveBeenCalledWith('Error presentation failed; sending generic failure', { errorType: 'object' })
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it.each(['freeze', 'seal', 'preventExtensions', 'lockedMessage'] as const)('retains the diagnostic/stack and leaves the original ordinary Error unchanged (%s)', async mode => {
    const failure = new Error('MODEL_IMMUTABLE_ERROR')
    if (mode === 'lockedMessage') Object.defineProperty(failure, 'message', { writable: false })
    else if (mode === 'freeze') Object.freeze(failure)
    else if (mode === 'seal') Object.seal(failure)
    else Object.preventExtensions(failure)
    await expect(adaptScrapeToMain(async () => await Promise.reject(failure))({})).resolves.toBeUndefined()
    expect(acceptedResults).toHaveLength(1)
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] MODEL_IMMUTABLE_ERROR', stack: failure.stack, fatal: false, allowRetry: false })
    expect(Object.keys(acceptedResults[0] as object)).not.toContain('stack')
    expect(failure.message).toBe('MODEL_IMMUTABLE_ERROR')
    expect(console.warn).not.toHaveBeenCalled()
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it('preserves an immutable Error with an inherited getter-only message', async () => {
    class ReadOnlyMessageError extends Error {}
    Object.defineProperty(ReadOnlyMessageError.prototype, 'message', { get: () => 'MODEL_READ_ONLY_MESSAGE' })
    const failure = Object.freeze(new ReadOnlyMessageError())
    await adaptScrapeToMain(async () => await Promise.reject(failure))({})
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] MODEL_READ_ONLY_MESSAGE', stack: failure.stack })
    expect(console.warn).not.toHaveBeenCalled()
  })

  it.each([false, true])('preserves a cross-realm frozen Error without exposing a throwing message getter (throwing: %s)', async throwing => {
    const { runInNewContext } = jest.requireActual<typeof import('vm')>('vm')
    const failure: unknown = runInNewContext(throwing
      ? "Object.freeze(Object.defineProperty(new Error(), 'message', { get () { throw new Error('MODEL_PRIVATE_VALUE') } }))"
      : "Object.freeze(new Error('MODEL_CROSS_REALM_ERROR'))")
    await expect(adaptScrapeToMain(async () => await Promise.reject(failure))({})).resolves.toBeUndefined()
    expect(acceptedResults[0]).toMatchObject({ message: throwing ? '[RUE] Error presentation failed' : '[RUE] MODEL_CROSS_REALM_ERROR' })
    if (throwing) expect(console.warn).toHaveBeenCalledWith('Error presentation failed; sending generic failure', { errorType: 'Error' })
    expect(JSON.stringify(jest.mocked(console.warn).mock.calls)).not.toContain('MODEL_PRIVATE_VALUE')
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it('sends a preformatted failure even when host locale access throws', async () => {
    Object.defineProperty(host, 'locale', { get: () => { throw new Error('MODEL_LOCALE_ACCESS_FAILURE') } })
    await expect(adaptScrapeToMain(async () => { throw new Error('MODEL_SCRAPE_FAILURE') })({})).resolves.toBeUndefined()
    expect(acceptedResults).toHaveLength(1)
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] Error presentation failed', fatal: false, allowRetry: false, allow_retry: false })
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it.each([false, true])('preserves control classes/retry flags of immutable built-in errors (credentials: %s)', async credentials => {
    const failure = Object.freeze(credentials ? new InvalidLoginOrPasswordError('MODEL_USER_MESSAGE') : new UserInteractionError())
    await expect(adaptScrapeToMain(async () => await Promise.reject(failure))({})).resolves.toBeUndefined()
    expect(acceptedResults).toHaveLength(1)
    expect(acceptedResults[0]).toBeInstanceOf(credentials ? InvalidLoginOrPasswordError : UserInteractionError)
    expect(acceptedResults[0]).toMatchObject({ message: credentials ? 'MODEL_USER_MESSAGE' : '[INU]', fatal: credentials, allowRetry: true, allow_retry: true })
    expect(data.get('auth')).toBe(latestAuth)
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it('retains the original persistence error when checkpoint restoration also fails', async () => {
    const failure = new Error('MODEL_PRIMARY_SAVE_FAILURE')
    host.saveData.mockImplementation(() => { throw failure })
    await adaptScrapeToMain(async () => output)({})
    expect(acceptedResults).toEqual([failure])
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
    expect(console.warn).toHaveBeenCalledWith('History checkpoint restoration failed after publication error')
  })

  it('restores an absent checkpoint without making a failed first run successful', async () => {
    data.delete(CHECKPOINT)
    host.saveData.mockImplementationOnce(() => { throw new Error('MODEL_FIRST_SAVE_FAILURE') })
    await adaptScrapeToMain(async () => output)({})
    expect(data.get(CHECKPOINT)).toBeNull()
    expect(acceptedResults[0]).toBeInstanceOf(Error)
  })

  it.each([null, {}, { accounts: [], transactions: [] }, { accounts: [account], transactions: null }])('does not checkpoint or publish malformed results %#', async malformed => {
    await adaptScrapeToMain(async () => malformed)({})
    expect(host.addAccount).not.toHaveBeenCalled()
    expect(host.addTransaction).not.toHaveBeenCalled()
    expect(host.setData).not.toHaveBeenCalled()
    expect(host.saveData).not.toHaveBeenCalled()
    expect(acceptedResults).toHaveLength(1)
    expect(acceptedResults[0]).toBeInstanceOf(Error)
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it('prepares transactions before publishing accounts when transaction patching rejects', async () => {
    await adaptScrapeToMain(async () => ({ accounts: [account], transactions: [null] }))({})
    expect(host.addAccount).not.toHaveBeenCalled()
    expect(host.addTransaction).not.toHaveBeenCalled()
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(acceptedResults[0]).toBeInstanceOf(Error)
  })

  it('keeps standalone provideScrapeDates compatible even when an extra private-mode option is supplied', async () => {
    const result: unknown = await Reflect.apply(provideScrapeDates, undefined, [async () => output, { deferLastSuccessDate: true }])({ preferences: { startDate: '2026-09-01' } })
    expect(result).toBe(output)
    expect(events).toEqual(['checkpoint', 'saveData'])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(acceptedResults).toEqual([])
  })

  it('corrects a future checkpoint after a successful run', async () => {
    data.set(CHECKPOINT, '2030-01-01T00:00:00.000Z')
    await adaptScrapeToMain(async () => output)({})
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(host.saveData).toHaveBeenCalledTimes(1)
    expect(acceptedResults).toEqual([{ success: true }])
  })

  it('does not undo another checkpoint write or confirmed auth when the result callback throws', async () => {
    const newerDate = '2026-10-12T13:00:00.000Z'
    const failure = new Error('MODEL_RESULT_FAILURE_AFTER_METADATA_CHANGE')
    host.setResult.mockImplementationOnce(() => { data.set(CHECKPOINT, newerDate); throw failure })
    await adaptScrapeToMain(async () => output)({})
    expect(data.get(CHECKPOINT)).toBe(newerDate)
    expect(data.get('auth')).toBe(latestAuth)
    expect(acceptedResults).toEqual([failure])
  })
})
