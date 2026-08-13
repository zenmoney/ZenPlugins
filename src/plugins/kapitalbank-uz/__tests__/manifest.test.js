import fs from 'fs'
import path from 'path'

describe('plugin configuration', () => {
  it('uses the regular runtime and does not request obsolete MyID camera data', () => {
    const pluginDir = path.join(__dirname, '..')
    const manifest = fs.readFileSync(path.join(pluginDir, 'ZenmoneyManifest.xml'), 'utf8')
    const preferences = fs.readFileSync(path.join(pluginDir, 'preferences.xml'), 'utf8')

    expect(manifest).not.toContain('<runtime>')
    expect(preferences).not.toMatch(/key="(?:isResident|pinfl|bday)"/)
  })
})
