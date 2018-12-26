import fetchMock from 'fetch-mock'
import _ from 'lodash'

export function mockCardListRequest ({ response }) {
  fetchMock.once({
    method: 'GET',
    matcher: (url) => url === 'https://24.bsb.by/mobile/api/cards?lang=ru',
    response
  })
}

export function mockArchiveRequest ({ fromDate, toDate, response }) {
  fetchMock.once({
    method: 'POST',
    matcher:
      (url, { body }) => url === 'https://24.bsb.by/mobile/api/archive?lang=ru' && _.isEqual(JSON.parse(body), {
        page: {
          'pageNumber': 0,
          'pageSize': 1000
        },
        fromDate,
        toDate
      }),
    response
  })
}

export function mockTransactionsRequest ({ id, fromDate, toDate, response }) {
  fetchMock.once({
    method: 'POST',
    matcher:
      (url, { body }) => url === `https://24.bsb.by/mobile/api/cards/${id}/sms?lang=ru` && _.isEqual(JSON.parse(body), {
        fromDate,
        toDate
      }),
    response
  })
}

export function mockLogout () {
  fetchMock.once({
    method: 'DELETE',
    matcher: (url) => url === 'https://24.bsb.by/mobile/api/authorization?lang=ru',
    response: JSON.stringify(true)
  })
}

export function mockLogin ({ username, password, deviceId, response }) {
  fetchMock.once({
    method: 'POST',
    matcher: (url, { body }) => url === 'https://24.bsb.by/mobile/api/authorization?lang=ru' && _.isEqual(JSON.parse(body), {
      'username': username,
      'password': password,
      'deviceId': deviceId,
      'applicationVersion': 'Web 5.8.1',
      'osType': 3,
      'currencyIso': 'BYN'
    }),
    response
  })
}
