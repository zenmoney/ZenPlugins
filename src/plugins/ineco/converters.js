import cheerio from 'cheerio'
import moment from 'moment'
import { parseCSV } from './helpers'

const getAccountType = (type) => type === 'Card' ? 'ccard' : 'checking'

const dateRegexp = /^.*(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}).*$/
const currencyConversionRegexp = /^.* ([0-9.]+) ([A-Z]+) \/.* ([0-9.]+) ([A-Z]+).*$/
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

export const parseAccounts = (html) => {
  html = html.replace(/\r?\n|\r/g, '')
  const $ = cheerio.load(html)
  const accounts = []

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

  return accounts
}

/**
 *
 * @param {AccountHelper} ah
 * @param account
 * @param csv
 * @returns {[]}
 */
export const parseTransactions = (ah, account, csv) => {
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

  console.log(`scraped ${trans.length} transactions for account ${account.id}`, {
    csv: csv.substr(0, 100)
  })

  return trans
}

/**
 *
 * @param {AccountHelper} ah
 * @param {object} transactions
 * @returns {[]}
 */
export const processTransactions = (ah, transactions) => {
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
