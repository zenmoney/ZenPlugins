import { fetch } from '../../common/network'

const baseUrl = 'https://online.forward-bank.com:8082/api/v1'

async function fetchApi (url, options, predicate = () => true) {
  const response = await fetch(baseUrl + url, options || {})
  response.body = response.body === '' ? undefined : JSON.parse(response.body)

  if (predicate) {
    validateResponse(response, response => response.body && !response.body.error && predicate(response))
  }
  return response
}

function validateResponse (response, predicate) {
  console.assert(!predicate || predicate(response), 'non-successful response')
}

export async function login ({ login, password }, auth) {
  const options = {
    headers: {
      'User-Agent': 'Forward-online/1 CFNetwork/1327.0.4 Darwin/21.2.0',
      'Client-System': 'iOS',
      Accept: '*/*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Language': 'en-ua',
      'Cache-Control': 'no-cache'
    },
    body: `client_id=FORWARD_ONLINE_IOS&phone_number=${login}&grant_type=password&password=${password}&mode=bio&device=`,
    method: 'POST',
    log: true,
    sanitizeRequestLog: { body: true },
    sanitizeResponseLog: { body: true }
  }

  return (await fetchApi('/auth/token', options, response => response.body.access_token)).body.access_token
}

export async function fetchAccounts (auth) {
  const options = {
    headers: getDefaultHeaders(auth)
  }

  return (await fetchApi('/cards/', options, response => Array.isArray(response.body))).body
}

export async function fetchTransactions (auth, { id }, fromDate, toDate = null) {
  const options = {
    headers: getDefaultHeaders(auth)
  }
  const maxPages = 100
  const perPage = 500

  let offset = 0
  let currentPage = 1
  let result = []

  while (currentPage < maxPages) {
    let url = `/cards/${id}/operations?startDate=${fromDate.toISOString()}&skip=${offset}&top=${perPage}`
    if (toDate) {
      url = url + `&endDate=${toDate.toISOString()}`
    }

    const page = (await fetchApi(url, options, response => Array.isArray(response.body))).body

    if (!page) {
      return result
    }

    result = [...result, ...page]

    console.log(`[${id}] page ${currentPage}, found ${page.length}`)
    if (page.length < perPage) {
      console.log(`[${id}] total ${result.length}`)
      return result
    }

    offset = currentPage * perPage
    currentPage++
  }
}

function getDefaultHeaders (auth) {
  return {
    'User-Agent': 'Forward-online/1 CFNetwork/1327.0.4 Darwin/21.2.0',
    'Client-System': 'iOS',
    Accept: '*/*',
    'Accept-Language': 'en-ua',
    Authorization: `bearer ${auth}`
  }
}
