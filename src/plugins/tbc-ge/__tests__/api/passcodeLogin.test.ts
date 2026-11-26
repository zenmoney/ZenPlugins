import fetchMock from 'fetch-mock'
import { fetchLoginByPasscodeV2 } from '../../fetchApi'
import { DeviceData, DeviceInfo } from '../../models'

const EASY_LOGIN_URL = 'https://rmbgwauth.tbconline.ge/v1/auth/easyLogin'
const auth = { username: 'user', passcode: '12345', deviceId: 'device_ZM', registrationId: 'registration', trustedDeviceId: 'trusted' }
const deviceInfo = new DeviceInfo('6.66.3', 'device_ZM', 'manufacturer', 'model', 'Android 10')
const deviceData = new DeviceData('6.66.3', 'device_ZM', 'manufacturer', 'model', 'android', 'Android', '10')

// GitHub issue #1268: a repeat sync after a fresh connection. TBC rejects the saved passcode with
// 200 and no session cookies, reduced to the fields the plugin reads.
const dirtyPasscodeResponse = {
  success: false,
  passcodeDirty: true,
  secondPhaseRequired: false,
  accessToken: null,
  changePasswordRequired: false,
  signatures: null
}

afterEach(() => fetchMock.restore())

it('falls back to the password login when TBC rejects the saved passcode', async () => {
  fetchMock.post(EASY_LOGIN_URL, { status: 200, body: dirtyPasscodeResponse })
  await expect(fetchLoginByPasscodeV2(auth, deviceInfo, deviceData)).resolves.toBeNull()
})

it('keeps the passcode login when TBC issues a session', async () => {
  fetchMock.post(EASY_LOGIN_URL, {
    status: 200,
    body: { ...dirtyPasscodeResponse, success: true, passcodeDirty: null },
    headers: { 'set-cookie': 'session=abc' }
  })
  const result = await fetchLoginByPasscodeV2(auth, deviceInfo, deviceData)
  expect(result?.cookies).toEqual(['session=abc'])
})

it('keeps the passcode login when TBC asks for a second factor', async () => {
  fetchMock.post(EASY_LOGIN_URL, {
    status: 200,
    body: { ...dirtyPasscodeResponse, secondPhaseRequired: true, transactionId: 'transaction' }
  })
  const result = await fetchLoginByPasscodeV2(auth, deviceInfo, deviceData)
  expect(result?.secondPhaseRequired).toBe(true)
})
