import { getAuthToken } from '../../api'

describe('getAuthToken', () => {
  it.each([
    [
      'Алексей986',
      'Hedm,dsfe',
      'Basic 0JDQu9C10LrRgdC10Lk5ODY6SGVkbSxkc2Zl'
    ]
  ])('counts auth token', (login, password, token) => {
    expect(getAuthToken({ login, password })).toEqual(token)
  })
})
