import _ from 'lodash'
import util from 'util'

export function installFetchMockDeveloperFriendlyFallback (fetchMock) {
  global.beforeEach(() => {
    fetchMock.catch((url, opts) => {
      throw new Error(util.format('Unmatched fetch request', {
        ..._.omit(opts, ['body']),
        matcher: {
          [util.inspect.custom || 'inspect']: () => `(url, {body}) => url.endsWith(${JSON.stringify(url)}) && _.isEqual(JSON.parse(body), ${opts.body})`
        }
      }))
    })
  })
  global.afterEach(() => {
    fetchMock.reset()
    fetchMock.restore()
  })
}
