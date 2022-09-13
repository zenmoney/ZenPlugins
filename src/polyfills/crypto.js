if (!global.crypto) {
  global.crypto = {
    getRandomValues: function (abv) {
      var maxValue = Math.pow(2, abv.BYTES_PER_ELEMENT * 8)
      var l = abv.length
      while (l--) {
        abv[l] = Math.floor(Math.random() * maxValue)
      }
      return abv
    }
  }
}
