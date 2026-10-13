import bigInt, { BigInteger } from 'big-integer'

function parts (value: unknown): { coefficient: BigInteger, scale: number } {
  if (typeof value === 'number') {
    assert(Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value)), 'Unsafe decimal number')
  }
  assert(typeof value === 'string' || typeof value === 'number', 'Expected decimal')
  const match = String(value).trim().match(/^([+-]?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/)
  assert(match !== null, 'Invalid decimal')
  const exponent = Number(match[4] ?? 0)
  assert(Math.abs(exponent) <= 100 && (match[2] + (match[3] ?? '')).length <= 100, 'Decimal exceeds precision limit')
  let coefficient = bigInt((match[1] === '-' ? '-' : '') + match[2] + (match[3] ?? ''))
  let scale = (match[3] ?? '').length - exponent
  if (scale < 0) {
    coefficient = coefficient.multiply(bigInt(10).pow(-scale))
    scale = 0
  }
  return { coefficient, scale }
}

function format (coefficient: BigInteger, scale: number): string {
  const sign = coefficient.isNegative() ? '-' : ''
  const digits = coefficient.abs().toString().padStart(scale + 1, '0')
  const result = scale === 0 ? digits : (digits.slice(0, -scale) + '.' + digits.slice(-scale)).replace(/0+$/, '').replace(/\.$/, '')
  return (coefficient.isZero() ? '' : sign) + result
}

export function decimal (value: unknown): string {
  const { coefficient, scale } = parts(value)
  return format(coefficient, scale)
}

export function add (left: unknown, right: unknown): string {
  const a = parts(left)
  const b = parts(right)
  const scale = Math.max(a.scale, b.scale)
  return format(a.coefficient.multiply(bigInt(10).pow(scale - a.scale)).add(b.coefficient.multiply(bigInt(10).pow(scale - b.scale))), scale)
}

export function subtract (left: unknown, right: unknown): string {
  const b = parts(right)
  return add(left, format(b.coefficient.negate(), b.scale))
}

// Return undefined if the quotient cannot be represented exactly within 100 decimal places.
export function divideExact (left: unknown, right: unknown): string | undefined {
  const a = parts(left)
  const b = parts(right)
  assert(!b.coefficient.isZero(), 'Decimal division by zero')
  const numerator = a.coefficient.multiply(bigInt(10).pow(b.scale))
  const denominator = b.coefficient.multiply(bigInt(10).pow(a.scale))
  for (let scale = 0; scale <= 100; scale++) {
    const { quotient, remainder } = numerator.multiply(bigInt(10).pow(scale)).divmod(denominator)
    if (remainder.isZero()) return format(quotient, scale)
  }
  return undefined
}

export function minorUnits (value: unknown, scale = 2): string {
  const parsed = parts(value)
  return format(parsed.coefficient, parsed.scale + scale)
}
