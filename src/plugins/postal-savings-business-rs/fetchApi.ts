import cheerio from 'cheerio'
import { fetch, FetchOptions } from '../../common/network'
import get, { getString } from '../../types/get'

const baseUrl = 'https://webebank.ebb-bg.com/sbpo_mbank/'

export function encodeForm (fields: Array<[string, string]>): string {
  return fields.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
}

function safeHtmlLog (body: unknown): unknown {
  if (typeof body !== 'string') return { bodyType: typeof body }
  const $ = cheerio.load(body)
  const owners = $('.short_table_section_title, #main-selector h1, select[name="clientSelector"] option').toArray()
    .map(element => $(element).text().trim().replace(/\s*\([A-Z]{3}\)$/, '').trim())
    .filter(value => value !== '')
    .flatMap(value => [value, value.replace(/\s+PR$/, '')])
  const clean = (text: string): string => {
    for (const owner of owners) text = text.replace(new RegExp(owner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '<customer>')
    return text
  }
  return {
    loginForm: $('form[name="loginform"]').length > 0,
    pager: $('#table_container').attr('data-pager'),
    accounts: $('.short_table_section_container').toArray().map(element => ({
      id: $(element).attr('data-id'),
      balances: $(element).find('.big_value').toArray().map(item => $(item).text().trim())
    })),
    transactions: $('#table_tag_0 tbody tr[data-id]').toArray().map(row => ({
      id: $(row).attr('data-id'),
      fields: Object.fromEntries($(row).find('[data-field_name]').toArray().map(cell => [$(cell).attr('data-field_name'), clean($(cell).text().trim())]))
    })),
    errors: $('.alert-danger, .alert-error').toArray().map(element => clean($(element).text().trim()))
  }
}

function safeFormLog (body: unknown): unknown {
  if (typeof body !== 'string') return '<form>'
  return body.split('&').map(pair => {
    const [key, ...rest] = pair.split('=')
    return /csrf|token|username|password|\$id/i.test(decodeURIComponent(key)) ? `${key}=<secret>` : `${key}=${rest.join('=')}`
  }).join('&')
}

async function request (path: string, options: FetchOptions = {}, json = false): Promise<unknown> {
  const response = await fetch(baseUrl + path, {
    ...options,
    sanitizeRequestLog: {
      headers: { authorization: true, cookie: true, 'x-csrf-token': true },
      body: safeFormLog
    },
    sanitizeResponseLog: {
      headers: { authorization: true, cookie: true, 'set-cookie': true },
      body: json ? { authorizationId: true } : safeHtmlLog
    },
    ...(json ? { parse: (body: string): unknown => JSON.parse(body) } : {})
  })
  console.assert(response.ok, 'Business bank request failed', { status: response.status, path })
  return response.body
}

async function html (path: string, options?: FetchOptions): Promise<string> {
  const body = await request(path, options)
  console.assert(typeof body === 'string', 'Expected bank HTML')
  return body as string
}

function postOptions (fields: Array<[string, string]>, csrf?: string): FetchOptions {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      ...(csrf !== undefined ? { 'X-CSRF-Token': csrf } : {})
    },
    body: encodeForm(fields)
  }
}

export async function fetchLoginPage (): Promise<string> {
  return await html('auth/login')
}

export async function submitLogin (fields: Array<[string, string]>): Promise<string> {
  return await html('j_spring_security_check', postOptions(fields))
}

export async function fetchPushStatus (): Promise<string> {
  const body = await request(`auth/mpush/login/check?_=${Date.now()}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  }, true)
  // Narrow only the safe field so assertion context cannot expose challenge material.
  return getString({ status: get(body, 'status') }, 'status')
}

export async function fetchAccountsPage (): Promise<string> {
  return await html('accounts')
}

export async function fetchHistoryPage (index: string, fields?: Array<[string, string]>): Promise<string> {
  console.assert(/^\d+$/.test(index), 'Invalid bank account index')
  return await html(`accounts/${index}/transactions/booked`, fields !== undefined ? postOptions(fields) : undefined)
}

export async function fetchNextHistoryPage (index: string, page: number): Promise<string> {
  console.assert(/^\d+$/.test(index) && Number.isInteger(page) && page > 1, 'Invalid history page request')
  return await html(`accounts/${index}/transactions/booked?page=${page}`)
}

export async function selectPeriod (fields: Array<[string, string]>, csrf: string): Promise<unknown> {
  return await request('tables/periodSelector', {
    ...postOptions(fields, csrf),
    headers: { ...postOptions(fields, csrf).headers, 'X-Requested-With': 'XMLHttpRequest' }
  }, true)
}
