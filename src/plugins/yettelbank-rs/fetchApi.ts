import { fetch, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { getCookies, checkResponseAndSetCookies, checkResponseSuccess } from './helpers'
import { AccountInfo, Preferences, Session, TransactionInfo } from './models'
import { mockedAccountsResponse, mockedTransactionsResponse } from './mocked_responses'
import cheerio from 'cheerio'
import moment from 'moment'

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

function * extractAccountInfo (loadedCheerio: cheerio.Root, accountId: string): Generator<AccountInfo | null> {
  const accountElements = loadedCheerio(`#pie-stats-${accountId}`)
  if (accountElements.length === 0) {
    console.debug(`Account ${accountId} not found`)
    return null
  }

  for (const el of accountElements.toArray()) {
    const $accountElement = loadedCheerio(el)
    const balanceDiv = $accountElement.find(`div[id^="total available-balance-stat-${accountId}-"]`).first()

    if (balanceDiv.length !== 0) {
      const fullId = balanceDiv.attr('id')

      if (fullId !== null && fullId !== undefined) {
        const accountName = fullId.replace('total available-balance-stat-', '')
        const accountCurrency = accountName.split('-')[1]
        const balanceText = balanceDiv.find('.amount-stats.big-nr p').first().text().trim()
        const activeCurrency = balanceDiv.find('option[selected="selected"]').val()
        // for backward compatibility
        const newAccountId = activeCurrency === accountCurrency ? accountId : `${accountId}-${accountCurrency}`

        yield {
          id: newAccountId,
          name: `${accountId}-${accountCurrency}`,
          currency: accountCurrency,
          balance: parseFloat(balanceText.replace(/,/g, ''))
        }
      }
    }
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
  const accounts = accountIds.flatMap(id => Array.from(extractAccountInfo($, id))).filter(Boolean)
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

export function parseTransactions (body: unknown, pending: boolean, currencyFilter: string): TransactionInfo[] {
  function parseDate (dateString: string): Date {
    const [day, month, year] = dateString.split('.').map(Number)
    return new Date(year, month - 1, day)
  }

  const $ = cheerio.load(body as string)

  const transactions: TransactionInfo[] = []

  $('.transactions-table').each((_, table) => {
    $(table).find('table').each((_, transactionTable) => {
      const parsedTitle = $(transactionTable).find('.transaction-title').text().trim()
      const date = $(transactionTable).find('.transaction-date').text().trim()
      const [amount, parsedCurrency] = $(transactionTable).find('.transaction-amount').text().trim().split(' ')

      let parsedTransactionAmount = parseFloat(amount.replace(/,/g, ''))

      const transactionArrowClass = $(transactionTable).find('.transaction-arrow').attr('class')
      if (transactionArrowClass !== undefined && transactionArrowClass !== '' && transactionArrowClass.includes('expense')) {
        parsedTransactionAmount *= -1
      }
      if (parsedCurrency === currencyFilter) {
        transactions.push({
          isPending: pending,
          date: parseDate(date),
          title: parsedTitle,
          amount: parsedTransactionAmount,
          currency: parsedCurrency
        })
      }
    })
  })

  return transactions
}

async function fetchTransactionsInternal (accountId: string, status: string, fromDate: Date, toDate: Date, pageNumber = 0): Promise<FetchResponse> {
  const dateFrom = moment(fromDate).format('DD%2FMM%2FYYYY')
  const dateTo = moment(toDate).format('DD%2FMM%2FYYYY')
  const requestBody = `PageNumber=${pageNumber}&PageSize=&Report=&PaymentDescription=&DateFrom=${dateFrom}&DateTo=${dateTo}&CurrencyList_input=All+currencies&CurrencyList=&AmountFrom=&AmountTo=&Direction=&TransactionType=-1&AccountPicker=${accountId}&RelatedCardPicker=-1&CounterParty=&StandingOrderId=&SortBy=ValueDate&SortAsc=Desc&GeoLatitude=&GeoLongitude=&Radius=2&StatusPicker=${status}&ViewPicker=List&X-Requested-With=XMLHttpRequest`

  const response = await fetchApi('CustomerAccount/Accounts/Transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: `https://online.mobibanka.rs/CustomerAccount/Accounts/Transactions?accountid=${accountId}&status=${status}`,
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: getCookies()
    },
    body: requestBody,
    sanitizeResponseLog: { headers: { 'set-cookie': true } }
  })

  checkResponseSuccess(response)
  return response
}

async function fetchTransactions (accountId: string, currency: string, status: string, fromDate: Date, toDate: Date): Promise<TransactionInfo[]> {
  if (mockResponses) {
    return mockedTransactionsResponse
  }

  function parseTotalPages (body: unknown): number {
    const $ = cheerio.load(body as string)
    const pageInfo = $('.current-page').text().trim()
    const match = pageInfo.match(/Page \d+ from (\d+)/)
    const totalPages = match?.[1]
    if (totalPages !== undefined && totalPages !== null && totalPages !== '') {
      return parseInt(totalPages, 10)
    }
    return 0
  }

  // getting raw accountId for parsing
  const rawAccountId = accountId.replace(`-${currency}`, '')

  const response = await fetchTransactionsInternal(rawAccountId, status, fromDate, toDate)
  const totalPages = parseTotalPages(response.body)

  const transactions: TransactionInfo[] = parseTransactions(response.body, status === 'Pending', currency)

  for (let page = 1; page < totalPages - 1; page++) {
    const pageResponse = await fetchTransactionsInternal(rawAccountId, status, fromDate, toDate, page)
    transactions.push(...parseTransactions(pageResponse.body, status === 'Pending', currency))
  }

  return transactions
}

// ################################################
// #              main functionality              #
// ################################################

export async function fetchAuthorization ({ login, password }: Preferences): Promise<{ cookieHeader: string }> {
  const workflowId = await initAuthorizationWorkflow('Identity')

  await fetchAuth('Identity', workflowId, login)
  await fetchLogin('Identity', workflowId, login, password)

  return { cookieHeader: getCookies() }
}

export async function fetchAllAccounts (session: Session): Promise<AccountInfo[]> {
  return await fetchAccounts()
}

export async function fetchProductTransactions (accountId: string, currency: string, session: Session, fromDate: Date, toDate: Date): Promise<TransactionInfo[]> {
  const executedTransactions = await fetchTransactions(accountId, currency, 'Executed', fromDate, toDate)
  const pendingTransactions = await fetchTransactions(accountId, currency, 'Pending', fromDate, toDate)
  return [...executedTransactions, ...pendingTransactions]
}
