/**
 * @author Karpov Anton <anton@karpoff.pro>
 */
import { Session } from './session'
import { parseAccounts, parseTransactions, processTransactions } from './converters'
import { AccountHelper } from './helpers'

const formatNumber = value => {
  const str = `${value}`

  return (str.length === 1 ? '0' : '') + str
}

const formatDate = date => `${formatNumber(date.getDate())}/${formatNumber(date.getMonth() + 1)}/${date.getFullYear()}`

const scrapeAccountTransactions = async (ah, account, accountKey, session, fromDate, toDate) => {
  const response = await session.postForm('/AccountStatement/Export', {
    export_filter: `${formatDate(fromDate)};${formatDate(toDate)};${accountKey};3`,
    export_sorting: '',
    btnExportCsv: 'btnExportCsv'
  })

  return parseTransactions(ah, account, response)
}

const scrapeCardTransactions = async (ah, account, accountKey, session, fromDate, toDate) => {
  const response = await session.postForm('/CardStatement/Export', {
    export_filter: `${formatDate(fromDate)};${formatDate(toDate)};${accountKey};3`,
    export_sorting: '',
    btnExportCsv: 'btnExportCsv'
  })

  return parseTransactions(ah, account, response)
}

export async function scrape ({ preferences, fromDate, toDate }) {
  const session = new Session('https://online.inecobank.am', {
    headers: {
      Host: 'online.inecobank.am',
      Referer: 'https://online.inecobank.am/'
    },
    cookies: {
      _iob_culture: 'en-US'
    }
  })

  const html = await session.postForm('/User/LogOn', {
    UserName: preferences.login,
    Password: preferences.password
  })

  let transactions = []
  const accounts = parseAccounts(html)
  const ah = new AccountHelper(accounts)

  for (const account of accounts) {
    const response = await session.request(`/Account/GetStatement?id=${account.id.slice(account.id.length - 11)}&accountType=0`, { redirect: 'manual' })
    const accountKey = (response.headers.location || '').split('/').pop()

    if (!accountKey) {
      continue
    }

    const transactionScraper = account.type === 'ccard' ? scrapeCardTransactions : scrapeAccountTransactions
    const trans = await transactionScraper(ah, account, accountKey, session, fromDate, toDate || new Date())

    transactions = [...transactions, ...trans]
  }

  return { accounts, transactions: processTransactions(ah, transactions) }
}
