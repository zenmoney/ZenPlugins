export {}

const mockFetchJson = jest.fn()

jest.mock('../../../common/network', () => ({
  fetchJson: mockFetchJson
}))

const { fetchApi } = jest.requireActual<typeof import('../fetchApi')>('../fetchApi')

// These model tests verify transport serialization, retry limits and original-error propagation.
describe('[model] Belarusbank fetch API', () => {
  beforeEach(() => {
    mockFetchJson.mockReset()
  })

  it('sends the refresh token as a raw string while keeping request logging enabled', async () => {
    mockFetchJson.mockResolvedValue({ status: 200, body: '{}' })

    await fetchApi('users/auth/refresh-token', {
      method: 'POST',
      body: 'refresh-token',
      rawStringBody: true,
      retry: false
    })

    const options = mockFetchJson.mock.calls[0][1]
    expect(options.stringify('refresh-token')).toBe('refresh-token')
    expect(options.log).not.toBe(false)
  })

  it('does not retry an explicitly non-retryable request', async () => {
    mockFetchJson.mockResolvedValue({ status: 500, body: '{}' })

    await expect(fetchApi('users/auth/login/preparation', {
      method: 'POST',
      body: {},
      retry: false
    })).resolves.toMatchObject({ status: 500 })
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })

  it('preserves the original network error after exhausting retries', async () => {
    const error = new Error('[NER] connection reset')
    mockFetchJson.mockRejectedValue(error)

    await expect(fetchApi('cards')).rejects.toBe(error)
    expect(mockFetchJson).toHaveBeenCalledTimes(3)
  })

  it('preserves the original network error without retrying an auth request', async () => {
    const error = new Error('[NTI] request timed out')
    mockFetchJson.mockRejectedValue(error)

    await expect(fetchApi('users/auth/login/preparation', { retry: false })).rejects.toBe(error)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })

  it('does not retry or wrap an unrecognized transport error', async () => {
    const error = new Error('Unrecognized transport failure')
    mockFetchJson.mockRejectedValue(error)

    await expect(fetchApi('cards')).rejects.toBe(error)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
  })
})
