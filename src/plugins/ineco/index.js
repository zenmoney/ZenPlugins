/**
 * @author Karpov Anton <anton@karpoff.pro>
 */
import cheerio from 'cheerio'
import { Session } from './session'
import { parseTransactions, processTransactions } from './converters'
import { AccountHelper } from './helpers'

const getAccountType = (type) => {
  return type === 'Card' ? 'ccard' : 'checking'
}

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

  let html = await session.postForm('/User/LogOn', {
    UserName: preferences.login,
    Password: preferences.password
  })

  html = html.replace(/\r?\n|\r/g, '')
  const $ = cheerio.load(html)
  const accounts = []
  let transactions = []

  $('#gvOverviewAccounts').find('.dxgvDataRow_Youthful').each((i, elm) => {
    const tds = Array.from($(elm).find('td'))
    const id = $(tds[0]).text()

    if (!id) {
      return
    }

    const title = $('td.colProdName', elm)
    const balance = $(tds[3]).text().trim().split(' ')
    const type = title.attr('title')

    if (!balance[1]) {
      return
    }

    accounts.push({
      id: id,
      title: title.text(),
      syncID: [id.slice(id.length - 4)],

      instrument: balance[1],
      type: getAccountType(type),
      balance: Number(balance[0].replace(/[^\d.-]/g, ''))
    })
  })

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
