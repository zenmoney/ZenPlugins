if (!global.crypto) {
  global.crypto = {
    getRandomValues: require('polyfill-crypto.getrandomvalues')
  }
}
