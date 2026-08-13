function getBootloaderEnvironment () {
  return typeof global !== 'undefined' && global.bootloader?.isActive
    ? global.bootloader
    : null
}

export const Debug = Object.freeze({
  get isActive () {
    return getBootloaderEnvironment() !== null
  },
  get version () {
    return getBootloaderEnvironment()?.version
  },
  get sessionId () {
    return getBootloaderEnvironment()?.sessionId
  },
  get plugin () {
    return getBootloaderEnvironment()?.plugin
  },
  get server () {
    return getBootloaderEnvironment()?.server
  },
  get config () {
    return getBootloaderEnvironment()?.config
  },
  checkpoint (name, value) {
    const environment = getBootloaderEnvironment()
    return environment ? environment.checkpoint(name, value) : Promise.resolve()
  }
})
