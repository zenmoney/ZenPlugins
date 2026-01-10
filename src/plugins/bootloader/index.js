export async function main () {
  const { scriptUrl, preferencesJson } = ZenMoney.getPreferences()
  const preferences = JSON.parse(preferencesJson)
  ZenMoney.getPreferences = () => preferences

  let body
  let status
  if (typeof ZenMoney.fetch === 'function') {
    const response = await ZenMoney.fetch(scriptUrl, {
      method: 'GET'
    })

    status = response.status
    body = await response.text()
  } else {
    body = ZenMoney.requestGet(scriptUrl)
    status = ZenMoney.getLastStatusCode()
  }

  console.assert(status === 200, 'non-success status received for url', { status, scriptUrl, body })
  // eslint-disable-next-line no-eval
  eval(body)
  console.assert(global.main !== main, 'loaded script should override main function')
  global.main()
}
