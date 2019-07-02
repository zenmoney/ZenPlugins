import fetchMock from 'fetch-mock'
import * as api from '../../api'

console.log = jest.fn()
console.error = jest.fn()

const loginMatcherWithoutOtp = (url, { body }) => {
  const parsed = new URLSearchParams(body)

  return url === 'https://api.epayments.com/token' &&
    parsed.get('username') === 'qwerty' &&
    parsed.get('password') === 'supersecret' &&
    parsed.get('grant_type') === 'password_otp' &&
    !parsed.get('otpcode')
}

const loginMatcherWithOtp = (url, { body }) => {
  const parsed = new URLSearchParams(body)

  return url === 'https://api.epayments.com/token' &&
    parsed.get('username') === 'qwerty' &&
    parsed.get('password') === 'supersecret' &&
    parsed.get('grant_type') === 'password_otp' &&
    parsed.get('otpcode') === '123456'
}

function mockZenMoney () {
  global.ZenMoney = {}
  ZenMoney.readLine = () => 123456
}

function mockLoginRequest (...mocks) {
  mocks.forEach(toMock => {
    fetchMock.once({
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Authorization': 'Basic ZXBheW1lbnRzOm1ZbjZocmtnMElMcXJ0SXA4S1NE'
      },
      matcher: toMock.matcher,
      response: toMock.response
    })
  })
}

afterEach(() => {
  fetchMock.restore()
})

describe('Login API', () => {
  mockZenMoney()

  it('should login', async () => {
    mockLoginRequest({
      matcher: loginMatcherWithoutOtp,
      response: {
        status: 200,
        body: {
          token_type: 'bearer',
          access_token: 'example',
          refresh_token: 'refresh'
        }
      }
    })

    expect(await api.authenthicate('qwerty', 'supersecret')).toEqual({
      tokenType: 'bearer',
      token: 'example'
    })
  })

  it('should retry to login without OTP', async () => {
    mockLoginRequest({
      matcher: loginMatcherWithoutOtp,
      response: {
        status: 400,
        body: { error: 'otp_code_required' }
      }
    }, {
      matcher: loginMatcherWithOtp,
      response: {
        status: 200,
        body: {
          token_type: 'bearer',
          access_token: 'example',
          refresh_token: 'refresh'
        }
      }
    })

    expect(await api.authenthicate('qwerty', 'supersecret')).toEqual({
      tokenType: 'bearer',
      token: 'example'
    })
  })

  it('should retry to login without OTP', async () => {
    mockLoginRequest({
      matcher: loginMatcherWithoutOtp,
      response: {
        status: 400,
        body: { error: 'otp_code_invalid' }
      }
    }, {
      matcher: loginMatcherWithOtp,
      response: {
        status: 200,
        body: {
          token_type: 'bearer',
          access_token: 'example',
          refresh_token: 'refresh'
        }
      }
    })

    expect(await api.authenthicate('qwerty', 'supersecret')).toEqual({
      tokenType: 'bearer',
      token: 'example'
    })
  })

  it('should throw an error if bot detected', async () => {
    mockLoginRequest({
      matcher: loginMatcherWithoutOtp,
      response: {
        status: 400,
        body: { error: 'bot_detected' }
      }
    })

    expect(api.authenthicate('qwerty', 'supersecret')).rejects.toThrow()
  })

  it('should throw an error if ivalid grant', async () => {
    mockLoginRequest({
      matcher: loginMatcherWithoutOtp,
      response: {
        status: 400,
        body: { error: 'invalid_grant' }
      }
    })

    expect(api.authenthicate('qwerty', 'supersecret')).rejects.toThrow()
  })
})
