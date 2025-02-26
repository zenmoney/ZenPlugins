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

function extractAccountInfo ($: cheerio.Root, accountId: string): AccountInfo | null {
  try {
    const slide = $(`.slide.${accountId}`)
    if (slide.length === 0) return null

    // Default to RSD currency (most common)
    const currencyElement = slide.find('.currentBalance.currency-RSD')
    if (currencyElement.length === 0) return null

    // Try to get balance directly from the span element
    let balance = 0

    // Find all child nodes and look for text nodes with numeric content
    currencyElement.find('*').each((_, element) => {
      const text = $(element).text().trim()
      if (/^\d+(\.\d+)?$/.test(text)) {
        const parsedValue = parseFloat(text)
        if (!isNaN(parsedValue)) {
          balance = parsedValue
        }
      }
    })

    // If we didn't find it in child elements, try direct text content
    if (balance === 0) {
      const directText = currencyElement.text().trim()
      const matches = directText.match(/\d+(\.\d+)?/)
      if (matches) {
        balance = parseFloat(matches[0])
      }
    }

    if (balance === 0) return null

    return {
      id: accountId,
      title: `${accountId}-RSD`,
      instrument: 'RSD',
      syncIds: [accountId],
      balance
    }
  } catch (e) {
    return null
  }
}

export function parseAccounts (body: unknown): AccountInfo[] {
  const $ = cheerio.load(body as string)
  const accounts: AccountInfo[] = []

  // Find all account slides
  $('.dashboarad-slider .slide').each((_, slideElement) => {
    const accountId = $(slideElement).attr('data-accountid')
    if (accountId == null) return

    // Process each currency for this account
    const currencies: string[] = []

    // First, collect all available currencies for this account
    $(slideElement).find('.col-right.currentBalance').each((_, currencyElement) => {
      const currencyClass = $(currencyElement).attr('class') ?? ''
      const currencyMatch = currencyClass.match(/currency-([A-Z]{3})/)
      if (currencyMatch) {
        currencies.push(currencyMatch[1])
      }
    })

    // Now process each currency
    for (const currency of currencies) {
      const currencyElement = $(slideElement).find(`.col-right.currentBalance.currency-${currency}`)
      if (currencyElement.length === 0) continue

      // Try to get balance directly from the span element
      let balance = 0

      // Find all child nodes and look for text nodes with numeric content
      currencyElement.find('*').each((_, element) => {
        const text = $(element).text().trim()
        if (/^\d+(\.\d+)?$/.test(text)) {
          const parsedValue = parseFloat(text)
          if (!isNaN(parsedValue)) {
            balance = parsedValue
          }
        }
      })

      // If we didn't find it in child elements, try direct text content
      if (balance === 0) {
        const directText = currencyElement.text().trim()
        const matches = directText.match(/\d+(\.\d+)?/)
        if (matches) {
          balance = parseFloat(matches[0])
        }
      }

      if (balance === 0) continue

      accounts.push({
        id: accountId,
        title: `${accountId}-${currency}`,
        instrument: currency,
        syncIds: [accountId],
        balance
      })
    }
  })

  // Fallback to the old method if no accounts were found
  if (accounts.length === 0) {
    const accountIds: string[] = []

    $('#AccountPicker option').each((_, element) => {
      const accountNumber = $(element).attr('value')
      if (accountNumber !== null && accountNumber !== '') {
        accountIds.push(accountNumber as string)
      }
    })

    const oldAccounts = accountIds.map(id => extractAccountInfo($, id)).filter(Boolean)
    if (oldAccounts.length === 0) {
      throw new Error('No accounts have been parsed')
    }
    return oldAccounts as AccountInfo[]
  }

  return accounts
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
  // Check if there are no transactions
  const $ = cheerio.load(body as string)

  // Check for specific messages indicating no transactions
  const noTransactionsMessages = [
    'No transactions for selected period',
    'Нет транзакций за выбранный период',
    'Nema transakcija za izabrani period'
  ]

  const messageElement = $('.no-results')
  if (messageElement.length > 0) {
    const message = messageElement.text().trim()
    if (noTransactionsMessages.some(noTransMsg => message.includes(noTransMsg))) {
      return []
    }
  }

  // Check if transactions table is empty
  if ($('.transactions-table').length === 0) {
    return []
  }

  function parseDate (dateString: string): Date {
    const [day, month, year] = dateString.split('.').map(Number)
    return new Date(year, month - 1, day)
  }

  const transactions: TransactionInfo[] = []

  $('.transactions-table').each((_, table) => {
    $(table).find('table').each((_, transactionTable) => {
      const parsedTitle = $(transactionTable).find('.transaction-title').text().trim()
      const date = $(transactionTable).find('.transaction-date').text().trim()
      const amountText = $(transactionTable).find('.transaction-amount').text().trim()

      if ((date === '') || (amountText === '')) {
        return
      }

      // Extract currency using regex to handle different formats
      const currencyMatch = amountText.match(/([A-Z]{3})$/)
      if (!currencyMatch) {
        return
      }

      const parsedCurrency = currencyMatch[1]
      // Remove currency from amount text and parse
      const amountWithoutCurrency = amountText.replace(parsedCurrency, '').trim()
      let parsedTransactionAmount = parseFloat(amountWithoutCurrency.replace(/,/g, ''))

      if (isNaN(parsedTransactionAmount)) {
        return
      }

      const transactionArrowClass = $(transactionTable).find('.transaction-arrow').attr('class')
      if (transactionArrowClass !== undefined && transactionArrowClass !== '' && transactionArrowClass.includes('expense')) {
        parsedTransactionAmount *= -1
      }

      transactions.push({
        isPending: pending,
        date: parseDate(date),
        title: parsedTitle,
        amount: parsedTransactionAmount,
        currency: parsedCurrency
      })
    })
  })

  return transactions
}

export function parseTotalPages (body: unknown): number {
  const $ = cheerio.load(body as string)

  // Check for specific messages indicating no transactions
  const noTransactionsMessages = [
    'No transactions for selected period',
    'Нет транзакций за выбранный период',
    'Nema transakcija za izabrani period'
  ]

  const messageElement = $('.no-results')
  if (messageElement.length > 0) {
    const message = messageElement.text().trim()
    if (noTransactionsMessages.some(noTransMsg => message.includes(noTransMsg))) {
      return 0
    }
  }

  // Check if transactions table is empty
  if ($('.transactions-table').length === 0) {
    return 0
  }

  // Check for pagination
  const pageInfo = $('.current-page').text().trim()
  const match = pageInfo.match(/Page \d+ from (\d+)/)

  if ((match?.[1]) != null) {
    return parseInt(match[1], 10)
  }

  // If there are transactions but no pagination, return 1
  if ($('.transactions-table').length > 0) {
    return 1
  }

  return 0
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

async function fetchTransactions (accountId: string, status: string, fromDate: Date, toDate: Date): Promise<TransactionInfo[]> {
  if (mockResponses) {
    return mockedTransactionsResponse
  }

  const response = await fetchTransactionsInternal(accountId, status, fromDate, toDate)
  const totalPages = parseTotalPages(response.body)

  // If no transactions, return empty array
  if (totalPages === 0) {
    return []
  }

  const transactions: TransactionInfo[] = parseTransactions(response.body, status === 'Pending')

  for (let page = 1; page < totalPages; page++) {
    const pageResponse = await fetchTransactionsInternal(accountId, status, fromDate, toDate, page)
    transactions.push(...parseTransactions(pageResponse.body, status === 'Pending'))
  }

  return transactions
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

export async function fetchProductTransactions (accountId: string, session: Session, fromDate: Date, toDate: Date): Promise<TransactionInfo[]> {
  // Extract the base account ID if it contains a currency suffix
  const baseAccountId = accountId.split('-')[0]
  const currencySuffix = accountId.includes('-') ? accountId.split('-')[1] : null

  // Get the account info to determine which currency we're requesting
  const accounts = await fetchAccounts()

  // Find the specific account we're requesting transactions for
  let requestedAccount: AccountInfo | undefined

  if (currencySuffix != null) {
    // If we have a currency suffix, find the account with matching ID and currency
    requestedAccount = accounts.find(account =>
      account.id === baseAccountId && account.instrument === currencySuffix
    )
  } else {
    // If no currency suffix, just match the ID
    requestedAccount = accounts.find(account => account.id === accountId)
  }

  if (!requestedAccount) {
    return [] // If account not found, return empty array
  }

  // Only fetch transactions once, using the base account ID
  const executedTransactions = await fetchTransactions(baseAccountId, 'Executed', fromDate, toDate)

  const pendingTransactions = await fetchTransactions(baseAccountId, 'Pending', fromDate, toDate)

  // Combine all transactions
  const allTransactions = [...executedTransactions, ...pendingTransactions]

  // Filter transactions to only include those matching the account's currency
  const targetCurrency = requestedAccount.instrument

  const filteredTransactions = allTransactions.filter(transaction => {
    const match = transaction.currency === targetCurrency
    if (!match) {
      console.log(`Skipping transaction with currency ${transaction.currency} (account currency is ${targetCurrency})`)
    }
    return match
  })

  return filteredTransactions
}
