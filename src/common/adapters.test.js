import MockDate from 'mockdate'
import { BankMessageError, IncompatibleVersionError, InvalidLoginOrPasswordError, InvalidOtpCodeError, SubscriptionRequiredError, ZPAPIError } from '../errors'
import {
  createScrapeMain,
  convertTimestampToDate,
  fixDateTimezones,
  fixDateTimezonesForTransactionDtoV2,
  parseStartDateString,
  patchAccounts,
  patchTransactions,
  trimTransactionTransferAccountSyncIds,
  wrapPluginOperation
} from './adapters'

describe('scrape completion persistence [model]', () => {
  // Model the host commit boundary independently of provider data.
  const startedAt = '2026-01-10T12:00:00.000Z'
  const lastSuccess = '2026-01-09T12:00:00.000Z'
  const results = { accounts: [{ id: 'account', syncIds: ['1234'] }], transactions: [] }

  beforeEach(() => {
    MockDate.set(startedAt)
    global.ZenMoney = {
      manifest: { isSubscriptionRequired: false },
      getPreferences: () => ({ startDate: '2020-01-01' }),
      getData: jest.fn().mockReturnValue(lastSuccess),
      setData: jest.fn(),
      saveData: jest.fn(),
      addAccount: jest.fn(),
      addTransaction: jest.fn(),
      setResult: jest.fn(),
      features: {}
    }
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    MockDate.reset()
    jest.restoreAllMocks()
  })

  it('records the invocation start only after host data acceptance and saves before setResult', async () => {
    const events = []
    for (const name of ['addAccount', 'addTransaction', 'setData', 'saveData', 'setResult']) {
      global.ZenMoney[name].mockImplementation(() => { events.push(name) })
    }
    await createScrapeMain(async () => {
      MockDate.set('2026-01-10T12:30:00.000Z')
      return results
    })()
    expect(events).toEqual(['addAccount', 'addTransaction', 'setData', 'saveData', 'setResult'])
    expect(global.ZenMoney.setData).toHaveBeenCalledWith('scrape/lastSuccessDate', startedAt)
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith({ success: true })
  })

  it('traces the actual scrape arguments and result before host conversion', async () => {
    let actualArgs
    const raw = Object.freeze({ ...results })
    await createScrapeMain(async function scrape (args) {
      actualArgs = args
      return raw
    })({ isInBackground: true })
    expect(actualArgs).toMatchObject({ preferences: {}, isInBackground: true, fromDate: expect.any(Date), toDate: null, isFirstRun: false })
    expect(console.log).toHaveBeenCalledWith('call', 'scrape', 'with args:', actualArgs)
    expect(console.log).toHaveBeenCalledWith('scrape call resolved with', raw, '\n(0ms)')
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith({ success: true })
  })

  it.each([false, true])('saves once before a terminating setResult and never reprocesses its interruption (failure: %s)', async failure => {
    const interrupted = new Error('Host execution stopped')
    const error = new Error('Operation failed')
    global.ZenMoney.setResult.mockImplementation(() => { throw interrupted })
    await expect(createScrapeMain(async () => {
      if (failure) throw error
      return results
    })()).rejects.toBe(interrupted)
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(failure ? error : { success: true })
    expect(interrupted.message).toBe('Host execution stopped')
    expect(interrupted).not.toHaveProperty('fatal')
  })

  it('converts accounts and transactions while preserving extra result fields', async () => {
    await createScrapeMain(async () => ({ ...results, transactions: [1, 2], source: 'model' }))()
    expect(global.ZenMoney.addAccount).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.addAccount).toHaveBeenCalledWith([{ id: 'account', syncID: ['1234'] }])
    expect(global.ZenMoney.addTransaction).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.addTransaction).toHaveBeenCalledWith([1, 2])
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith({ source: 'model', success: true })
  })

  it('saves state and reports an error if recording the sync date fails', async () => {
    const error = new Error('Date update failed')
    global.ZenMoney.setData.mockImplementation(() => { throw error })
    await createScrapeMain(async () => results)()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error.message).toBe('[RUE] Date update failed')
  })

  it('presents errors from a synchronously settled thenable', async () => {
    const error = new Error('Operation failed')
    const rejected = {
      then (resolve, reject) {
        return reject(error)
      }
    }
    await createScrapeMain(() => rejected)()
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error.message).toBe('[RUE] Operation failed')
    expect(global.ZenMoney.setData).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it('rejects a non-function entry point synchronously', () => {
    expect(() => createScrapeMain(null)).toThrow('wrapPluginOperation argument should be a function')
  })

  it.each([
    [undefined, 'scrape() did not return anything'],
    [{ accounts: [] }, 'scrape should return {accounts[], transactions[]}'],
    [{ accounts: [], transactions: [] }, 'accounts must be non-empty array of objects']
  ])('reports an invalid result %p without advancing the sync date', async (result, message) => {
    await createScrapeMain(async () => result)()
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining(message) }))
    expect(global.ZenMoney.addAccount).not.toHaveBeenCalled()
    expect(global.ZenMoney.addTransaction).not.toHaveBeenCalled()
    expect(global.ZenMoney.setData).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['2010-01-01T01:01:01.000Z', null, new Date('2010-01-01T01:01:01.000Z')],
    ['2010-01-01T01:01:01.000Z', '2015-06-07T08:09:10.000Z', new Date(2015, 4, 24)],
    ['2015-06-05T01:01:01.000Z', '2015-06-07T08:09:10.000Z', new Date('2015-06-05T01:01:01.000Z')],
    ['2030-01-01T00:00:00.000Z', null, new Date(startedAt)]
  ])('prepares dates for startDate %s and last success %s', async (startDate, lastSuccess, fromDate) => {
    global.ZenMoney.getPreferences = () => ({ startDate, account: 'model' })
    global.ZenMoney.getData.mockReturnValue(lastSuccess)
    const scrape = jest.fn().mockResolvedValue(results)
    await createScrapeMain(scrape)({ isInBackground: true })
    expect(scrape).toHaveBeenCalledWith({
      preferences: { account: 'model' },
      fromDate,
      toDate: null,
      isFirstRun: lastSuccess === null,
      isInBackground: true
    })
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith({ success: true })
  })

  it.each(['scrape', 'addAccount', 'addTransaction'])('saves state without advancing the sync date after %s fails', async stage => {
    const error = new Error('Host or operation failure')
    if (stage !== 'scrape') global.ZenMoney[stage].mockImplementation(() => { throw error })
    await createScrapeMain(async () => {
      if (stage === 'scrape') throw error
      return results
    })()
    expect(global.ZenMoney.setData).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error.message).toBe('[RUE] Host or operation failure')
    if (stage !== 'scrape') {
      expect(console.log).toHaveBeenCalledWith('anonymous call resolved with', results, '\n(0ms)')
      expect(console.error).not.toHaveBeenCalled()
    }
  })

  it.each([false, true])('waits for persistence before delivering the result (failure: %s)', async failure => {
    let finishSave
    let startedSaving
    const saving = new Promise(resolve => { startedSaving = resolve })
    global.ZenMoney.saveData.mockImplementation(() => {
      startedSaving()
      return new Promise(resolve => { finishSave = resolve })
    })
    const error = new Error('Operation failed')
    const completion = createScrapeMain(async () => {
      if (failure) throw error
      return results
    })()
    await saving
    expect(global.ZenMoney.setResult).not.toHaveBeenCalled()
    finishSave()
    await completion
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(failure ? error : { success: true })
  })

  it('reports a persistence failure instead of success', async () => {
    const error = new Error('Storage unavailable')
    global.ZenMoney.saveData.mockRejectedValue(error)
    await createScrapeMain(async () => results)()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error.message).toBe('[RUE] Storage unavailable')
  })

  it.each([false, true])('preserves an insertion failure when saving also fails (async save: %s)', async asynchronous => {
    const error = new Error('Host insertion failed')
    const cause = new Error('Original cause')
    error.cause = cause
    const saveError = new Error('Storage unavailable')
    global.ZenMoney.addTransaction.mockImplementation(() => { throw error })
    global.ZenMoney.saveData.mockImplementation(() => {
      if (asynchronous) return Promise.reject(saveError)
      throw saveError
    })

    await createScrapeMain(async function scrape () { return results })()

    expect(global.ZenMoney.setResult).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error.message).toBe('[RUE] Host insertion failed')
    expect(error.cause).toBe(cause)
    expect(global.ZenMoney.setData).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('scrape call resolved with', results, '\n(0ms)')
    expect(console.error).not.toHaveBeenCalled()
    expect(saveError.message).toBe('Storage unavailable')
    expect(saveError).not.toHaveProperty('fatal')
  })
})

describe('error localization [model]', () => {
  // Model the adapter's locale selection and formatting without bank responses.
  beforeEach(() => {
    global.ZenMoney = {
      manifest: { isSubscriptionRequired: false },
      getData: jest.fn().mockReturnValue('2026-01-09T12:00:00Z'),
      getPreferences: () => ({ startDate: '2020-01-01' }),
      saveData: jest.fn(),
      setResult: jest.fn()
    }
  })

  it.each([
    ['fr', 'Identifiant ou mot de passe bancaire incorrect'],
    ['fr_FR', 'Identifiant ou mot de passe bancaire incorrect'],
    ['it', 'Nome utente o password della banca non corretti'],
    ['es', 'El usuario o la contraseña del banco son incorrectos'],
    ['es_AR', 'Nombre de usuario o contraseña del banco incorrectos'],
    ['es-AR', 'Nombre de usuario o contraseña del banco incorrectos'],
    ['pt', 'Login ou palavra-passe do banco incorretos'],
    ['pt_BR', 'Login ou senha do banco incorreta'],
    ['pt-BR', 'Login ou senha do banco incorreta'],
    ['ja', 'Incorrect bank login or password'],
    [undefined, 'Неверный логин или пароль от банка']
  ])('localizes credential errors for %s', async (locale, message) => {
    global.ZenMoney.locale = locale
    const error = new InvalidLoginOrPasswordError()

    await createScrapeMain(async () => { throw error })()

    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error).toMatchObject({ message, fatal: true, allowRetry: true })
  })

  it('falls back from a missing regional translation to the base language', async () => {
    global.ZenMoney.locale = 'es_AR'
    const error = new InvalidOtpCodeError()

    await createScrapeMain(async () => { throw error })()

    expect(error.message).toBe('El código no es correcto. Inténtalo de nuevo: pulsa «Conectar» e introduce un código nuevo.')
  })

  it('interpolates bank messages with line breaks and clean French spacing', async () => {
    global.ZenMoney.locale = 'fr'
    const bankMessage = 'Confirm access in the bank app.'
    const error = new BankMessageError(bankMessage)

    await createScrapeMain(async () => { throw error })()

    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error.message).toBe(`Une erreur s’est produite lors de la synchronisation bancaire.\n\nMessage de la banque : ${bankMessage}`)
    expect(error.bankMessage).toBe(bankMessage)
  })

  it('uses the updated app version instructions', async () => {
    global.ZenMoney.locale = 'ru'
    const error = new IncompatibleVersionError()

    await createScrapeMain(async () => { throw error })()

    expect(error.message).toBe('Проверьте в сторе, стоит ли у вас последняя версия приложения:\n— Если есть новая версия, поставьте её (нажмите «Обновить»).\n— Если новой версии пока нет — ничего делать не нужно, просто дождитесь ближайшего обновления.')
  })

  it('preserves an explicit plugin-authored message', async () => {
    global.ZenMoney.locale = 'fr'
    const message = 'Vérifiez votre identifiant bancaire.'
    const error = new InvalidLoginOrPasswordError(message)

    await createScrapeMain(async () => { throw error })()

    expect(error.message).toBe(message)
  })
})

describe('shared plugin operation wrapper [model]', () => {
  // Model runtime policy independently of a provider and its responses.
  beforeEach(() => {
    MockDate.set('2026-01-10T12:00:00Z')
    global.ZenMoney = {
      manifest: { isSubscriptionRequired: false },
      locale: 'en',
      getData: jest.fn(),
      getPreferences: () => ({ startDate: '2020-01-01' }),
      saveData: jest.fn(),
      setResult: jest.fn()
    }
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    MockDate.reset()
    jest.restoreAllMocks()
  })

  it('preserves successful values, arguments and receiver without reading scrape state', async () => {
    const args = { code: 'receipt-reference' }
    const receiver = { result: { status: 'notFound' } }
    const operation = wrapPluginOperation(function fetchReceipt (actualArgs) {
      expect(actualArgs).toBe(args)
      return this.result
    })
    await expect(operation.call(receiver, args)).resolves.toBe(receiver.result)
    expect(global.ZenMoney.getData).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith('call', 'fetchReceipt', 'with args:', args)
    expect(console.log).toHaveBeenCalledWith('fetchReceipt call returned result:', receiver.result, '\n(0ms)')
  })

  it.each([false, true])('presents and logs original errors once (async: %s)', async asynchronous => {
    const error = new Error('Operation failed')
    const logged = []
    console.error.mockImplementation((event, failure, elapsed) => {
      logged.push({ event, failure, message: failure.message, fatal: failure.fatal, elapsed })
    })
    const operation = wrapPluginOperation(function fetchReceipt () {
      if (asynchronous) return Promise.reject(error)
      throw error
    })
    await expect(operation()).rejects.toBe(error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toMatchObject({ message: '[RUE] Operation failed', fatal: false, allowRetry: false, allow_retry: false })
    expect(Object.keys(error)).toContain('message')
    expect(String(error)).toBe('__ [RUE] Operation failed')
    expect(logged).toEqual([{
      event: asynchronous ? 'fetchReceipt call rejected with' : 'fetchReceipt call threw',
      failure: error,
      message: 'Operation failed',
      fatal: undefined,
      elapsed: '\n(0ms)'
    }])
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it('logs target output before adapting it and saves the final state once', async () => {
    const events = []
    const args = { code: 'receipt-reference' }
    const raw = { status: 'notFound' }
    const adapted = { success: true }
    console.log.mockImplementation((event) => { events.push(event) })
    global.ZenMoney.saveData.mockImplementation(() => { events.push('save') })
    const operation = wrapPluginOperation(async function fetchReceipt (actualArgs) {
      expect(actualArgs).toBe(args)
      events.push('operation')
      return raw
    }, {
      adapt: fn => async actualArgs => {
        expect(await fn(actualArgs)).toBe(raw)
        events.push('adapt')
        return adapted
      }
    })
    await expect(operation(args)).resolves.toBe(adapted)
    expect(events).toEqual(['call', 'operation', 'fetchReceipt call resolved with', 'adapt', 'save'])
    expect(console.log).toHaveBeenCalledWith('fetchReceipt call resolved with', raw, '\n(0ms)')
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it.each([null, undefined, false, 0])('preserves and logs a synchronous %p result', async result => {
    await expect(wrapPluginOperation(function operation () { return result })()).resolves.toBe(result)
    expect(console.log).toHaveBeenCalledWith('operation call returned result:', result, '\n(0ms)')
    expect(console.error).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it('does not misreport a persistence failure as a failure of the target function', async () => {
    const raw = { status: 'notFound' }
    const error = new Error('Storage unavailable')
    global.ZenMoney.saveData.mockRejectedValue(error)
    await expect(wrapPluginOperation(async function operation () { return raw })()).rejects.toBe(error)
    expect(console.log).toHaveBeenCalledWith('operation call resolved with', raw, '\n(0ms)')
    expect(console.error).not.toHaveBeenCalled()
    expect(error.message).toBe('[RUE] Storage unavailable')
  })

  it('preserves the operation error and its presentation policy when saving also fails', async () => {
    const error = new InvalidOtpCodeError()
    const saveError = new Error('Storage unavailable')
    global.ZenMoney.saveData.mockRejectedValue(saveError)

    await expect(wrapPluginOperation(async function fetchReceipt () { throw error })()).rejects.toBe(error)

    expect(error).toMatchObject({
      message: 'The code is incorrect. Try again — tap "Connect" and enter a new code.',
      fatal: false,
      allowRetry: true,
      allow_retry: true
    })
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith('fetchReceipt call rejected with', error, '\n(0ms)')
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).not.toHaveBeenCalled()
  })

  it.each([null, undefined])('preserves a thrown %p when saving also fails', async value => {
    const saveError = new Error('Storage unavailable')
    global.ZenMoney.saveData.mockRejectedValue(saveError)

    await expect(wrapPluginOperation(async () => { throw value })()).rejects.toMatchObject({
      message: '[RUE] Thrown error must be an object containing message field, but was: ' + JSON.stringify(value)
    })

    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith('anonymous call rejected with', value, '\n(0ms)')
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
  })

  it('defaults to a non-first run even when invocation arguments claim otherwise', async () => {
    const error = new InvalidOtpCodeError()
    await expect(wrapPluginOperation(() => { throw error })({ isFirstRun: true })).rejects.toBe(error)
    expect(error).toMatchObject({
      message: 'The code is incorrect. Try again — tap "Connect" and enter a new code.',
      fatal: false,
      allowRetry: true,
      allow_retry: true
    })
    expect(global.ZenMoney.getData).not.toHaveBeenCalled()
  })

  it.each([null, '2026-01-09T12:00:00Z'])('retains scrape first-run policy for last success %s', async lastSuccess => {
    global.ZenMoney.getData.mockReturnValue(lastSuccess)
    const error = new TemporaryError('Try again')
    await createScrapeMain(async function scrape () { throw error })()
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error).toMatchObject({ message: 'Try again', fatal: lastSuccess === null, allowRetry: true, allow_retry: true })
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['ordinary', () => new Error('Operation failed'), '[RUE] Operation failed', false],
    ['OTP', () => new InvalidOtpCodeError(), 'The code is incorrect. Try again — tap "Connect" and enter a new code.', true]
  ])('delivers a prepared %s error without mutating it again', async (kind, createError, message, allowRetry) => {
    // Make the presented error read-only at host delivery to detect any later preparation.
    global.ZenMoney.getData.mockReturnValue('2026-01-09T12:00:00Z')
    let presented = false
    const error = new Proxy(createError(), {
      set (target, key, value) {
        if (presented) throw new Error('Presented error must remain unchanged')
        return Reflect.set(target, key, value)
      }
    })
    global.ZenMoney.setResult.mockImplementation(() => { presented = true })
    await createScrapeMain(async function scrape () { throw error })()
    expect(presented).toBe(true)
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledWith(error)
    expect(error).toMatchObject({ message, fatal: false, allowRetry, allow_retry: allowRetry })
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it.each([null, undefined])('presents a thrown %p on a first run without a second error boundary', async value => {
    await createScrapeMain(async function scrape () { throw value })()
    const error = global.ZenMoney.setResult.mock.calls[0][0]
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ZPAPIError)
    expect(error).toMatchObject({
      message: '[RUE] Thrown error must be an object containing message field, but was: ' + JSON.stringify(value),
      fatal: false,
      allowRetry: false,
      allow_retry: false
    })
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(global.ZenMoney.setResult).toHaveBeenCalledTimes(1)
  })

  it.each([
    [undefined, IncompatibleVersionError],
    [{ subscription: { endDate: Date.parse('2026-01-10T11:59:59Z') } }, SubscriptionRequiredError]
  ])('presents subscription rejection before running the operation for user %p', async (user, ErrorClass) => {
    global.ZenMoney.manifest.isSubscriptionRequired = true
    global.ZenMoney.user = user
    const operation = jest.fn()
    const result = wrapPluginOperation(operation)()
    await expect(result).rejects.toBeInstanceOf(ErrorClass)
    await expect(result).rejects.toMatchObject({ fatal: false, allowRetry: true, allow_retry: true })
    expect(operation).not.toHaveBeenCalled()
    expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    expect(console.log).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('runs a subscription-required operation with an active subscription', async () => {
    global.ZenMoney.manifest.isSubscriptionRequired = true
    global.ZenMoney.user = { subscription: { endDate: Date.parse('2026-01-10T12:00:01Z') } }
    const operation = jest.fn().mockResolvedValue({ status: 'notFound' })
    await expect(wrapPluginOperation(operation)()).resolves.toEqual({ status: 'notFound' })
    expect(operation).toHaveBeenCalledTimes(1)
  })
})

describe('convertTimestampToDate', () => {
  it('should handle s timestamps', () => {
    expect(convertTimestampToDate(0)).toEqual(new Date('1970-01-01T00:00:00.000Z'))
    expect(convertTimestampToDate(9999999999)).toEqual(new Date('2286-11-20T17:46:39.000Z'))
  })
  it('should handle ms timestamps', () => {
    expect(convertTimestampToDate(10000000000)).toEqual(new Date('1970-04-26T17:46:40.000Z'))
    expect(convertTimestampToDate(1505700000000)).toEqual(new Date('2017-09-18T02:00:00.000Z'))
  })
})

describe('postProcessTransactions', () => {
  const withTimezoneOffset = (offsetInHours, fn) => {
    const original = Date.prototype.getTimezoneOffset
    let result
    try {
      // eslint-disable-next-line no-extend-native
      Date.prototype.getTimezoneOffset = () => offsetInHours * 60
      result = fn()
    } finally {
      // eslint-disable-next-line no-extend-native
      Date.prototype.getTimezoneOffset = original
    }
    return result
  }
  const processDate = (date) => fixDateTimezones({ date }).date
  const assertIsUntouched = (date) => expect(processDate(date)).toBe(date)

  it('should fix dates if dateProcessing feature is not implemented', () => {
    global.ZenMoney = { features: {} }

    assertIsUntouched('2010-01-01')
    assertIsUntouched('2010-01-01')
    assertIsUntouched(null)
    assertIsUntouched(undefined)

    const expectedDate = new Date('2010-01-01T00:00:00Z')
    withTimezoneOffset(-5, () => expect(processDate(new Date('2010-01-01T00:00:00+05:00'))).toEqual(expectedDate))
    withTimezoneOffset(-5, () => expect(processDate(new Date('2010-01-01T00:00:00+05:00').valueOf())).toEqual(expectedDate))
    withTimezoneOffset(0, () => expect(processDate(new Date('2010-01-01T00:00:00Z'))).toEqual(expectedDate))
    withTimezoneOffset(0, () => expect(processDate(new Date('2010-01-01T00:00:00Z').valueOf())).toEqual(expectedDate))
    withTimezoneOffset(5, () => expect(processDate(new Date('2010-01-01T00:00:00-05:00'))).toEqual(expectedDate))
    withTimezoneOffset(5, () => expect(processDate(new Date('2010-01-01T00:00:00-05:00').valueOf())).toEqual(expectedDate))

    global.ZenMoney = { features: { dateProcessing: true } }
    withTimezoneOffset(-5, () => assertIsUntouched(new Date('2010-01-01T00:00:00+05:00')))
    withTimezoneOffset(-5, () => assertIsUntouched(new Date('2010-01-01T00:00:00+05:00').valueOf()))
  })
})

test('parseStartDateString handles user input format', () => {
  const firstOfMay = new Date(2018, 4, 1, 0, 0, 0)
  expect(parseStartDateString('01.05.2018')).toEqual(firstOfMay)
  expect(parseStartDateString('1.5.2018')).toEqual(firstOfMay)
  expect(parseStartDateString('01.05.18')).toEqual(firstOfMay)
  expect(parseStartDateString('1.5.18')).toEqual(firstOfMay)
  expect(parseStartDateString('2018-05-01')).toEqual(firstOfMay)
})

afterEach(() => {
  delete global.ZenMoney
})

describe('test suite', () => {
  it('can spoil globals', () => {
    global.ZenMoney = {}
  })

  it('should clean up globals', () => {
    expect(global).not.toHaveProperty('ZenMoney')
  })
})

describe('fixDateTimezonesForTransactionDtoV2', () => {
  it('changes 23:00:00+02:00 to next midnight if current time zone is +02:00', () => {
    expect(fixDateTimezonesForTransactionDtoV2({
      date: Object.assign(new Date('2020-02-03T00:00:00+03:00'), {
        getHours: () => 23,
        getTimezoneOffset: () => -120
      })
    })).toEqual({
      date: new Date('2020-02-03T00:00:00+02:00')
    })
  })

  it('preserves time zone otherwise', () => {
    expect(fixDateTimezonesForTransactionDtoV2({
      date: Object.assign(new Date('2020-02-03T01:00:00+03:00'), {
        getHours: () => 0,
        getTimezoneOffset: () => -120
      })
    })).toEqual({
      date: new Date('2020-02-03T01:00:00+03:00')
    })

    expect(fixDateTimezonesForTransactionDtoV2({
      date: Object.assign(new Date('2020-02-03T00:00:00+03:00'), {
        getHours: () => 22,
        getTimezoneOffset: () => -60
      })
    })).toEqual({
      date: new Date('2020-02-03T00:00:00+03:00')
    })
  })
})

describe('trimTransactionTransferAccountSyncIds', () => {
  it('trims movement account syncIds', () => {
    expect(trimTransactionTransferAccountSyncIds({
      movements: [
        {
          id: '1',
          account: {
            id: 'account'
          }
        },
        {
          id: '2',
          account: {
            syncIds: ['123456']
          }
        }
      ]
    })).toEqual({
      movements: [
        {
          id: '1',
          account: {
            id: 'account'
          }
        },
        {
          id: '2',
          account: {
            syncIds: ['3456']
          }
        }
      ]
    })
  })
})

describe('patchAccounts', () => {
  it('should adjust account balance', () => {
    global.ZenMoney = { features: {} }
    expect(patchAccounts([
      {
        id: '1',
        type: 'checking',
        title: 'Account',
        instrument: 'XAU',
        syncIds: ['1111'],
        balance: 1
      },
      {
        id: '2',
        type: 'card',
        title: 'Card',
        instrument: 'RUB',
        syncIds: ['2222'],
        balance: 1
      },
      {
        id: '3',
        type: 'deposit',
        title: 'Deposit',
        instrument: 'BTC',
        syncIds: ['3333'],
        available: 0.0004289
      }
    ])).toEqual([
      {
        id: '1',
        type: 'checking',
        title: 'Account',
        instrument: 'A98',
        syncID: ['1111'],
        balance: 31.1034768
      },
      {
        id: '2',
        type: 'card',
        title: 'Card',
        instrument: 'RUB',
        syncID: ['2222'],
        balance: 1
      },
      {
        id: '3',
        type: 'deposit',
        title: 'Deposit',
        instrument: 'BTC',
        syncID: ['3333'],
        available: 0.0004289 * 1000000
      }
    ])
  })
  it.each([
    [
      {
        id: '123456',
        type: 'card',
        title: 'Безымянная*1111',
        instrument: 'BYN',
        balance: NaN,
        creditLimit: NaN,
        syncID: ['1111']
      },
      'balance should be a number, got NaN'
    ],
    [
      {
        id: '123456',
        type: 'card',
        title: 'Безымянная*1111',
        instrument: 'BYN',
        balance: 1200,
        creditLimit: NaN,
        syncID: ['1111']
      },
      'creditLimit should be a number, got NaN'
    ],
    [
      {
        id: '123456',
        type: 'card',
        title: 'Безымянная*1111',
        instrument: 'BYN',
        balance: 1200,
        creditLimit: 1200,
        available: NaN,
        syncID: ['1111']
      },
      'available should be a number, got NaN'
    ],
    [
      {
        id: '123456',
        type: 'card',
        title: 'Безымянная*1111',
        instrument: 'BYN',
        balance: 1200,
        startBalance: NaN,
        syncID: ['1111']
      },
      'startBalance should be a number, got NaN'
    ]
  ])('should throw error if any of values is NaN', (account, message) => {
    global.ZenMoney = { features: {} }
    expect(() => {
      patchAccounts([account])
    }).toThrow(message)
  })
})

describe('patchTransactions', () => {
  const accounts = [
    {
      id: '1',
      type: 'checking',
      title: 'Account',
      instrument: 'XAU',
      syncIds: ['1111'],
      balance: 1
    },
    {
      id: '2',
      type: 'card',
      title: 'Card',
      instrument: 'RUB',
      syncIds: ['2222'],
      balance: 1
    },
    {
      id: '3',
      type: 'deposit',
      title: 'Deposit',
      instrument: 'BTC',
      syncIds: ['3333'],
      available: 0.0004289
    }
  ]
  it('should adjust transaction amount', () => {
    global.ZenMoney = { features: { transactionDtoV2: true } }
    expect(patchTransactions([
      {
        hold: true,
        date: new Date('2022-08-30'),
        movements: [
          {
            id: '1',
            account: { id: '1' },
            invoice: null,
            sum: -1,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2022-08-28'),
        movements: [
          {
            id: '2',
            account: { id: '2' },
            invoice: { sum: -3, instrument: 'XPT' },
            sum: -1,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2022-08-28'),
        income: 3,
        incomeAccount: '2',
        outcome: 4,
        outcomeAccount: 'cash#XAU',
        merchant: null,
        comment: null
      }
    ], accounts)).toEqual([
      {
        hold: true,
        date: new Date('2022-08-30'),
        movements: [
          {
            id: '1',
            account: { id: '1' },
            invoice: null,
            sum: -1 * 31.1034768,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2022-08-28'),
        movements: [
          {
            id: '2',
            account: { id: '2' },
            invoice: { sum: -3 * 31.1034768, instrument: 'A76' },
            sum: -1,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      },
      {
        hold: false,
        date: new Date('2022-08-28'),
        income: 3,
        incomeAccount: '2',
        outcome: 4 * 31.1034768,
        outcomeAccount: 'cash#A98',
        merchant: null,
        comment: null
      }
    ])
  })
  it.each([
    [
      {
        hold: false,
        date: new Date('2022-08-28'),
        movements: [
          {
            id: '2',
            account: { id: '2' },
            invoice: { sum: -3, instrument: 'XPT' },
            sum: NaN,
            fee: 0
          }
        ],
        merchant: null,
        comment: null
      },
      'outcome should be a number, got NaN'
    ],
    [
      {
        hold: false,
        date: new Date('2022-08-28'),
        movements: [
          {
            id: '2',
            account: { id: '2' },
            invoice: { sum: -3, instrument: 'XPT' },
            sum: -1,
            fee: NaN
          }
        ],
        merchant: null,
        comment: null
      },
      'outcome should be a number, got NaN'
    ]
  ])('should throw error if any of values is NaN', (transaction, message) => {
    global.ZenMoney = { features: {} }
    expect(() => {
      patchTransactions([transaction], accounts)
    }).toThrow(message)
  })
})
