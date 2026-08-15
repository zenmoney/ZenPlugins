const fs = require('fs')
const os = require('os')
const path = require('path')
const { loadDebugConfig } = require('../../../../scripts/bootloaderServer/config')

describe('Bootloader config', () => {
  let directory

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true })
  })

  it('creates bootloader_config.json with data override disabled', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json'),
      data: path.join(directory, 'zp_data.json')
    }
    fs.writeFileSync(pluginPaths.preferences, JSON.stringify({ login: 'legacy' }), 'utf8')

    expect(loadDebugConfig(pluginPaths)).toMatchObject({
      preferences: { login: 'legacy' },
      data: {},
      bootloader: { overrideData: false }
    })
    expect(JSON.parse(fs.readFileSync(pluginPaths.debugConfig, 'utf8'))).toMatchObject({
      preferences: { login: 'legacy' },
      data: {},
      bootloader: { overrideData: false }
    })
  })

  it('loads bootloader_config.json', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json'),
      data: path.join(directory, 'zp_data.json')
    }
    const config = {
      preferences: { login: 'test' },
      data: { auth: { token: 'configured' } },
      bootloader: { captureConsole: false, overrideData: true }
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify(config), 'utf8')
    fs.writeFileSync(pluginPaths.data, JSON.stringify({ auth: { token: 'ignored' } }), 'utf8')

    expect(loadDebugConfig(pluginPaths)).toMatchObject(config)
    expect(loadDebugConfig(pluginPaths).data).toEqual({ auth: { token: 'configured' } })
  })

  it('reads changed preferences and bootloader settings on every load', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json'),
      data: path.join(directory, 'zp_data.json')
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify({
      preferences: { login: 'first' },
      bootloader: { captureConsole: true }
    }), 'utf8')
    expect(loadDebugConfig(pluginPaths).preferences.login).toBe('first')

    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify({
      preferences: { login: 'second' },
      bootloader: { captureConsole: false }
    }), 'utf8')

    const config = loadDebugConfig(pluginPaths)
    expect(config.preferences.login).toBe('second')
    expect(config.bootloader.captureConsole).toBe(false)
    expect(config.bootloader.overrideData).toBe(false)
  })

  it('drops the removed network sanitizing option', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json'),
      data: path.join(directory, 'zp_data.json')
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify({
      bootloader: { network: { enabled: true, sanitize: true } }
    }), 'utf8')

    expect(loadDebugConfig(pluginPaths).bootloader.network).toEqual({
      enabled: true,
      maxBodyBytes: 65536
    })
  })

  it('rejects non-object data in bootloader_config.json', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json'),
      data: path.join(directory, 'zp_data.json')
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify({ data: ['not', 'an', 'object'] }), 'utf8')

    expect(() => loadDebugConfig(pluginPaths)).toThrow('bootloader_config.json.data must contain an object')
  })

  it('does not read zp_data.json', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json'),
      data: path.join(directory, 'zp_data.json')
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify({
      data: { auth: { token: 'configured' } },
      bootloader: { overrideData: true }
    }), 'utf8')
    fs.writeFileSync(pluginPaths.data, '{ malformed legacy data', 'utf8')

    expect(loadDebugConfig(pluginPaths).data).toEqual({ auth: { token: 'configured' } })
  })
})
