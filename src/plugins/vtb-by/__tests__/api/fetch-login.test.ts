import fetchMock from 'fetch-mock'
import { fetchLogin } from '../../fetchApi'

const loginUrl = 'https://online.vtb.by/services/v2/session/login'

afterEach(() => {
  fetchMock.restore()
})

describe('fetchLogin', () => {
  it('sends current web device info and geolocation during login', async () => {
    const geoLocation = {
      status: 0 as const,
      latitude: 53.9,
      longitude: 27.5,
      accuracy: null,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null
    }

    fetchMock.once(loginUrl, {
      status: 200,
      body: {
        errorInfo: {
          error: '0',
          errorText: 'Успешно'
        },
        sessionToken: 'session-token'
      }
    }, { method: 'POST' })

    await expect(fetchLogin({
      login: 'test-login',
      password: 'test-password',
      geoLocation
    })).resolves.toMatchObject({
      sessionToken: 'session-token'
    })

    const calls = fetchMock.calls(loginUrl)
    expect(calls).toHaveLength(1)

    const firstCall = calls[0]
    if (firstCall == null || firstCall[1] == null) throw new Error('Expected login request')

    const request = JSON.parse(firstCall[1].body as string)
    expect(request).toEqual({
      applicID: '3.7.0',
      browser: 'Chrome',
      browserVersion: '0',
      clientKind: '5',
      deviceUDID: 'ib',
      geolocation: 1,
      geoLocation,
      latitude: 53.9,
      login: 'test-login',
      longitude: 27.5,
      password: 'test-password',
      platform: 'Windows',
      platformVersion: '10',
      pushId: 'unknown'
    })
  })
})
