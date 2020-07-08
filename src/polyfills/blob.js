/* eslint-disable */
/**
 * Based on https://github.com/bjornstar/blob-polyfill/blob/master/Blob.js
 */
function stringEncode (string) {
  var pos = 0;
  var len = string.length;
  var Arr = global.Uint8Array || Array; // Use byte array when possible

  var at = 0; // output position
  var tlen = Math.max(32, len + (len >> 1) + 7); // 1.5x size
  var target = new Arr((tlen >> 3) << 3); // ... but at 8 byte offset

  while (pos < len) {
    var value = string.charCodeAt(pos++);
    if (value >= 0xd800 && value <= 0xdbff) {
      // high surrogate
      if (pos < len) {
        var extra = string.charCodeAt(pos);
        if ((extra & 0xfc00) === 0xdc00) {
          ++pos;
          value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
        }
      }
      if (value >= 0xd800 && value <= 0xdbff) {
        continue; // drop lone surrogate
      }
    }

    // expand the buffer if we couldn't write 4 bytes
    if (at + 4 > target.length) {
      tlen += 8; // minimum extra
      tlen *= (1.0 + (pos / string.length) * 2); // take 2x the remaining
      tlen = (tlen >> 3) << 3; // 8 byte offset

      var update = new Uint8Array(tlen);
      update.set(target);
      target = update;
    }

    if ((value & 0xffffff80) === 0) { // 1-byte
      target[at++] = value; // ASCII
      continue;
    } else if ((value & 0xfffff800) === 0) { // 2-byte
      target[at++] = ((value >> 6) & 0x1f) | 0xc0;
    } else if ((value & 0xffff0000) === 0) { // 3-byte
      target[at++] = ((value >> 12) & 0x0f) | 0xe0;
      target[at++] = ((value >> 6) & 0x3f) | 0x80;
    } else if ((value & 0xffe00000) === 0) { // 4-byte
      target[at++] = ((value >> 18) & 0x07) | 0xf0;
      target[at++] = ((value >> 12) & 0x3f) | 0x80;
      target[at++] = ((value >> 6) & 0x3f) | 0x80;
    } else {
      // FIXME: do we care
      continue;
    }

    target[at++] = (value & 0x3f) | 0x80;
  }

  return target.slice(0, at);
}

function stringDecode (buf) {
  var end = buf.length;
  var res = [];

  var i = 0;
  while (i < end) {
    var firstByte = buf[i];
    var codePoint = null;
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1;

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint;

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte;
          }
          break;
        case 2:
          secondByte = buf[i + 1];
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 3:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint;
            }
          }
          break;
        case 4:
          secondByte = buf[i + 1];
          thirdByte = buf[i + 2];
          fourthByte = buf[i + 3];
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint;
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD;
      bytesPerSequence = 1;
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000;
      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
      codePoint = 0xDC00 | codePoint & 0x3FF;
    }

    res.push(codePoint);
    i += bytesPerSequence;
  }

  var len = res.length;
  var str = "";
  var j = 0;

  while (j < len) {
    str += String.fromCharCode.apply(String, res.slice(j, j += 0x1000));
  }

  return str;
}

// string -> buffer
var textEncode = typeof TextEncoder === "function"
  ? TextEncoder.prototype.encode.bind(new TextEncoder())
  : stringEncode;

// buffer -> string
var textDecode = typeof TextDecoder === "function"
  ? TextDecoder.prototype.decode.bind(new TextDecoder())
  : stringDecode;

var viewClasses = [
  "[object Int8Array]",
  "[object Uint8Array]",
  "[object Uint8ClampedArray]",
  "[object Int16Array]",
  "[object Uint16Array]",
  "[object Int32Array]",
  "[object Uint32Array]",
  "[object Float32Array]",
  "[object Float64Array]"
];

var isArrayBufferView = ArrayBuffer.isView || function (obj) {
  return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
};

function isDataView (obj) {
  return obj && Object.prototype.isPrototypeOf.call(DataView, obj);
}

function bufferClone (buf) {
  var view = new Array(buf.byteLength);
  var array = new Uint8Array(buf);
  var i = view.length;
  while (i--) {
    view[i] = array[i];
  }
  return view;
}

function concatTypedarrays (chunks) {
  var size = 0;
  var j = chunks.length;
  while (j--) { size += chunks[j].length; }
  var b = new Uint8Array(size);
  var offset = 0;
  for (var i = 0; i < chunks.length; i++) {
    var chunk = chunks[i];
    b.set(chunk, offset);
    offset += chunk.byteLength || chunk.length;
  }

  return b;
}

function isBlob (chunk) {
  return (chunk instanceof Blob) || (chunk._getId && chunk._getType && chunk._getSize && chunk._getBytes);
}

function Blob (chunks, opts) {
  chunks = chunks || [];
  opts = opts == null ? {} : opts;

  for (var i = 0, len = chunks.length; i < len; i++) {
    var chunk = chunks[i];
    if (isBlob(chunk)) {
      chunks[i] = chunk;
      continue;
    }
    var buffer;
    if (typeof chunk === "string") {
      buffer = textEncode(chunk);
    } else if (Object.prototype.isPrototypeOf.call(ArrayBuffer, chunk) || isArrayBufferView(chunk)) {
      buffer = bufferClone(chunk);
    } else if (isDataView(chunk)) {
      buffer = bufferClone(chunk.buffer);
    } else {
      buffer = textEncode(String(chunk));
    }
    (function (buffer) {
      chunks[i] = {
        _getId: function () { return null },
        _getSize: function () { return buffer.length },
        _getType: function () { return "" },
        _getBytes: function () { return buffer }
      };
    })(buffer);
  }

  var size = 0;
  for (i = 0, len = chunks.length; i < len; i++) {
    size += chunks[i]._getSize();
  }
  var type = opts.type || "";
  if (/[^\u0020-\u007E]/.test(this.type)) {
    type = "";
  } else {
    type = type.toLowerCase();
  }
  var id = chunks.length === 1 && isBlob(chunks[0]) && chunks[0]._getType() === type ? chunks[0]._getId() : null
  var bytes = null;

  this.type = type;
  this.size = size;
  this._getId = function () {
    return id;
  };
  this._getType = function () {
    return type;
  };
  this._getSize = function () {
    return size;
  };
  this._getBytes = function () {
    if (bytes === null) {
      for (var i = 0, len = chunks.length; i < len; i++) {
        chunks[i] = chunks[i]._getBytes();
      }
      bytes = global.Uint8Array
        ? concatTypedarrays(chunks)
        : [].concat.apply([], chunks);
      chunks = null;
    }
    return bytes;
  };
}

Blob.prototype.arrayBuffer = function () {
  return Promise.resolve(this._getBytes());
};

Blob.prototype.text = function () {
  return Promise.resolve(textDecode(this._getBytes()));
};

Blob.prototype.slice = function (start, end, type) {
  var slice = this._getBytes().slice(start || 0, end || this._getBytes().length);
  return new Blob([slice], {type: type});
};

Blob.prototype.toString = function () {
  return "[object Blob]";
};

if (!('Blob' in ZenMoney)) {
  ZenMoney.Blob = Blob;
}
