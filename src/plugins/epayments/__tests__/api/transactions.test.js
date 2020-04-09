import fetchMock from 'fetch-mock'
import * as api from '../../api'

console.log = jest.fn()
console.error = jest.fn()

afterEach(() => {
  fetchMock.reset()
})

function mockTransactionsRequest (tokenType, token, ...mocks) {
  mocks.forEach(toMock => {
    fetchMock.once({
      method: 'POST',
      headers: {
        'Referer': 'https://my.epayments.com/',
        'Authorization': `${tokenType} ${token}`
      },
      matcher: toMock.matcher,
      response: toMock.response
    })
  })
}

describe('Transactions API', () => {
  it('should throw error on status code != 200', async () => {
    mockTransactionsRequest('bearer', 'example', {
      matcher: 'https://api.epayments.com/v3/Transactions',
      response: {
        status: 400,
        body: {}
      }
    })

    expect(api.fetchTransactions({ tokenType: 'bearer', token: 'example' }, new Date(), new Date())).rejects.toThrow()
  })

  it('should return transactions with count < 10', async () => {
    mockTransactionsRequest('bearer', 'example2', {
      matcher: 'https://api.epayments.com/v3/Transactions',
      response: {
        status: 200,
        body: {
          skip: 0,
          take: 10,
          count: 7,
          transactions: []
        }
      }
    })

    expect(await api.fetchTransactions({ tokenType: 'bearer', token: 'example2' }, new Date(), new Date())).toEqual([])
  })

  it('should return transactions with count > 10', async () => {
    mockTransactionsRequest('bearer', 'example3', {
      matcher: (url, { body }) => {
        const parsed = JSON.parse(body)
        return url === 'https://api.epayments.com/v3/Transactions' &&
          parsed.skip === 0 &&
          parsed.take === 10
      },
      response: {
        status: 200,
        body: {
          skip: 0,
          take: 10,
          count: 15,
          transactions: [{ name: 'one' }]
        }
      }
    }, {
      matcher: (url, { body }) => {
        const parsed = JSON.parse(body)
        return url === 'https://api.epayments.com/v3/Transactions' &&
          parsed.skip === 10 &&
          parsed.take === 10
      },
      response: {
        status: 200,
        body: {
          skip: 10,
          take: 10,
          count: 15,
          transactions: [{ name: 'two' }]
        }
      }
    })

    expect(await api.fetchTransactions({ tokenType: 'bearer', token: 'example3' }, new Date(), new Date()))
      .toEqual([{ name: 'one' }, { name: 'two' }])
  })
})
