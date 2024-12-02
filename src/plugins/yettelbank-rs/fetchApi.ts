import { fetch, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { getCookies, checkResponseAndSetCookies, checkResponseSuccess } from './helpers'
import { AccountInfo, Preferences, Session, TransactionInfo } from './models'
import { mockedAccountsResponse, mockedTransactionsResponse } from './mocked_responses'
import cheerio from 'cheerio'

const baseUrl = 'https://online.mobibanka.rs/'
const mockResponses = false

async function fetchApi (url: string, options?: FetchOptions): Promise<FetchResponse> {
  return await fetch(baseUrl + url, options ?? {})
}

// First GET request to fetch initial cookies & workflow id for actual auth request
async function initAuthorizationWorkflow (url: string): Promise<string> {
  const parseWorkflowId = (body: unknown): string => {
    const $ = cheerio.load(body as string)
    return $('#WorkflowId').val()
  }

  if (mockResponses) {
    return '673d394c-a31c-4e59-8b55-11b0b05958f3'
  }

  const response = await fetchApi(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    },
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })

  checkResponseAndSetCookies(response)
  return parseWorkflowId(response.body)
}

async function sendAuthRequest (url: string, workflowId: string, username: string, password: string): Promise<FetchResponse> {
  const requestBody = `UserName=${username}&Password=${password}&WorkflowId=${workflowId}&X-Requested-With=XMLHttpRequest`
  return await fetchApi(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: getCookies()
    },
    body: requestBody,
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })
}

// POST request with empty passwords to fetch auth cookies
async function fetchAuth (url: string, workflowId: string, username: string): Promise<void> {
  if (mockResponses) {
    return
  }
  const response = await sendAuthRequest(url, workflowId, username, '')

  try {
    checkResponseAndSetCookies(response)
  } catch (e) {
    if (e instanceof TemporaryError) {
      throw new InvalidLoginOrPasswordError(e.message)
    }
    throw e
  }
}

// Send POST request with login and password
async function fetchLogin (url: string, workflowId: string, username: string, password: string): Promise<void> {
  if (mockResponses) {
    return
  }

  const response = await sendAuthRequest(url, workflowId, username, password)

  try {
    checkResponseAndSetCookies(response)
  } catch (e) {
    if (e instanceof TemporaryError) {
      throw new InvalidLoginOrPasswordError(e.message)
    }
    throw e
  }
}

function extractAccountInfo (loadedCheerio: cheerio.Root, accountId: string): AccountInfo | null {
  const accountElement = loadedCheerio(`#pie-stats-${accountId}`)
  if (accountElement.length === 0) {
    console.debug(`Account ${accountId} not found`)
    return null
  }

  const currency = accountElement.find('option[selected="selected"]').val()
  const availableBalanceAccount = accountElement.find(`#available-balance-stat-${accountId}-${currency}`)
  const name = availableBalanceAccount.find('.stat-name').text().trim()
  const balanceText = availableBalanceAccount.find('.amount-stats.big-nr p').first().text().trim()
  const balance = parseFloat(balanceText.replace(/,/g, ''))

  return {
    id: accountId,
    name: name,
    currency: currency,
    balance: balance
  }
}

export function parseAccounts (body: unknown): AccountInfo[] {
  const accountIds: string[] = []
  const $ = cheerio.load(body as string)

  $('#AccountPicker option').each((_, element) => {
    const accountNumber = $(element).attr('value')
    if (accountNumber !== null && accountNumber !== '') {
      accountIds.push(accountNumber as string)
    }
  })
  const accounts = accountIds.map(id => extractAccountInfo($, id)).filter(Boolean)
  if (accounts.length === 0) {
    throw new Error('No accounts have been parsed')
  }
  return accounts as AccountInfo[]
}

async function fetchAccounts (): Promise<AccountInfo[]> {
  if (mockResponses) {
    return mockedAccountsResponse
  }

  const response = await fetchApi('', {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      Cookie: getCookies()
    }
  })

  checkResponseSuccess(response)
  return parseAccounts(response.body)
}

export function parseTransactions (body: unknown, pending: boolean): TransactionInfo[] {
  function parseDate (dateString: string): Date {
    const [day, month, year] = dateString.split('.').map(Number)
    return new Date(year, month - 1, day)
  }

  const $ = cheerio.load(body as string)

  const transactions: TransactionInfo[] = []

  $('.transactions-table').each((_, table) => {
    $(table).find('table').each((_, transactionTable) => {
      const title = $(transactionTable).find('.transaction-title').text().trim()
      const date = $(transactionTable).find('.transaction-date').text().trim()
      const [amount, currency] = $(transactionTable).find('.transaction-amount').text().trim().split(' ')

      let transactionAmount = parseFloat(amount.replace(/,/g, ''))

      const transactionArrowClass = $(transactionTable).find('.transaction-arrow').attr('class')
      if (transactionArrowClass !== undefined && transactionArrowClass !== '' && transactionArrowClass.includes('expense')) {
        transactionAmount *= -1
      }

      transactions.push({
        isPending: pending,
        date: parseDate(date),
        title: title,
        amount: transactionAmount,
        currency: currency
      })
    })
  })

  return transactions
}

async function fetchTransactions (accountId: string, status: string): Promise<TransactionInfo[]> {
  if (mockResponses) {
    return mockedTransactionsResponse
  }

  const response = await fetchApi(`CustomerAccount/Accounts/Transactions?accountid=${accountId}&status=${status}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      Cookie: getCookies()
    }
  })

  checkResponseSuccess(response)
  return parseTransactions(response.body, status === 'Pending')
}

// ################################################
// #              main functionality              #
// ################################################

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{cookieHeader: string}> {
  const workflowId = await initAuthorizationWorkflow('Identity')

  await fetchAuth('Identity', workflowId, login)
  await fetchLogin('Identity', workflowId, login, password)

  return { cookieHeader: getCookies() }
}

export async function fetchAllAccounts (session: Session): Promise<AccountInfo[]> {
  return await fetchAccounts()
}

export async function fetchProductTransactions (accountId: string, session: Session): Promise<TransactionInfo[]> {
  const executedTransactions = await fetchTransactions(accountId, 'Executed')
  const pendingTransactions = await fetchTransactions(accountId, 'Pending')
  return [...executedTransactions, ...pendingTransactions]
}
