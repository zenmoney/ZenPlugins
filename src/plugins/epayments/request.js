import * as network from '../../common/network'

var urls = new function () {
  this.baseURL = 'https://api.epayments.com/'
  this.cabinetURL = 'https://my.epayments.com/'

  this.token = this.baseURL + 'token'
  this.transactions = this.baseURL + 'v2/Transactions'
}()

function defaultHeaders () {
  return {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
    'Connection': 'keep-alive',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
  }
}

export async function authenthicate (login, password) {
  async function readCode (message) {
    const otp = await ZenMoney.readLine(message)
    if (!otp) {
      throw new Error('Без OTP-кода не смогу =[')
    } else {
      return otp
    }
  }

  async function fetch (login, password, otp) {
    const authData = {
      grant_type: 'password_otp',
      username: login,
      password: password,
      otpcode: otp
    }

    const authHeaders = Object.assign({}, defaultHeaders(), {
      'Referer': urls.cabinetURL,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
    })

    const params = {
      'method': 'POST',
      'headers': authHeaders,
      'body': new URLSearchParams(authData).toString(),
      'parse': (body) => body === '' ? undefined : JSON.parse(body)
    }

    return network.fetch(urls.token, params)
  }

  async function fetchRetry (login, password, otp) {
    const response = await fetch(login, password, otp)

    if (response.ok) {
      return { 'token_type': response.token_type, 'access_token': response.access_token }
    } else {
      const errorCode = response.body ? response.body.error : undefined

      if (errorCode === 'otp_code_required') {
        console.log("i'm, here!")
        const otp = await readCode('Введите одноразовый пароль')
        return fetchRetry(login, password, otp)
      } else if (errorCode === 'otp_code_invalid') {
        const otp = await readCode('Одноразовый пароль введен неверно. Попробуйте еще раз')
        return fetchRetry(login, password, otp)
      } else if (errorCode === 'bot_detected') {
        console.error(response)
        throw new Error('Банк заподозрил в вас бота, попробуйте зайти через браузер, потом снова проведите синхронизацию в Zenmoney')
      } else if (errorCode === 'invalid_grant') {
        console.error(response)
        throw new Error('Ваш счет временно заблокирован. Попробуйте войти через час')
      } else {
        console.error('Что-то пошло не так ' + JSON.stringify(response))
      }
    }
  }

  return fetchRetry(login, password)
}

export async function getTransactions (auth, pageParams) {
  async function recursive (params, transactions, toFetch, isFirstPage) {
    const response = await network.fetchJson(urls.transactions, params)
    if (isFirstPage || params.body.skip < toFetch) {
      const newToFetch = response.count
      response.transactions.forEach(transaction => transactions.push(transaction))
      params.body.skip = params.body.skip + params.body.take

      return recursive(params, transactions, newToFetch, false)
    } else {
      return transactions
    }
  }

  const requestData = {
    from: getTimestamp(pageParams.fromDate) || 1,
    till: getTimestamp(pageParams.toDate) || getTimestamp(Date.now()),
    skip: pageParams.offset || 0,
    take: 10
  }

  const tokenType = auth.tokenType || 'Bearer'

  const headers = Object.assign({}, defaultHeaders, {
    'Referer': urls.cabinetURL,
    'Authorization': tokenType + ' ' + auth.token
  })

  const params = {
    method: 'POST',
    headers: headers,
    body: requestData
  }

  return recursive(params, [], 0, true)
}

function getTimestamp (date) { return Math.floor(date.getTime() / 1000) }

//
// function getUser () {
//   var url = baseURL + 'v1/user/'
//
//   var response = ZenMoney.requestGet(url, apiHeaders())
//
//   return getJson(response)
// }
//
//
// function requestOperations (limit, offset) {
//   var url = baseURL + 'v1/Transactions/'
//
//   var from = getLastSyncTime()
//   var till = parseInt(Date.now() / 1000)
//
//   // fix for old saved data
//   if (from > till) {
//     from = parseInt(from / 1000)
//   }
//
//   var requestData = {
//     from: from,
//     skip: offset,
//     take: limit,
//     till: till
//   }
//
//   return ZenMoney.requestPost(url, requestData, apiHeaders())
// }
//
// function setLastSyncTime (time) {
//   ZenMoney.setData('last_sync_time', time)
// }
//
// function defaultHeaders () {
//   return {
//     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
//     'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
//     'Connection': 'keep-alive',
//     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'
//   }
// }
//
// function apiHeaders () {
//   return Object.assign({}, defaultHeaders(), {
//     'Authorization': authTokenType + ' ' + authAccessToken,
//     'Content-type': 'application/json'
//   })
// }
//
// function getJson (data) {
//   try {
//     return JSON.parse(data)
//   } catch (e) {
//     ZenMoney.trace('Bad json (' + e.message + '): ' + data, 'error')
//     throw new ZenMoney.Error('Сервер вернул ошибочные данные: ' + e.message)
//   }
// }
//
// function getLastSyncTime () {
//   var time = parseInt(ZenMoney.getData('last_sync_time', 0))
//
//   if (time == 0) {
//     var preferences = ZenMoney.getPreferences()
//     var period = !preferences.hasOwnProperty('period') || isNaN(period = parseInt(preferences.period)) ? 31 : period
//
//     time = Math.floor(Date.now() / 1000 - period * 86400)
//   }
//
//   return time
// }
