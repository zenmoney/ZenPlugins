/**
 * @author Karpov Anton <anton@karpoff.pro>
 */
import { InvalidOtpCodeError, InvalidPreferencesError, TemporaryError } from '../../errors'
import { openWebViewAndInterceptRequest } from '../../common/network'
import { Session } from './session'
import { parseAccounts, parseTransactions, processTransactions } from './converters'
import { AccountHelper, BASE_URL, isCloudflareChallenge, parseCookieHeader, parseFormData } from './helpers'

const formatNumber = value => {
  const str = `${value}`

  return (str.length === 1 ? '0' : '') + str
}

const formatDate = date => `${formatNumber(date.getDate())}/${formatNumber(date.getMonth() + 1)}/${date.getFullYear()}`

const scrapeAccountTransactions = async (ah, account, accountKey, session, fromDate, toDate) => {
  console.log(`fetching transactions for ${account.id} (${accountKey}) savings account`, { fromDate, toDate })

  const response = await session.postFormBinary('/AccountStatement/Export', {
    export_filter: `${formatDate(fromDate)};${formatDate(toDate)};${accountKey};3`,
    export_sorting: '',
    btnExportCsv: 'btnExportCsv'
  })

  return parseTransactions(ah, account, response)
}

const scrapeCardTransactions = async (ah, account, accountKey, session, fromDate, toDate) => {
  console.log(`fetching transactions for ${account.id} (${accountKey}) card account`, { fromDate, toDate })

  const response = await session.postFormBinary('/CardStatement/Export', {
    export_filter: `${formatDate(fromDate)};${formatDate(toDate)};${accountKey};3`,
    export_sorting: '',
    btnExportCsv: 'btnExportCsv'
  })

  return parseTransactions(ah, account, response)
}

async function continueScrapeWithAccounts (session, accounts, preferences, fromDate, toDate) {
  if (!accounts.length) {
    throw new TemporaryError('no accounts found')
  }
  const ah = new AccountHelper(accounts)
  console.log(`got ${accounts.length}`, { accounts })
  let transactions = []
  for (const account of accounts) {
    const response = await session.request(`/Account/GetStatement?id=${account.id.slice(account.id.length - 11)}&accountType=0`, { redirect: 'manual' })
    const accountKey = (response.headers.location || response.headers.Location || '').split('/').pop()
    if (!accountKey) {
      console.log(`scrapping account ${account.id} is skipped because of no key`, { redirectUrl: response.headers.location })
      continue
    }
    const transactionScraper = account.type === 'card' ? scrapeCardTransactions : scrapeAccountTransactions
    const trans = await transactionScraper(ah, account, accountKey, session, fromDate, toDate || new Date())
    transactions = [...transactions, ...trans]
  }
  return { accounts, transactions: processTransactions(ah, transactions) }
}

export async function scrape ({ preferences, fromDate, toDate }) {
  if (!preferences.login || !preferences.password) {
    throw new InvalidPreferencesError()
  }

  const session = new Session('https://online.inecobank.am', {
    headers: {
      Host: 'online.inecobank.am',
      Referer: 'https://online.inecobank.am/'
    },
    cookies: {
      _iob_culture: 'en-US'
    },
    cookieKey: 'session'
  })

  let loginPageHtml = await session.get('/User/LogOn')

  if (isCloudflareChallenge(loginPageHtml)) {
    if (!ZenMoney.openWebView) {
      throw new TemporaryError(
        'Сайт банка использует защиту Cloudflare. Войдите в интернет-банк через приложение ZenMoney (в приложении откроется браузер для входа).'
      )
    }
    console.log('Cloudflare detected, opening WebView for login')
    await openWebViewAndInterceptRequest({
      url: BASE_URL + '/User/LogOn',
      intercept: (request) => {
        if (request.url.indexOf(BASE_URL) !== 0) return null
        const path = request.url.slice(BASE_URL.length).split('?')[0]
        if (path === '/User/LogOn' || path.startsWith('/User/')) return null
        const cookieHeader = request.headers && (request.headers.cookie || request.headers.Cookie)
        if (!cookieHeader) return null
        const cookies = { _iob_culture: 'en-US', ...parseCookieHeader(cookieHeader) }
        ZenMoney.setData('scrape/session', JSON.stringify(cookies))
        ZenMoney.saveData()
        return { cookies }
      }
    })
    const sessionAfterWebView = new Session('https://online.inecobank.am', {
      headers: { Host: 'online.inecobank.am', Referer: 'https://online.inecobank.am/' },
      cookies: { _iob_culture: 'en-US' },
      cookieKey: 'session'
    })
    loginPageHtml = await sessionAfterWebView.get('/')
    const accounts = parseAccounts(loginPageHtml)
    return await continueScrapeWithAccounts(sessionAfterWebView, accounts, preferences, fromDate, toDate)
  }

  const logonForm = parseFormData(loginPageHtml, '[action="/User/LogOn"]')
  if (!logonForm) {
    throw new TemporaryError('Could not find login form on page')
  }

  let html = await session.postForm('/User/LogOn', {
    ...logonForm.inputs,
    UserName: preferences.login,
    Password: preferences.password
  })

  let accounts = parseAccounts(html)

  if (!accounts.length) {
    const tokenForm = parseFormData(html, '[action="/User/LogOnSecurityToken"]')

    if (!tokenForm) {
      throw new TemporaryError('incorrect flow, need to fix scraper')
    }

    console.log('need auth token')

    await session.postForm('/User/_TokenSMS_CallBackPanel', {
      DXCallbackName: 'cbpTokenSMS',
      DXCallbackArgument: 'c0:',
      UserName: tokenForm.inputs.UserName,
      Password: tokenForm.inputs.Password,
      ProviderAction: 1
    })

    const sms = await ZenMoney.readLine('Введите код из смс', {
      time: 120000
    })

    if (sms === '') {
      throw new InvalidOtpCodeError()
    }

    html = await session.postForm('/User/LogOnSecurityToken', {
      ...tokenForm.inputs,
      Token: sms
    })

    accounts = parseAccounts(html)
  }

  return await continueScrapeWithAccounts(session, accounts, preferences, fromDate, toDate)
}
