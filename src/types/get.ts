import { get as _get } from 'lodash'

export default function get (obj: unknown, path: string, defaultValue?: unknown): unknown {
  return _get(obj, path, defaultValue)
}
