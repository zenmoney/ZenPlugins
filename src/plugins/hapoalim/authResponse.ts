function record (value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function getResponseErrorCode (response: unknown): string | null {
  if (!record(response)) return null
  if (typeof response.errCode === 'string') return response.errCode
  const body = response.body
  if (!record(body)) return null
  if (record(body.error) && typeof body.error.errCode === 'string') return body.error.errCode
  if (response.status !== 401 || body.flow !== 'STEPUP' || body.state !== 'STEPUPOTP' ||
    body.target !== '' || body.result !== null || body.error !== null || Object.keys(body).length !== 5) return null
  try {
    if (typeof response.url !== 'string') return null
    const url = new URL(response.url)
    return url.origin === 'https://login.bankhapoalim.co.il' && url.pathname === '/ServerServices/general/accounts' ? 'STEPUPOTP' : null
  } catch { return null }
}
