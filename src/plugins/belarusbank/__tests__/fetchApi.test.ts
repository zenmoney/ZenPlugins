import { TemporaryUnavailableError } from '../../../errors'

const mockFetchJson = jest.fn()

jest.mock('../../../common/network', () => ({
  fetchJson: mockFetchJson
}))

const { fetchApi } = jest.requireActual<typeof import('../fetchApi')>('../fetchApi')

describe('Belarusbank fetch API', () => {
  beforeEach(() => {
    mockFetchJson.mockReset()
  })

  it('sends the refresh token as a raw string and disables request logging', async () => {
    mockFetchJson.mockResolvedValue({ status: 200, body: '{}' })

    await fetchApi('users/auth/refresh-token', {
      method: 'POST',
      body: 'refresh-token',
      rawStringBody: true,
      retry: false
    })

    const options = mockFetchJson.mock.calls[0][1]
    expect(options.stringify('refresh-token')).toBe('refresh-token')
    expect(options.log).toBe(false)
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

  it('turns an exhausted retryable network error into temporary unavailability', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockFetchJson.mockRejectedValue(new Error('[NER] connection reset'))

    await expect(fetchApi('cards')).rejects.toBeInstanceOf(TemporaryUnavailableError)
    expect(mockFetchJson).toHaveBeenCalledTimes(3)
    consoleError.mockRestore()
  })
})
