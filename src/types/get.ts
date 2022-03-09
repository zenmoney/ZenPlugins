import { get as _get, isArray, isBoolean, isNumber, isString } from 'lodash'

export default function get (obj: unknown, path: string, defaultValue?: unknown): unknown {
  return _get(obj, path, defaultValue)
}

const checkNumber = { check: isNumber, typeName: 'number' }
const checkString = { check: isString, typeName: 'string' }
const checkBoolean = { check: isBoolean, typeName: 'boolean' }
const checkArray = { check: isArray, typeName: 'array' }

export const getNumber = typeCast(checkNumber)
export const getString = typeCast(checkString)
export const getBoolean = typeCast(checkBoolean)
export const getArray = typeCast(checkArray)

export const getOptNumber = optTypeCast(checkNumber)
export const getOptString = optTypeCast(checkString)
export const getOptBoolean = optTypeCast(checkBoolean)
export const getOptArray = optTypeCast(checkArray)

interface TypeCheck<T> {
  check: (value: unknown) => value is T
  typeName: string
}

function optTypeCast<Output> (isType: TypeCheck<Output>): (obj: unknown, path: string) => Output | undefined {
  return (obj: unknown, path: string) => {
    const result = get(obj, path)
    return isType.check(result) ? result : undefined
  }
}

function typeCast<Output> (isType: TypeCheck<Output>): (obj: unknown, path: string) => Output {
  return (obj: unknown, path: string) => {
    const result = get(obj, path)
    console.assert(isType.check(result), `cant get ${isType.typeName} at "${path}" from ${obj}`)
    return result as Output
  }
}
