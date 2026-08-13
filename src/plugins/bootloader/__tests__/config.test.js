const fs = require('fs')
const os = require('os')
const path = require('path')
const { loadDebugConfig } = require('../../../../scripts/bootloaderServer/config')

describe('Bootloader config', () => {
  let directory

  afterEach(() => {
    if (directory) fs.rmSync(directory, { recursive: true, force: true })
  })

  it('loads bootloader_config.json', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json')
    }
    const config = {
      preferences: { login: 'test' },
      bootloader: { captureConsole: false }
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify(config), 'utf8')

    expect(loadDebugConfig(pluginPaths)).toMatchObject(config)
  })

  it('reads changed preferences and bootloader settings on every load', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json')
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
  })

  it('drops the removed network sanitizing option', () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bootloader-config-'))
    const pluginPaths = {
      preferences: path.join(directory, 'zp_preferences.json'),
      debugConfig: path.join(directory, 'bootloader_config.json')
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify({
      bootloader: { network: { enabled: true, sanitize: true } }
    }), 'utf8')

    expect(loadDebugConfig(pluginPaths).bootloader.network).toEqual({
      enabled: true,
      maxBodyBytes: 65536
    })
  })
})
