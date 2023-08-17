import fetchMock from 'fetch-mock'
import _ from 'lodash'

export function mockLogin ({ tokenType, accessToken, clientSecret, login, hash, hash2, response }) {
  fetchMock.once({
    method: 'POST',
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
      client_id: clientSecret
    },
    matcher: (url, { body }) => url === 'https://www.prior.by/api3/api/Authorization/Login' && _.isEqual(JSON.parse(body), {
      login,
      password: hash,
      deviceInfo: {
        precognitiveSessionId: ''
      },
      password2: hash2,
      lang: 'RUS'
    }),
    response
  })
}

export function mockGetSalt ({ tokenType, accessToken, clientSecret, login, response }) {
  fetchMock.once({
    method: 'POST',
    headers: {
      Authorization: `${tokenType} ${accessToken}`,
      client_id: clientSecret
    },
    matcher: (url, { body }) => url === 'https://www.prior.by/api3/api/Authorization/GetSalt' && _.isEqual(JSON.parse(body), {
      login,
      lang: 'RUS'
    }),
    response
  })
}

export function mockMobileToken ({ response }) {
  fetchMock.once({
    method: 'GET',
    matcher: (url) => url === 'https://www.prior.by/api3/api/Authorization/MobileToken',
    response
  })
}
