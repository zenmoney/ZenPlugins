const fs = require('fs')
const path = require('path')

const DEFAULT_BOOTLOADER_CONFIG = {
  captureConsole: true,
  captureErrors: true,
  overrideData: false,
  network: {
    enabled: true,
    maxBodyBytes: 65536
  },
  sessions: {
    persist: true,
    limit: 20
  }
}

function isObject (value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function mergeConfig (base, extension) {
  if (!isObject(extension)) {
    return { ...base }
  }
  const result = { ...base }
  for (const [key, value] of Object.entries(extension)) {
    result[key] = isObject(value) && isObject(base[key])
      ? mergeConfig(base[key], value)
      : value
  }
  return result
}

function readJsonIfExists (filename, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      return fallback
    }
    error.message += ` in ${filename}`
    throw error
  }
}

function validateConfig (raw, filename) {
  const configName = path.basename(filename)
  if (!isObject(raw)) {
    throw new Error(`${configName} must contain an object in ${filename}`)
  }
  if (raw.preferences !== undefined && !isObject(raw.preferences)) {
    throw new Error(`${configName}.preferences must contain an object in ${filename}`)
  }
  if (raw.data !== undefined && !isObject(raw.data)) {
    throw new Error(`${configName}.data must contain an object in ${filename}`)
  }
  if (raw.bootloader !== undefined && !isObject(raw.bootloader)) {
    throw new Error(`${configName}.bootloader must contain an object in ${filename}`)
  }
}

function loadDebugConfig (pluginPaths) {
  const legacyPreferences = readJsonIfExists(pluginPaths.preferences, {})
  let raw = readJsonIfExists(pluginPaths.debugConfig, null)
  if (raw === null) {
    raw = {
      preferences: legacyPreferences,
      data: {},
      bootloader: DEFAULT_BOOTLOADER_CONFIG
    }
    fs.writeFileSync(pluginPaths.debugConfig, JSON.stringify(raw, null, 2) + '\n', 'utf8')
    console.log(`Created ${path.relative(process.cwd(), pluginPaths.debugConfig)}`)
  }
  validateConfig(raw, pluginPaths.debugConfig)
  const bootloader = mergeConfig(DEFAULT_BOOTLOADER_CONFIG, raw.bootloader)
  bootloader.overrideData = bootloader.overrideData === true
  bootloader.network.enabled = bootloader.network.enabled !== false
  delete bootloader.network.sanitize
  bootloader.network.maxBodyBytes = Math.max(0, Number(bootloader.network.maxBodyBytes) || 0)
  bootloader.sessions.persist = bootloader.sessions.persist !== false
  bootloader.sessions.limit = Math.max(1, Number(bootloader.sessions.limit) || DEFAULT_BOOTLOADER_CONFIG.sessions.limit)
  return {
    preferences: raw.preferences || {},
    data: raw.data || {},
    bootloader
  }
}

module.exports = {
  DEFAULT_BOOTLOADER_CONFIG,
  loadDebugConfig,
  mergeConfig
}
