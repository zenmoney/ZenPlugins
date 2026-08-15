import { defaultsDeep } from 'lodash'

import { installApiCapture } from './captureApi'
import { installConsoleCapture } from './captureConsole'
import { installUnhandledErrorCapture } from './captureErrors'
import { installNetworkCapture } from './captureNetwork'
import { installBootloaderDebug } from './bootloaderDebug'
import { serializeError } from './serialization'
import { BootloaderTransport } from './transport'

function getClientInfo () {
  return {
    application: ZenMoney.application || null,
    device: ZenMoney.device || null,
    user: ZenMoney.user ? { locale: ZenMoney.user.locale } : null
  }
}

function failWithoutServer (error) {
  const result = {
    success: false,
    fatal: true,
    message: `Bootloader V2: ${error.message || String(error)}`
  }
  try {
    ZenMoney.setResult(result)
  } catch (setResultError) {
    console.error(error, setResultError)
  }
}

function evaluateScript (script) {
  // Keep the evaluation in a plain synchronous function. Zenmoney's runtime
  // handles this form reliably (and this is how bootloader v1 loaded plugins).
  // eslint-disable-next-line no-eval
  eval(script)
}

export function installDataOverride (data, enabled) {
  if (!enabled) {
    return
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Bootloader override data must be an object')
  }

  const nativeGetData = ZenMoney.getData.bind(ZenMoney)
  const nativeSetData = ZenMoney.setData.bind(ZenMoney)
  const nativeClearData = ZenMoney.clearData.bind(ZenMoney)
  const overrides = { ...data }

  ZenMoney.getData = (key, defaultValue) => {
    if (!Object.prototype.hasOwnProperty.call(overrides, key)) {
      return nativeGetData(key, defaultValue)
    }
    const overrideValue = overrides[key]
    const nativeValue = nativeGetData(key, defaultValue)
    if (overrideValue === null || typeof overrideValue !== 'object' || nativeValue === null || typeof nativeValue !== 'object') {
      return overrideValue
    }
    return defaultsDeep(Array.isArray(overrideValue) ? [] : {}, overrideValue, nativeValue)
  }
  ZenMoney.setData = (key, value) => {
    delete overrides[key]
    return nativeSetData(key, value)
  }
  ZenMoney.clearData = () => {
    for (const key of Object.keys(overrides)) delete overrides[key]
    return nativeClearData()
  }
}

async function execute () {
  const bootloaderPreferences = ZenMoney.getPreferences() || {}
  const fetchImplementation = global.fetch.bind(global)
  const transport = new BootloaderTransport(fetchImplementation)
  await transport.connect(bootloaderPreferences.serverIp)
  const session = await transport.createSession(getClientInfo())

  ZenMoney.getPreferences = () => session.preferences
  installDataOverride(session.data, session.config.overrideData)
  const consoleCapture = installConsoleCapture({
    transport,
    enabled: session.config.captureConsole
  })
  const apiCapture = installApiCapture({ transport })
  installUnhandledErrorCapture({
    transport,
    enabled: session.config.captureErrors
  })
  installBootloaderDebug({ transport, session })
  transport.enqueue('session:started', {
    sessionId: session.sessionId,
    plugin: session.plugin,
    serverUrl: session.serverUrl
  })

  try {
    const script = await transport.fetchText(session.scriptUrl)
    const bootloaderMain = global.main
    evaluateScript(script)
    consoleCapture.refresh()
    installNetworkCapture({
      transport,
      config: session.config.network
    })
    if (typeof global.main !== 'function' || global.main === bootloaderMain) {
      throw new Error('Loaded plugin did not install global.main')
    }
    const result = global.main()
    if (result && typeof result.then === 'function') {
      await result
    }
  } catch (error) {
    transport.enqueue('error', serializeError(error, true))
    if (!apiCapture.hasSetResultBeenCalled()) {
      ZenMoney.setResult({
        success: false,
        fatal: true,
        message: error.message || String(error)
      })
    } else {
      await transport.flush().catch(() => {})
    }
  }
}

export function main () {
  execute().catch(failWithoutServer)
}
