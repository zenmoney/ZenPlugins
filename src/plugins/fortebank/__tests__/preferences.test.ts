import * as fs from 'fs'
import * as path from 'path'

describe('Fortebank preferences schema', () => {
  it('requires startDate preference and has local default value', () => {
    const preferencesPath = path.join(__dirname, '..', 'preferences.xml')
    const preferencesXml = fs.readFileSync(preferencesPath, 'utf-8')

    expect(preferencesXml).toContain('key="startDate"')
    expect(preferencesXml).toContain('obligatory="true"')
    expect(preferencesXml).toContain('defaultValue="2018-01-01"')
  })
})
