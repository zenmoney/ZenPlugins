import { main } from '../index'

function response (body, status = 200, raw = false) {
  return {
    status,
    text: () => Promise.resolve(raw ? body : JSON.stringify(body))
  }
}

describe('Bootloader client integration', () => {
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
    const data = { auth: { token: 'old' } }
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
      clearData: () => {},
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
          config: {
            captureConsole: true,
            captureErrors: true,
            network: { enabled: false, maxBodyBytes: 1024 }
          }
        }, 201))
      }
      if (url.endsWith('/index.js')) {
        return Promise.resolve(response(`global.main = async function () {
          console.log('plugin started')
          await global.bootloader.checkpoint('parsed', { count: 1 })
          ZenMoney.getData('auth')
          ZenMoney.setData('auth', { token: 'new' })
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
