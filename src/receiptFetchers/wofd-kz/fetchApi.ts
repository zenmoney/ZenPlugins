import { fetch, fetchJson } from '../../common/network'

export async function resolveKpos (code: string): Promise<string> {
  const response = await fetch(code, { redirect: 'manual' })
  assert([301, 302, 303, 307, 308].includes(response.status), 'Expected KPOS receipt redirect', { status: response.status })
  const location = response.headers.location
  assert(typeof location === 'string', 'Missing KPOS receipt redirect')
  return location
}

export async function fetchReceipt (registrationNumber: string, ticketNumber: string, ticketDate: string): Promise<unknown> {
  const response = await fetchJson(`https://cabinet.wofd.kz/api/tickets?registrationNumber=${encodeURIComponent(registrationNumber)}&ticketNumber=${encodeURIComponent(ticketNumber)}&ticketDate=${encodeURIComponent(ticketDate)}`)
  assert(response.status === 200, 'Unexpected receipt HTTP status', { status: response.status })
  return response.body
}
