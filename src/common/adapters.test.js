import _ from 'lodash'
import { adaptScrapeToGlobalApi, convertTimestampToDate, fixDateTimezones, parseStartDateString, provideScrapeDates } from './adapters'

describe('adaptScrapeToGlobalApi', () => {
  it('should call addAccount, addTransaction, setResult', () => {
    const setResultCalled = new Promise((resolve) => {
      global.ZenMoney = {
        getPreferences: () => ({ key: 'value' }),
        addAccount: jest.fn(),
        addTransaction: jest.fn(),
        setResult: resolve,
        features: {}
      }
      const main = adaptScrapeToGlobalApi(async (args) => {
        expect(args).toEqual({ preferences: { key: 'value' } })
        return ({ accounts: ['account'], transactions: [1, 2] })
      })
      main()
    })
    return expect(setResultCalled).resolves.toEqual({ success: true }).then(x => {
      expect(global.ZenMoney.addAccount).toHaveBeenCalledTimes(1)
      expect(global.ZenMoney.addAccount).toHaveBeenCalledWith(['account'])
      expect(global.ZenMoney.addTransaction).toHaveBeenCalledTimes(1)
      expect(global.ZenMoney.addTransaction).toHaveBeenCalledWith([1, 2])
    })
  })

  it('should fallback to setResult(error) when error thrown in async promise context', () => {
    const testError = new Error('test error')
    return expect(new Promise((resolve) => {
      global.ZenMoney = {
        getPreferences: jest.fn(),
        setResult: resolve
      }
      const main = adaptScrapeToGlobalApi(async () => {
        throw testError
      })
      main()
    })).resolves.toBe(testError)
  })

  it('should throw out errors thrown inside sync promise', () => {
    global.ZenMoney = {
      getPreferences: jest.fn(),
      setResult: () => {
        throw new Error('setResult should not be called in sync promise context')
      }
    }
    const error = new Error('test error')
    const main = adaptScrapeToGlobalApi(() => {
      return {
        then (resolveHandler, rejectionHandler) {
          console.assert(resolveHandler)
          console.assert(!rejectionHandler)
          return {
            then (resolveHandler, rejectionHandler) {
              console.assert(resolveHandler)
              console.assert(rejectionHandler)
              rejectionHandler(error)
            }
          }
        }
      }
    })
    return expect(() => main()).toThrow(error)
  })

  it('should handle invalid usages synchronously', () => {
    global.ZenMoney = {
      getPreferences: jest.fn()
    }
    expect(() => adaptScrapeToGlobalApi(null)).toThrow('argument must be function')
    expect(() => adaptScrapeToGlobalApi(_.noop)()).toThrow('scrape() did not return a promise')
  })

  it('should check promise returns anything', () => {
    return expect(new Promise((resolve) => {
      global.ZenMoney = {
        getPreferences: jest.fn(),
        setResult: resolve
      }
      adaptScrapeToGlobalApi(() => Promise.resolve())()
    })).resolves.toMatchObject({ message: '[RUE] scrape() did not return anything' })
  })

  it('should wrap runtime error with [RUE] prefix', () => {
    return expect(new Promise((resolve, reject) => {
      global.ZenMoney = {
        getPreferences: jest.fn(),
        setResult: err => {
          if (err.success) {
            resolve()
          } else {
            reject(err)
          }
        }
      }
      const main = adaptScrapeToGlobalApi(async () => {
        throw new Error('runtime error message')
      })
      main()
    })).rejects.toThrow('[RUE] runtime error message')
  })

  it('should pass ZPAPIError as it is', async () => {
    const expectedError = new TemporaryError('temporary error message')
    const expectedErrorData = _.pick(expectedError, ['message', 'allowRetry', 'fatal'])
    const promise = expect(new Promise((resolve, reject) => {
      global.ZenMoney = {
        getPreferences: jest.fn(),
        setResult: err => {
          if (err.success) {
            resolve()
          } else {
            reject(err)
          }
        }
      }
      const main = adaptScrapeToGlobalApi(async () => {
        throw expectedError
      })
      main()
    }))
    await promise.rejects.toBe(expectedError)
    await promise.rejects.toMatchObject(expectedErrorData)
  })
})

describe('provideScrapeDates', () => {
  it('should provide scrape dates from startDate pref', () => {
    const startDate = '2010-01-01T01:01:01.000Z'
    global.ZenMoney = {
      getData: jest.fn(),
      setData: jest.fn(),
      saveData: jest.fn()
    }

    const scrape = jest.fn().mockReturnValueOnce(Promise.resolve())
    const scrapeWithProvidedDates = provideScrapeDates(scrape)

    scrapeWithProvidedDates({ preferences: { startDate } })
    expect(scrape).toHaveBeenCalledWith({ preferences: {}, fromDate: new Date(startDate), toDate: null, isFirstRun: true })
  })

  it('should provide scrape fromDate equal to lastSuccessDate minus 1 week', () => {
    const lastSuccessDate = '2015-06-07T08:09:10.000Z'
    const expectedFromDate = '2015-05-31T08:09:10.000Z'
    const startDate = '2010-01-01T01:01:01.000Z'
    global.ZenMoney = {
      getData: jest.fn().mockReturnValue(lastSuccessDate),
      setData: jest.fn(),
      saveData: jest.fn()
    }

    const scrape = jest.fn().mockReturnValueOnce(Promise.resolve())
    const scrapeWithProvidedDates = provideScrapeDates(scrape)
    scrapeWithProvidedDates({ preferences: { startDate } })
    expect(scrape).toHaveBeenCalledWith({ preferences: {}, fromDate: new Date(expectedFromDate), toDate: null, isFirstRun: false })
  })

  it('should provide scrape fromDate equal to startDate if lastSuccessDate minus 1 week is less than it', () => {
    const lastSuccessDate = '2015-06-07T08:09:10.000Z'
    const startDate = '2015-06-05T01:01:01.000Z'
    global.ZenMoney = {
      getData: jest.fn().mockReturnValue(lastSuccessDate),
      setData: jest.fn(),
      saveData: jest.fn()
    }

    const scrape = jest.fn().mockReturnValueOnce(Promise.resolve())
    const scrapeWithProvidedDates = provideScrapeDates(scrape)
    scrapeWithProvidedDates({ preferences: { startDate } })
    expect(scrape).toHaveBeenCalledWith({ preferences: {}, fromDate: new Date(startDate), toDate: null, isFirstRun: false })
  })

  it('should save last success date on success', () => {
    const startDate = '2010-01-01T01:01:01.000Z'
    global.ZenMoney = {
      getData: jest.fn(),
      setData: jest.fn(),
      saveData: jest.fn()
    }
    const scrape = jest.fn().mockReturnValueOnce(Promise.resolve())
    const scrapeWithProvidedDates = provideScrapeDates(scrape)
    return scrapeWithProvidedDates({ preferences: { startDate } }).then(() => {
      expect(global.ZenMoney.setData).toHaveBeenCalledWith('scrape/lastSuccessDate', expect.any(String))
      expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(1)
    })
  })

  it('should not save last success date on failure', () => {
    const startDate = '2010-01-01T01:01:01.000Z'
    global.ZenMoney = {
      getData: jest.fn(),
      setData: jest.fn(),
      saveData: jest.fn()
    }

    const scrape = jest.fn().mockReturnValueOnce(Promise.reject(new Error()))
    const scrapeWithProvidedDates = provideScrapeDates(scrape)
    return scrapeWithProvidedDates({ preferences: { startDate } }).catch(() => {
      expect(global.ZenMoney.setData).toHaveBeenCalledTimes(0)
      expect(global.ZenMoney.saveData).toHaveBeenCalledTimes(0)
    })
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
