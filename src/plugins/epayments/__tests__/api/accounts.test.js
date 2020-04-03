import fetchMock from 'fetch-mock'
import * as api from '../../api'

console.log = jest.fn()
console.error = jest.fn()

afterEach(() => {
  fetchMock.reset()
})

function mockUserInfoRequest (tokenType, token, ...mocks) {
  mocks.forEach(toMock => {
    fetchMock.once({
      method: 'GET',
      headers: {
        Referer: 'https://my.epayments.com/',
        Authorization: `${tokenType} ${token}`
      },
      matcher: toMock.matcher,
      response: toMock.response
    })
  })
}

describe('Accounts API', () => {
  it('should fetch cards and wallets', async () => {
    mockUserInfoRequest('bearer', 'example', {
      matcher: 'https://api.epayments.com/v1/user',
      response: {
        status: 200,
        body: {
          ewallets: [],
          cards: []
        }
      }
    })

    expect(await api.fetchCardsAndWallets({ tokenType: 'bearer', token: 'example' }))
      .toEqual({ cards: [], wallets: [] })
  })

  it('should throw error on status code != 200', async () => {
    mockUserInfoRequest('bearer', 'example2', {
      matcher: 'https://api.epayments.com/v1/user',
      response: {
        status: 400,
        body: {}
      }
    })

    expect(api.fetchCardsAndWallets({ tokenType: 'bearer', token: 'example2' })).rejects.toThrow()
  })
})
