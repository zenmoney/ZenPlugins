import { getAuthToken } from '../../api'

describe('getAuthToken', () => {
  it.each([
    [
      'ТестовыйПользователь',
      'test-password',
      'Basic 0KLQtdGB0YLQvtCy0YvQudCf0L7Qu9GM0LfQvtCy0LDRgtC10LvRjDp0ZXN0LXBhc3N3b3Jk'
    ]
  ])('counts auth token', (login, password, token) => {
    expect(getAuthToken({ login, password })).toEqual(token)
  })
})
