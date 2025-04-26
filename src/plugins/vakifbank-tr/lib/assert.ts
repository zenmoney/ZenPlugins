export function assert (
  condition: unknown,
  message = 'Assertion failed',
  ...ctx: unknown[]
): asserts condition {
  if (condition !== true) {
    // Extra context lands in console but isn’t string-coerced into the Error.
    if (ctx.length > 0) console.error(message, ...ctx)
    throw new Error(message)
  }
}
