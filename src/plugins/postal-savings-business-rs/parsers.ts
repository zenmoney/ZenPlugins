import cheerio from 'cheerio'
import moment from 'moment-timezone'
import { getNumber } from '../../types/get'
import { BankAccount, HistoryPage, LoginPage } from './models'

export const bankTimezone = 'Europe/Belgrade'

export function isAuthenticatedPage (body: string): boolean {
  const $ = cheerio.load(body)
  return $('form[action="/sbpo_mbank/auth/logout"] input[name="_csrf_token"]').length === 1
}

export function parseAmount (text: string): number {
  assert(/^-?(?:\d{1,3}(?:\.\d{3})*|\d+),\d{2}$/.test(text), 'Invalid bank amount')
  const value = Number(text.replace(/\./g, '').replace(',', '.'))
  assert(Number.isFinite(value), 'Non-finite bank amount')
  return value
}

export function parseDate (text: string): Date {
  const date = moment.tz(text, 'DD.MM.YYYY', true, bankTimezone)
  assert(date.isValid(), 'Invalid bank date')
  return date.toDate()
}

export function parseLoginPage (body: string): LoginPage | null {
  const $ = cheerio.load(body)
  const form = $('form[name="loginform"]')
  if (form.length === 0) return null
  assert(form.length === 1 && form.attr('action') === '/sbpo_mbank/j_spring_security_check', 'Unsupported login form')
  const fields: Array<[string, string]> = []
  form.find('input[name]:not([disabled])').each((_, element) => {
    const input = $(element)
    fields.push([input.attr('name') as string, input.val() ?? ''])
  })
  assert(fields.some(([key, value]) => key === '_csrf_token' && value !== ''), 'Missing login CSRF token')
  return {
    fields,
    polling: form.find('input.mpush_poll_login').length === 1,
    confirmationCode: form.find('input.mpush_confirmation_code').val() ?? ''
  }
}

export function parseAccounts (body: string): BankAccount[] {
  const $ = cheerio.load(body)
  const accounts: BankAccount[] = []
  $('.short_table_section_container').not('[data-id="total"]').each((_, element) => {
    const section = $(element)
    assert(section.find('.fc-currentAccount').length === 1, 'Unsupported business product')
    const link = section.find('a[href$="/transactions/"]').first().attr('href')
    const index = link?.match(/^\/sbpo_mbank\/accounts\/(\d+)\/transactions\/$/)?.[1]
    const number = section.find('.short_table_left_group .short_table_element').text().trim()
    const balances = section.find('.short_table_right_section .big_value').toArray().map(element => $(element).text().trim())
    assert(index !== undefined && /^\d{3}-\d{13}-\d{2}$/.test(number), 'Invalid account identity')
    assert(balances.length === 2, 'Unexpected account balance fields')
    const current = balances[0].match(/^(.+) ([A-Z]{3})$/)
    const available = balances[1].match(/^(.+) ([A-Z]{3})$/)
    assert(current !== null && available !== null && current[2] === available[2], 'Invalid account currency')
    accounts.push({
      number,
      index,
      title: section.find('.short_table_section_title').text().trim(),
      currency: current[2],
      current: parseAmount(current[1]),
      available: parseAmount(available[1])
    })
  })
  assert(accounts.length > 0, 'No business accounts found')
  return accounts
}

export function parseHistoryPage (body: string): HistoryPage {
  const $ = cheerio.load(body)
  const container = $('#table_container')
  const pagerText = container.attr('data-pager')
  assert(container.length === 1 && pagerText !== undefined, 'Missing history pager')
  const pager: unknown = JSON.parse(pagerText)
  const current = getNumber(pager, 'current')
  const pages = getNumber(pager, 'pages')
  const elements = getNumber(pager, 'elements')
  assert(Number.isInteger(current) && current >= 1 && Number.isInteger(pages) && pages >= 0 && Number.isInteger(elements) && elements >= 0 && (pages === 0 ? current === 1 && elements === 0 : current <= pages), 'Invalid history pager')
  const transactions = $('#table_tag_0 tbody tr[data-id]').toArray().map(row => {
    const id = $(row).attr('data-id') as string
    assert(id !== '', 'Missing transaction identity')
    const fields: Record<string, string> = {}
    $(row).find('td[data-field_name]').each((_, cell) => {
      fields[$(cell).attr('data-field_name') as string] = $(cell).text().trim()
    })
    return { id, fields }
  })
  const csrf = $('#filter input[name="_csrf_token"]').val()
  assert(typeof csrf === 'string' && csrf !== '', 'Missing history CSRF token')
  const fields: Array<[string, string]> = []
  $('#filter input[type="hidden"]').each((_, element) => {
    const input = $(element)
    const name = input.attr('name')
    if (name !== undefined && !/^(?:export|usingActions)/.test(name)) fields.push([name, input.val() ?? ''])
  })
  const script = $('script').toArray().map(element => $(element).html()).join('\n')
  const period = script.match(/tableHelper\.initPeriodSelector\(\s*\d+,\s*\d+,\s*(\d+),\s*(\d+)/)
  assert(period !== null, 'Missing history period limits')
  return { transactions, current, pages, elements, csrf, fields, maxDate: Number(period[2]) }
}
