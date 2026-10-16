export {}

interface AdapterApi {
  adaptScrapeToMain: (scrape: (args: Record<string, unknown>) => Promise<unknown>) => (args: Record<string, unknown>) => Promise<unknown>
  provideScrapeDates: (scrape: (args: Record<string, unknown>) => Promise<unknown>) => (args: Record<string, unknown>) => Promise<unknown>
}

const { adaptScrapeToMain, provideScrapeDates } = jest.requireActual<AdapterApi>('../adapters')
const { UserInteractionError } = jest.requireActual<typeof import('../../errors')>('../../errors')
const originalHost = global.ZenMoney
const CHECKPOINT = 'scrape/lastSuccessDate'
const PREVIOUS = '2026-09-10T12:00:00.000Z'
const STARTED = '2026-10-12T12:00:00.000Z'
const latestAuth = { token: 'MODEL_CONFIRMED_AUTH' }
const account = { id: 'model-account', type: 'checking', title: 'Model', instrument: 'USD', balance: 0, syncIds: ['MODEL-ACCOUNT'] }
const output = { accounts: [account], transactions: [] }

// [model] SDK/domain publication and checkpoint ordering, not bank payloads or native rollback.
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
    // A partial native boundary; undocumented saveData return values must be ignored.
    global.ZenMoney = host as unknown as typeof ZenMoney
  })

  afterEach(() => {
    const timers = jest.getTimerCount()
    global.ZenMoney = originalHost
    jest.useRealTimers()
    jest.restoreAllMocks()
    expect(timers).toBe(0)
  })

  it('validates both collections and calls native publication before saving the successful checkpoint', async () => {
    await adaptScrapeToMain(async () => output)({})
    expect(events).toEqual(['addAccount', 'addTransaction', 'checkpoint', 'saveData', 'setResult'])
    expect(acceptedResults).toEqual([{ success: true }])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it.each(['addAccount', 'addTransaction', 'saveData', 'setResult'] as const)('preserves checkpoint/auth and original error when %s throws', async method => {
    const failure = new Error('MODEL_PUBLICATION_FAILURE')
    host[method].mockImplementationOnce(() => { throw failure })
    await adaptScrapeToMain(async () => output)({})
    expect(acceptedResults).toEqual([failure])
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it('does not inspect an undocumented return value from the public void saveData API', async () => {
    const result = Object.defineProperty({}, 'then', { get: () => { throw new Error('MODEL_RETURN_MUST_NOT_BE_READ') } })
    host.saveData.mockReturnValueOnce(result)
    await adaptScrapeToMain(async () => output)({})
    expect(acceptedResults).toEqual([{ success: true }])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it.each([false, true])('contains a failed error result callback without an unhandled rejection (after success attempt: %s)', async afterSuccess => {
    const failure = new Error('MODEL_RESULT_CALLBACK_FAILURE')
    host.setResult.mockImplementation(() => { throw failure })
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
    expect(data.get('auth')).toBe(latestAuth)
  })

  it.each(['non-configurable', 'circular'])('reports a generic failure when error presentation fails for a %s error model', async kind => {
    let failure: unknown
    if (kind === 'non-configurable') failure = Object.defineProperty({}, 'message', { value: 'MODEL_LOCKED_ERROR', configurable: false, writable: false })
    else {
      const circular: { self?: unknown } = {}
      circular.self = circular
      failure = circular
    }
    await expect(adaptScrapeToMain(async () => { throw failure })({})).resolves.toBeUndefined()
    expect(host.setResult).toHaveBeenCalledTimes(1)
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] Error presentation failed' })
    expect(console.warn).toHaveBeenCalledWith('Error presentation failed; sending generic failure', { errorType: 'object' })
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it.each([false, true])('retains the diagnostic and stack of a non-extensible ordinary Error (sealed: %s)', async sealed => {
    const original = new Error('MODEL_IMMUTABLE_ERROR')
    const failure = sealed ? Object.seal(original) : Object.freeze(original)
    await adaptScrapeToMain(async () => await Promise.reject(failure))({})
    expect(host.setResult).toHaveBeenCalledTimes(1)
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] MODEL_IMMUTABLE_ERROR', stack: original.stack, fatal: false, allowRetry: false })
    expect(Object.keys(acceptedResults[0] as object)).not.toContain('stack')
    expect(console.warn).not.toHaveBeenCalled()
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it('preserves an immutable Error with an inherited getter-only message', async () => {
    class ReadOnlyMessageError extends Error {}
    Object.defineProperty(ReadOnlyMessageError.prototype, 'message', { get: () => 'MODEL_READ_ONLY_MESSAGE' })
    const failure = Object.freeze(new ReadOnlyMessageError())
    await adaptScrapeToMain(async () => await Promise.reject(failure))({})
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] MODEL_READ_ONLY_MESSAGE', stack: failure.stack })
    expect(Object.keys(acceptedResults[0] as object)).not.toContain('stack')
    expect(console.warn).not.toHaveBeenCalled()
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it('uses an enum-only Error discriminator for a cross-realm presentation failure', async () => {
    const { runInNewContext } = jest.requireActual<typeof import('vm')>('vm')
    const failure: unknown = runInNewContext("Object.freeze(Object.defineProperty(new Error(), 'message', { get () { throw new Error('MODEL_PRIVATE_VALUE') } }))")
    await adaptScrapeToMain(async () => await Promise.reject(failure))({})
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] Error presentation failed' })
    expect(console.warn).toHaveBeenCalledWith('Error presentation failed; sending generic failure', { errorType: 'Error' })
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
  })

  it('sends a preformatted failure even when host locale access itself throws', async () => {
    Object.defineProperty(host, 'locale', { get: () => { throw new Error('MODEL_LOCALE_ACCESS_FAILURE') } })
    await expect(adaptScrapeToMain(async () => { throw new Error('MODEL_SCRAPE_FAILURE') })({})).resolves.toBeUndefined()
    expect(host.setResult).toHaveBeenCalledTimes(1)
    expect(acceptedResults[0]).toMatchObject({ message: '[RUE] Error presentation failed', fatal: false, allowRetry: false, allow_retry: false })
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it.each([false, true])('preserves the control code and retry flags of a non-extensible built-in interaction error (sealed: %s)', async sealed => {
    const failure = sealed ? Object.seal(new UserInteractionError()) : Object.freeze(new UserInteractionError())
    await adaptScrapeToMain(async () => await Promise.reject(failure))({})
    expect(host.setResult).toHaveBeenCalledTimes(1)
    expect(acceptedResults[0]).toMatchObject({ message: '[INU]', fatal: false, allowRetry: true, allow_retry: true })
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it('retains the original persistence error if checkpoint restoration also fails', async () => {
    const failure = new Error('MODEL_PRIMARY_SAVE_FAILURE')
    host.saveData.mockImplementation(() => { throw failure })
    await adaptScrapeToMain(async () => output)({})
    expect(acceptedResults).toEqual([failure])
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(console.warn).toHaveBeenCalledWith('History checkpoint restoration failed after publication error')
  })

  it('does not wait for an undocumented saveData thenable to finish before publishing the result', async () => {
    host.saveData.mockReturnValueOnce({ then: () => {} })
    const running = adaptScrapeToMain(async () => output)({})
    for (let i = 0; i < 12; i++) await Promise.resolve()
    jest.advanceTimersByTime(15000)
    await running
    expect(acceptedResults).toEqual([{ success: true }])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(data.get('auth')).toBe(latestAuth)
  })

  it('restores the absent checkpoint without making a failed first run successful', async () => {
    data.delete(CHECKPOINT)
    host.saveData.mockImplementationOnce(() => { throw new Error('MODEL_FIRST_SAVE_FAILURE') })
    await adaptScrapeToMain(async () => output)({})
    expect(data.get(CHECKPOINT)).toBeNull()
    expect(acceptedResults[0]).toBeInstanceOf(Error)
  })

  it.each([null, {}, { accounts: [], transactions: [] }, { accounts: [account], transactions: null }])('does not advance a checkpoint or publish malformed SDK results %#', async malformed => {
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
    const malformed = { accounts: [account], transactions: [null] }
    await adaptScrapeToMain(async () => malformed)({})
    expect(host.addAccount).not.toHaveBeenCalled()
    expect(host.addTransaction).not.toHaveBeenCalled()
    expect(data.get(CHECKPOINT)).toBe(PREVIOUS)
    expect(acceptedResults[0]).toBeInstanceOf(Error)
  })

  it('keeps standalone provideScrapeDates persistence compatible with legacy callers', async () => {
    await provideScrapeDates(async () => undefined)({ preferences: { startDate: '2026-09-01' } })
    expect(events).toEqual(['checkpoint', 'saveData'])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(acceptedResults).toEqual([])
  })

  it('keeps the public date adapter legacy even when an extra private-mode option is supplied', async () => {
    const result: unknown = await Reflect.apply(provideScrapeDates, undefined, [async () => output, { deferLastSuccessDate: true }])({ preferences: { startDate: '2026-09-01' } })
    expect(result).toBe(output)
    expect(events).toEqual(['checkpoint', 'saveData'])
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(acceptedResults).toEqual([])
  })

  it('corrects a future stored checkpoint after a successful run', async () => {
    data.set(CHECKPOINT, '2030-01-01T00:00:00.000Z')
    await adaptScrapeToMain(async () => output)({})
    expect(data.get(CHECKPOINT)).toBe(STARTED)
    expect(host.saveData).toHaveBeenCalledTimes(1)
    expect(acceptedResults).toEqual([{ success: true }])
  })

  it('does not undo a changed checkpoint value or confirmed auth when the result callback throws', async () => {
    const newerDate = '2026-10-12T13:00:00.000Z'
    const failure = new Error('MODEL_RESULT_FAILURE_AFTER_METADATA_CHANGE')
    host.setResult.mockImplementationOnce(() => {
      data.set(CHECKPOINT, newerDate)
      throw failure
    })
    await adaptScrapeToMain(async () => output)({})
    expect(data.get(CHECKPOINT)).toBe(newerDate)
    expect(data.get('auth')).toBe(latestAuth)
    expect(acceptedResults).toEqual([failure])
  })
})
