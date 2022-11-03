import { fetch } from '../../common/network'
import { InvalidLoginOrPasswordError } from '../../errors'
import { load } from 'cheerio'

const baseUrl = 'https://pay.kaspi.kz/'

async function fetchUrl (url, options, predicate = () => true, error = (message) => console.assert(false, message)) {
  const response = await fetch(baseUrl + url, options ?? {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
    }
  })

  if (predicate) {
    validateResponse(response, response => predicate(response), error)
  }

  if (response.body.success === false) {
    const errorDescription = response.body.message
    const errorMessage = 'Ответ банка: ' + errorDescription
    if (errorDescription.indexOf('Неправильный номер или пароль') >= 0) {
      throw new InvalidLoginOrPasswordError(errorMessage)
    }
    throw new TemporaryError(errorMessage)
  }

  return response
}

function validateResponse (response, predicate, error) {
  if (!predicate || !predicate(response)) {
    error('non-successful response')
  }
}

export async function fetchLogin ({ login, password }) {
  const responseFirst = await fetchUrl('', {
    method: 'GET'
  }, response => response.status === 200)

  const $ = load(responseFirst.body)
  let csrfToken = $('input[id="csrfToken"]').attr('value')

  let cookies = await responseFirst.headers['set-cookie']

  login = ZenMoney.getData('login') ? ZenMoney.getData('login') : login
  ZenMoney.setData('login', login)
  password = ZenMoney.getData('password') ? ZenMoney.getData('password') : password
  ZenMoney.setData('password', password)
  ZenMoney.saveData()

  const responseSignIn = await fetchUrl('api/auth/sign-in', {
    method: 'POST',
    headers: {
      'X-Csrf-Token': csrfToken,
      Cookie: cookies,
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
      Cookie: cookies,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    body: `ProfileId=${profileId}`
  }, response => response.success, message => new TemporaryError(message))

  cookies = await response.headers['set-cookie']

  return {
    'X-CSRF-Token': csrfToken,
    Cookie: cookies
  }
}

export async function fetchAccounts () {
  const response = await fetchUrl('', {
    method: 'GET'
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

export async function fetchTransactions (auth, account, startDate, endDate, TransactionType, LastTransactionId) {
  if (LastTransactionId === undefined) {
    const response = await fetchUrl(account, {
      method: 'GET',
      headers: {
        'X-CSRF-Token': auth['X-CSRF-Token'],
        Cookie: auth.Cookie,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: `period=custom&url=account&startDate=${startDate}&endDate=${endDate}&accountId=${account}&TransactionType=${TransactionType}`
    }, response => response.status === 200)

    return response
  } else {
    const response = await fetchUrl(account, {
      method: 'GET',
      headers: {
        'X-CSRF-Token': auth['X-CSRF-Token'],
        Cookie: auth.Cookie,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: `period=custom&url=account&startDate=${startDate}&endDate=${endDate}&accountId=${account}&TransactionType=${TransactionType}LastTransactionId=${LastTransactionId}`
    }, response => response.status === 200)

    return response
  }
}
