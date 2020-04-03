import * as network from '../../common/network'
import * as tools from './tools'

const urls = new function () {
  this.baseURL = 'https://api.epayments.com/'

  this.userInfo = this.baseURL + 'v1/user'
  this.transactions = this.baseURL + 'v3/Transactions'
}()

const defaultHeaders = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
  Connection: 'keep-alive',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
  Referer: 'https://my.epayments.com/'
}

function getAPIHeaders (tokenType, token) {
  return Object.assign({}, defaultHeaders, {
    Authorization: `${tokenType} ${token}`
  })
}

export async function fetchCardsAndWallets (auth) {
  const params = {
    method: 'GET',
    headers: getAPIHeaders(auth.tokenType, auth.token),
    sanitizeRequestLog: { headers: { Authorization: true } }
  }

  const response = await network.fetchJson(urls.userInfo, params)
  if (response.status !== 200) {
    const message = 'Ошибка при загрузке информации об аккаунтах! '
    console.error(message + JSON.stringify(response))
    throw new Error(message)
  }

  return {
    cards: response.body.cards,
    wallets: response.body.ewallets
  } // Возвращаем только нужные данные
}

export async function fetchTransactions (auth, fromDate, toDate) {
  async function recursive (params, transactions, toFetch, isFirstPage) {
    const response = await network.fetchJson(urls.transactions, params)

    if (response.status !== 200) {
      const message = 'Ошибка при загрузке транзакций! '
      console.error(message + JSON.stringify(response))
      throw new Error(message)
    }

    if (isFirstPage || params.body.skip < toFetch) {
      const body = response.body
      body.transactions.forEach(transaction => transactions.push(transaction))

      const newSkip = params.body.skip + params.body.take
      const newToFetch = body.count

      if (newSkip > newToFetch) {
        return transactions
      } else {
        params.body.skip = newSkip
        return recursive(params, transactions, newToFetch, false)
      }
    } else {
      return transactions
    }
  }

  const requestData = {
    from: tools.getTimestamp(fromDate || new Date(0)),
    till: tools.getTimestamp(toDate || new Date()),
    skip: 0,
    take: 10 // Изменение этого числа не меняет ответ сервера
  }

  const params = {
    method: 'POST',
    headers: getAPIHeaders(auth.tokenType, auth.token),
    body: requestData,
    sanitizeRequestLog: { headers: { Authorization: true } }
  }

  return recursive(params, [], 0, true)
}
