if (!global.WebAssembly || global.ZenMoney?.application?.platform === 'android') {
  global.WebAssembly = require('wasm-polyfill.js').default
}
