import fetchMock from 'fetch-mock'
import { Api } from '../../api'

// Local reproduction, 2026-11-11: after the bank's app update (202611.1.0, build 11053) auth/login
// for a confirmed device returned 500 MAS-0006c for the 1.1.19 client identity and 200 once
// appVersion, appStorePlatform, appBuildVersion and the x-device-fingerprint header matched the app.
const base = 'https://mobile.bsb.by/api/v1/authentication-management/free-zone/auth/'
const device = { model: 'test', manufacturer: 'test', ip: '192.168.1.1', osVersion: '34', androidId: 'test-android-id' }

beforeEach(() => {
  global.ZenMoney = { getData: () => device } as unknown as typeof ZenMoney
  // [model] The salt only supplies the encryption precondition for the login request.
  fetchMock.post(base + 'salt', { status: 200, body: 'test-salt' })
})
afterEach(() => fetchMock.restore())

it('logs in with the current app identity and the anti-fraud fingerprint header', async () => {
  fetchMock.post(base + 'login', {
    status: 200,
    body: { tokenContainer: { accessToken: 'test-access' }, widgetTokenContainer: { widgetToken: 'test-widget' } }
  })
  const api = new Api({ username: 'test', password: 'test' })
  await api.login(false)
  expect(api.session).toEqual({ accessToken: 'test-access' })

  const [, request] = fetchMock.lastCall(base + 'login') ?? []
  const body = JSON.parse(request?.body as string)
  expect(body.userDevice).toMatchObject({
    appVersion: '202611.1.0',
    appStorePlatform: 'GOOGLE',
    appBuildVersion: '11053',
    deviceGuid: device.androidId,
    deviceOs: 'Android GMS',
    deviceOsVersion: '34'
  })
  const header = (request?.headers as Record<string, string>)['x-device-fingerprint']
  const fingerprint = JSON.parse(Buffer.from(header, 'base64').toString('utf8'))
  expect(fingerprint).toMatchObject({ deviceid: device.androidId, uuid: device.androidId, os_name: 'Android', os_version: '14' })
  expect(fingerprint.android_specific.build_manufacturer).toBe(device.manufacturer)
})
