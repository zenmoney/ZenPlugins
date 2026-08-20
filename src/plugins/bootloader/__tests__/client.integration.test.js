import { installDataOverride, main } from '../index'

function response (body, status = 200, raw = false) {
  return {
    status,
    text: () => Promise.resolve(raw ? body : JSON.stringify(body))
  }
}

describe('Bootloader client integration', () => {
  it('uses only the native store when data override is disabled', () => {
    const previousZenMoney = global.ZenMoney
    const nativeData = { auth: { token: 'native' } }
    const getData = jest.fn((key, defaultValue) => nativeData[key] ?? defaultValue)
    const setData = jest.fn((key, value) => { nativeData[key] = value })
    const clearData = jest.fn(() => {
      for (const key of Object.keys(nativeData)) delete nativeData[key]
    })
    try {
      global.ZenMoney = { getData, setData, clearData }
      installDataOverride({ auth: { token: 'configured' } }, false)

      expect(global.ZenMoney.getData('auth')).toEqual({ token: 'native' })
      expect(global.ZenMoney.getData).toBe(getData)
      expect(global.ZenMoney.setData).toBe(setData)
      expect(global.ZenMoney.clearData).toBe(clearData)
    } finally {
      global.ZenMoney = previousZenMoney
    }
  })

  it('deeply applies configured values over the native store', () => {
    const previousZenMoney = global.ZenMoney
    const nativeData = {
      auth: {
        token: 'native-token',
        device: {
          id: 'native-device',
          os: { name: 'Android', version: '16' }
        },
        scopes: ['native-first', 'native-second'],
        retry: { enabled: true, attempts: 3 }
      }
    }
    try {
      global.ZenMoney = {
        getData: (key, defaultValue) => nativeData[key] ?? defaultValue,
        setData: (key, value) => { nativeData[key] = value },
        clearData: () => {}
      }
      installDataOverride({
        auth: {
          token: 'configured-token',
          device: {
            id: 'configured-device',
            os: { version: '15' }
          },
          scopes: ['configured-first']
        }
      }, true)

      expect(global.ZenMoney.getData('auth')).toEqual({
        token: 'configured-token',
        device: {
          id: 'configured-device',
          os: { name: 'Android', version: '15' }
        },
        scopes: ['configured-first', 'native-second'],
        retry: { enabled: true, attempts: 3 }
      })
      expect(nativeData.auth).toEqual({
        token: 'native-token',
        device: {
          id: 'native-device',
          os: { name: 'Android', version: '16' }
        },
        scopes: ['native-first', 'native-second'],
        retry: { enabled: true, attempts: 3 }
      })
    } finally {
      global.ZenMoney = previousZenMoney
    }
  })

  it('loads a plugin, injects debug API, captures state and forwards the result', async () => {
    const previous = {
      ZenMoney: global.ZenMoney,
      assert: global.assert,
      bootloader: global.bootloader,
      console: global.console,
      fetch: global.fetch,
      main: global.main
    }
    const receivedEvents = []
    const data = { auth: { token: 'old' }, stale: true }
    const clearData = jest.fn(() => {
      for (const key of Object.keys(data)) delete data[key]
    })
    let finish
    const resultCalled = new Promise(resolve => { finish = resolve })
    global.ZenMoney = {
      application: { platform: 'test', version: '1', build: '1' },
      device: { id: 'test' },
      user: { locale: 'en_US' },
      getPreferences: () => ({ serverIp: '192.168.1.2' }),
      trace: jest.fn(),
      getData: (key, defaultValue) => data[key] ?? defaultValue,
      setData: (key, value) => { data[key] = value },
      clearData,
      saveData: () => {},
      addAccount: jest.fn(),
      addTransaction: jest.fn(),
      setResult: finish
    }
    global.fetch = jest.fn((url, options = {}) => {
      if (url.endsWith('/health')) {
        return Promise.resolve(response({ name: 'zenmoney-bootloader', protocolVersion: 2 }))
      }
      if (url.endsWith('/api/v2/sessions')) {
        return Promise.resolve(response({
          sessionId: 'session-1',
          serverUrl: 'http://192.168.1.2:5050',
          scriptUrl: 'http://192.168.1.2:5050/index.js',
          plugin: { id: 'target', version: '1', build: 1 },
          preferences: { login: 'test' },
          data: { auth: { token: 'imported' } },
          config: {
            captureConsole: true,
            captureErrors: true,
            overrideData: true,
            network: { enabled: false, maxBodyBytes: 1024 }
          }
        }, 201))
      }
      if (url.endsWith('/index.js')) {
        return Promise.resolve(response(`global.main = async function () {
          console.log('plugin started')
          await global.bootloader.checkpoint('parsed', { count: 1 })
          if (ZenMoney.getData('auth').token !== 'imported') throw new Error('plugin data was not loaded')
          if (ZenMoney.getData('stale') !== true) throw new Error('native plugin data fallback was not preserved')
          ZenMoney.setData('auth', { token: 'new' })
          if (ZenMoney.getData('auth').token !== 'new') throw new Error('plugin data did not replace the override')
          ZenMoney.saveData()
          ZenMoney.addAccount({ id: 'account' })
          ZenMoney.addTransaction({ id: 'transaction' })
          ZenMoney.setResult({ success: true })
        }`, 200, true))
      }
      const body = JSON.parse(options.body)
      receivedEvents.push(...body.events)
      return Promise.resolve(response({ accepted: body.events.length, lastSequence: receivedEvents.length }))
    })

    try {
      main()
      await expect(resultCalled).resolves.toEqual({ success: true })
      expect(global.bootloader).toMatchObject({
        isActive: true,
        version: '2',
        sessionId: 'session-1'
      })
      expect(global.ZenMoney.getPreferences()).toEqual({ login: 'test' })
      expect(data).toEqual({ auth: { token: 'new' }, stale: true })
      expect(clearData).not.toHaveBeenCalled()
      expect(receivedEvents.find(event => event.type === 'state:get').payload.value).toEqual({ token: 'imported' })
      expect(receivedEvents.map(event => event.type)).toEqual(expect.arrayContaining([
        'console',
        'checkpoint',
        'state:get',
        'state:set',
        'state:save',
        'accounts:add',
        'transactions:add',
        'session:result'
      ]))
    } finally {
      global.ZenMoney = previous.ZenMoney
      global.assert = previous.assert
      global.bootloader = previous.bootloader
      global.console = previous.console
      global.fetch = previous.fetch
      global.main = previous.main
    }
  })
})
