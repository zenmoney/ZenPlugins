import { fetch } from '../../common/network'
import { InvalidLoginOrPasswordError, TemporaryError } from '../../errors'
import { load } from 'cheerio'
import setCookie from 'set-cookie-parser'

const baseUrl = 'https://pay.kaspi.kz/'

function readCookies () {
  const cookies = ZenMoney.getData('cookies', {})
  let cookiesString = ''
  for (const name in cookies) {
    const value = cookies[name]
    if (cookiesString) {
      cookiesString += '; '
    }
    cookiesString += name + '=' + value
  }
  return cookiesString
}

function updateCookies (setCookieString) {
  const cookiesObj = ZenMoney.getData('cookies', {})
  const setCookies = setCookie.parse(setCookie.splitCookiesString(setCookieString))
  for (const cookie of setCookies) {
    cookiesObj[cookie.name] = cookie.value
  }
  ZenMoney.setData('cookies', cookiesObj)
  ZenMoney.saveData()
}

async function fetchUrl (url, options) {
  const cookies = readCookies()
  const response = await fetch(baseUrl + url, options ?? {
    sanitizeResponseLog: { headers: { 'set-cookie': true } },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
      ...cookies && { Cookie: cookies }
    }
  })

  if (response.headers && response.headers['set-cookie']) {
    updateCookies(response.headers['set-cookie'])
  }

  return response
}

export async function fetchLogin ({ login, password }) {
  const responseFirst = await fetchUrl('', {
    method: 'GET'
  }, response => response.status === 200)

  const $ = load(responseFirst.body)
  let csrfToken = $('input[id="csrfToken"]').attr('value')

  const responseSignIn = await fetchUrl('api/auth/sign-in', {
    method: 'POST',
    headers: {
      'X-Csrf-Token': csrfToken,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: `Login=${login}&Password=${password}`
  }, response => response.status === 200)

  const obj = JSON.parse(responseSignIn.body)

  if (!obj.success) {
    throw new InvalidLoginOrPasswordError()
  }

  csrfToken = await responseSignIn.headers['x-csrf-token']

  const profileId = await obj.data.profiles[0].profileId

  const response = await fetchUrl('api/auth/choose-organization', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: `ProfileId=${profileId}`
  }, response => response.success === false)

  const resObj = JSON.parse(response.body)

  if (resObj.success === false) {
    throw new TemporaryError(resObj.message)
  }

  return {
    'X-CSRF-Token': csrfToken
  }
}

export async function fetchAccounts (auth) {
  const response = await fetchUrl('', {
    method: 'GET',
    headers: {
      'X-CSRF-Token': auth['X-CSRF-Token']
    }
  }, response => response.status === 200)

  const accounts = []

  const $ = load(await response.body)
  $('a[id="hlAccountDetails"]').each((i, el) => {
    const accountId = $(el).attr('href').split('/')[1]
    const accountBallance = $(el).find('span').text().trim().split(' ')[0]
    let accountCurrency = $(el).find('span').text().trim().split(' ')[1]
    if (accountCurrency === '₸') {
      accountCurrency = 'KZT'
    } else if ($(el).find('span').text().trim().split(' ')[1] === '$') {
      accountCurrency = 'USD'
    } else if ($(el).find('span').text().trim().split(' ')[1] === '€') {
      accountCurrency = 'EUR'
    } else if ($(el).find('span').text().trim().split(' ')[1] === '£') {
      accountCurrency = 'GBP'
    } else if ($(el).find('span').text().trim().split(' ')[1] === '₽') {
      accountCurrency = 'RUB'
    }
    const accountTitle = $(el).find('div[class="account-widget-item-number"]').text().trim()
    const account = {
      id: accountId,
      balance: accountBallance,
      currency: accountCurrency,
      title: accountTitle
    }
    accounts.push(account)
  })

  return accounts
}

const getTransactions = async (auth, startDate, endDate, account, lastTransactionId) => {
  const response = await fetchUrl('api/statement/account', {
    method: 'POST',
    headers: {
      'X-CSRF-Token': auth['X-CSRF-Token'],
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: `period=custom&url=account&startDate=${await formatDate(startDate)}&endDate=${await formatDate(endDate)}&accountId=${account.id}&TransactionType=&LastTransactionId=${lastTransactionId}`
  })
  return JSON.parse(await response.body)
}

export async function fetchTransactions (auth, account, startDate, endDate) {
  const chuncSize = 20
  const transactions = []
  const lastTransactionId = ''

  const response = await getTransactions(auth, startDate, endDate, account, lastTransactionId)

  const remnantCount = response.remnantCount

  for (const transaction of response.transactions) {
    transactions.push(transaction)
  }

  if (response.remnantCount >= chuncSize) {
    let lastId = ''
    for (let i = 0; i <= remnantCount; i += chuncSize) {
      const temp = await getTransactions(auth, startDate, endDate, account, lastId)
      if (lastId === '') {
        lastId = temp.transactions.at(-1).tranId
        for (const transaction of temp.transactions) {
          transactions.push(transaction)
        }
      } else {
        let transactionsArray = temp.transactions.map(transaction => transaction.tranId)
        transactionsArray = [...new Set(transactionsArray)]
        lastId = transactionsArray.at(-1)
        for (const transaction of temp.transactions) {
          transactions.push(transaction)
        }
      }
    }
  }

  return transactions
}

async function padTo2Digits (num) {
  return num.toString().padStart(2, '0')
}

async function formatDate (date) {
  return [
    await padTo2Digits(date.getDate()),
    await padTo2Digits(date.getMonth() + 1),
    date.getFullYear()
  ].join('.')
}
