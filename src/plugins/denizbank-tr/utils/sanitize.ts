export function sanitize <T> (data: T, ignoreKeys: string[] = []): T {
  if (typeof data === 'object' && data !== null) {
    if (data instanceof Date) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((i) => sanitize(i, ignoreKeys)) as unknown as T
    }

    return Object.fromEntries(
      Object
        .entries(data)
        .map(([key, value]) => [key, ignoreKeys.includes(key) ? value : sanitize(value)])
    ) as unknown as T
  }

  if (typeof data === 'string') {
    return data.replace(
      /^(.{4})(.*)(.{4})$/,
      (_, g1, g2, g3) => `${g1}${'*'.repeat(g2.length)}${g3}`
    ) as unknown as T
  }

  return data
}
