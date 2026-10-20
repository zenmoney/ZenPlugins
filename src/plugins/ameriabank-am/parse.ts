import get from '../../types/get'

/** Read a nonempty bank text field. */
export function text (value: unknown, path: string): string {
  const result = get(value, path)
  console.assert(typeof result === 'string' && result.length > 0, 'Invalid MyAmeria text field', { path })
  return result as string
}

/** Read a finite bank numeric field. */
export function number (value: unknown, path: string): number {
  const result = get(value, path)
  console.assert(typeof result === 'number' && Number.isFinite(result), 'Invalid MyAmeria number field', { path })
  return result as number
}

/** Read a bank array without assuming its item shape. */
export function array (value: unknown, path: string): unknown[] {
  const result = get(value, path)
  console.assert(Array.isArray(result), 'Invalid MyAmeria array field', { path })
  return result as unknown[]
}
