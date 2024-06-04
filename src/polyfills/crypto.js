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

/**
 * Based on https://github.com/pmndrs/react-three-fiber/issues/298#issuecomment-648563832
 */
const chars =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

if (!global.btoa) {
  global.btoa = (input = '') => {
    let str = input;
    let output = '';

    for (
      let block = 0, charCode, i = 0, map = chars;
      str.charAt(i | 0) || ((map = '='), i % 1);
      output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
    ) {
      charCode = str.charCodeAt((i += 3 / 4));

      if (charCode > 0xff) {
        throw new Error(
          "'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.",
        );
      }

      block = (block << 8) | charCode;
    }

    return output;
  }
}

if (!global.atob) {
  global.atob = (input = '') => {
    let str = input.replace(/[=]+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
      throw new Error(
        "'atob' failed: The string to be decoded is not correctly encoded.",
      );
    }
    for (
      let bc = 0, bs = 0, buffer, i = 0;
      (buffer = str.charAt(i++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  }
}
