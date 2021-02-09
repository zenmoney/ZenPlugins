/**
 * @author Karpov Anton <anton@karpoff.pro>
 */
import cheerio from 'cheerio'
import moment from 'moment'
import { Session } from '../../common/session'
import { parseCSV } from '../../common/utils'
import { AccountHelper } from './helpers'

const getAccountType = (type) => {
  return type === 'Card' ? 'ccard' : 'checking'
}

const formatNumber = value => {
  const str = `${value}`

  return (str.length === 1 ? '0' : '') + str
}

const dateRegexp = /^.*(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}).*$/
const currencyConversionRegexp = /^.* ([0-9.]+) ([A-Z]+) \/.* ([0-9.]+) ([A-Z]+).*$/
const formatDate = date => `${formatNumber(date.getDate())}/${formatNumber(date.getMonth() + 1)}/${date.getFullYear()}`
const parseAmount = amount => parseFloat(amount.replace(/\s/g, '').replace(/,/g, ''))
const parseTransactionDate = (details, date) => {
  const dtls = details.match(dateRegexp)

  if (!dtls) {
    const dateParts = date.split('/')

    if (dateParts.length >= 3 && dateParts[0] && dateParts[1] && dateParts[2]) {
      return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
    }

    return undefined
  }

  return moment(dtls[1], 'DD/MM/YYYY hh:mm:ss').valueOf()
}

/**
 *
 * @param {AccountHelper} ah
 * @param account
 * @param csv
 * @returns {[]}
 */
const parseTransactions = (ah, account, csv) => {
  const transactions = parseCSV(csv).filter(line => !!line[0] && !isNaN(line[0]))
  const trans = []

  for (let i = 0; i < transactions.length; i++) {
    // eslint-disable-next-line no-unused-vars
    const [nn, id, transactionDate, currency, income, expense, trAccount, payee, details] = transactions[i]

    const tr = {
      _fromAccount: account.id,
      id,
      payee,
      date: parseTransactionDate(details, transactionDate),
      comment: details
    }

    if (income && income !== '.00') {
      tr.income = parseAmount(income)
      tr.outcome = 0
    } else {
      tr.outcome = parseAmount(expense)
      tr.income = 0
    }

    if (tr.income) {
      tr.incomeAccount = account.id

      if (account.id !== trAccount && ah.has(trAccount)) {
        tr.outcome = tr.income
        tr.outcomeAccount = trAccount
      } else {
        tr.outcomeAccount = account.id
      }
    } else {
      tr.outcomeAccount = account.id

      if (account.id !== trAccount && ah.has(trAccount)) {
        tr.income = tr.outcome
        tr.incomeAccount = trAccount
      } else {
        tr.incomeAccount = account.id
      }
    }

    if (ah.isDifferentCurrencies(tr.incomeAccount, tr.outcomeAccount)) {
      // we need to set correct income/outcome when transfer in different currencies
      // trying to get this info from details
      const conversion = details.match(currencyConversionRegexp)

      if (conversion) {
        const incomeCurrency = ah.currency(tr.incomeAccount)
        const outcomeCurrency = ah.currency(tr.outcomeAccount)
        const currentCurrency = ah.currency(account.id)

        if (outcomeCurrency === currentCurrency) {
          tr.income = parseFloat(conversion[3])
          tr.opOutcome = tr.income
          tr.opOutcomeInstrument = incomeCurrency
        } else {
          tr.outcome = parseFloat(conversion[1])
          tr.opIncome = tr.outcome
          tr.opIncomeInstrument = outcomeCurrency
        }
      }
    }

    trans.push(tr)
  }

  return trans
}

/**
 *
 * @param {AccountHelper} ah
 * @param {object} transactions
 * @returns {[]}
 */
const processTransactions = (ah, transactions) => {
  const processed = []
  const processedIds = new Set()

  for (let tr of transactions) {
    if (processedIds.has(tr.id)) {
      continue
    }

    if (ah.isDifferentCurrencies(tr.incomeAccount, tr.outcomeAccount)) {
      // when we transfer money between accounts with different currencies, two transactions with different ids will be shown
      // in ths case we should find second transaction, remove it and set currencies accordingly
      const mirrored = transactions.find(t => t.id !== tr.id && t.comment === tr.comment)

      if (mirrored) {
        processedIds.add(mirrored.id)

        const outcomeTransaction = tr.outcomeAccount === tr._fromAccount ? tr : mirrored
        const incomeTransaction = tr.incomeAccount === tr._fromAccount ? tr : mirrored

        tr = {
          ...tr,
          outcome: outcomeTransaction.outcome,
          opOutcome: incomeTransaction.outcome,
          income: incomeTransaction.income,
          opIncome: outcomeTransaction.income
        }
      }
    }

    processedIds.add(tr.id)
    processed.push(tr)
  }

  return processed
}

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
