export function main () {
  const { scriptUrl, preferencesJson } = ZenMoney.getPreferences()
  const preferences = JSON.parse(preferencesJson)
  ZenMoney.getPreferences = () => preferences
  const body = ZenMoney.requestGet(scriptUrl)
  const status = ZenMoney.getLastStatusCode()
  console.assert(status === 200, 'non-success status received for url', { status, scriptUrl, body })
  // eslint-disable-next-line no-eval
  eval(body)
  console.assert(global.main !== main, 'loaded script should override main function')
  global.main()
}
