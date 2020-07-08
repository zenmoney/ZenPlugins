/**
 * Based on https://github.com/jimmywarting/FormData/blob/master/FormData.js
 */
const Blob = global.Blob

function normalizeValue ([name, value, filename]) {
  if (value instanceof Blob) {
    value = new Blob([value], { type: value.type })
    if (filename !== undefined) {
      value.name = filename
    }
  }
  return [name, value]
}

function ensureArgs (args, expected) {
  if (args.length < expected) {
    throw new TypeError(`${expected} argument required, but only ${args.length} present.`)
  }
}

function normalizeArgs (name, value, filename) {
  return value instanceof Blob
    ? filename !== undefined
      ? [String(name), value, filename + '']
      : [String(name), value]
    : [String(name), String(value)]
}

function each (arr, cb) {
  for (let i = 0; i < arr.length; i++) {
    cb(arr[i])
  }
}

/**
 * @implements {Iterable}
 */
class FormData {
  /**
   * FormData class
   */
  constructor () {
    Object.defineProperty(this, '_data', {
      writable: true,
      value: []
    })
  }

  /**
   * Append a field
   *
   * @param   {string}           name      field name
   * @param   {string|Blob}      value     string / blob / file
   * @param   {string=}          filename  filename to use with blob
   * @return  {undefined}
   */
  append (name, value, filename) {
    ensureArgs(arguments, 2)
    this._data.push(normalizeArgs(name, value, filename))
  }

  /**
   * Delete all fields values given name
   *
   * @param   {string}  name  Field name
   * @return  {undefined}
   */
  delete (name) {
    ensureArgs(arguments, 1)
    const result = []
    name = String(name)

    each(this._data, entry => {
      entry[0] !== name && result.push(entry)
    })

    this._data = result
  }

  /**
   * Iterate over all fields as [name, value]
   *
   * @return {Iterator}
   */
  * entries () {
    for (var i = 0; i < this._data.length; i++) {
      yield normalizeValue(this._data[i])
    }
  }

  /**
   * Iterate over all fields
   *
   * @param   {Function}  callback  Executed for each item with parameters (value, name, thisArg)
   * @param   {Object=}   thisArg   `this` context for callback function
   * @return  {undefined}
   */
  forEach (callback, thisArg) {
    ensureArgs(arguments, 1)
    for (const [name, value] of this) {
      callback.call(thisArg, value, name, this)
    }
  }

  /**
   * Return first field value given name
   * or null if non existen
   *
   * @param   {string}  name      Field name
   * @return  {string|Blob|null}  value Fields value
   */
  get (name) {
    ensureArgs(arguments, 1)
    const entries = this._data
    name = String(name)
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][0] === name) {
        return normalizeValue(entries[i])[1]
      }
    }
    return null
  }

  /**
   * Return all fields values given name
   *
   * @param   {string}  name  Fields name
   * @return  {Array}         [{String|Blob}]
   */
  getAll (name) {
    ensureArgs(arguments, 1)
    const result = []
    name = String(name)
    each(this._data, data => {
      data[0] === name && result.push(normalizeValue(data)[1])
    })

    return result
  }

  /**
   * Check for field name existence
   *
   * @param   {string}   name  Field name
   * @return  {boolean}
   */
  has (name) {
    ensureArgs(arguments, 1)
    name = String(name)
    for (let i = 0; i < this._data.length; i++) {
      if (this._data[i][0] === name) {
        return true
      }
    }
    return false
  }

  /**
   * Iterate over all fields name
   *
   * @return {Iterator}
   */
  * keys () {
    for (const [name] of this) {
      yield name
    }
  }

  /**
   * Overwrite all values given name
   *
   * @param   {string}    name      Filed name
   * @param   {string}    value     Field value
   * @param   {string=}   filename  Filename (optional)
   * @return  {undefined}
   */
  set (name, value, filename) {
    ensureArgs(arguments, 2)
    name = String(name)
    const result = []
    const args = normalizeArgs(name, value, filename)
    let replace = true

    // - replace the first occurrence with same name
    // - discards the remaning with same name
    // - while keeping the same order items where added
    each(this._data, data => {
      data[0] === name
        ? replace && (replace = !result.push(args))
        : result.push(data)
    })

    replace && result.push(args)

    this._data = result
  }

  /**
   * Iterate over all fields
   *
   * @return {Iterator}
   */
  * values () {
    for (const [, value] of this) {
      yield value
    }
  }

  /**
   * The class itself is iterable
   * alias for formdata.entries()
   *
   * @return  {Iterator}
   */
  [Symbol.iterator] () {
    return this.entries()
  }

  /**
   * Create the default string description.
   *
   * @return  {string} [object FormData]
   */
  toString () {
    return '[object FormData]'
  }
}

if (!global.FormData) {
  global.FormData = FormData
}
