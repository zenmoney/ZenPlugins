// [model] Plugin initialization must supply URL only when the native runtime lacks it.
describe('Sberbank BY URL runtime compatibility [model]', () => {
  const nativeURL = global.URL
  const nativeSearchParams = global.URLSearchParams

  afterEach(() => {
    global.URL = nativeURL
    global.URLSearchParams = nativeSearchParams
  })

  it('loads the existing polyfill without a native URL implementation', () => {
    delete (global as { URL?: unknown }).URL
    delete (global as { URLSearchParams?: unknown }).URLSearchParams
    jest.isolateModules(() => {
      require('../../api')
    })
    expect(typeof global.URL).toBe('function')
    expect(new URL('/callback?code=example', 'https://example.test').searchParams.get('code')).toBe('example')
  })

  it('preserves the native URL implementation', () => {
    jest.isolateModules(() => {
      require('../../api')
    })
    expect(global.URL).toBe(nativeURL)
    expect(global.URLSearchParams).toBe(nativeSearchParams)
  })
})
