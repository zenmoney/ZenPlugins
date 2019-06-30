import * as tools from '../tools'

describe('Tools', () => {
  it('getTimestamp', () => {
    const date = new Date(Date.parse('2018-02-10T00:04:00.000Z'))
    expect(tools.getTimestamp(date)).toEqual(1518221040)
  })

  it('cleanUpText', () => {
    const toClean = '\\ &quot;example&quot;     <text>, &lt;here&gt;'
    expect(tools.cleanUpText(toClean)).toEqual('"example" , here')
  })

  it('cleanUpText null', () => {
    expect(tools.cleanUpText(null)).toEqual(null)
  })
})
