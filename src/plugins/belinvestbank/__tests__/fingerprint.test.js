import { APP_VERSION, getOrCreateDeviceFingerprint, mobileHeaders } from '../fingerprint'

describe('mobileHeaders', () => {
  it('should encode mobileSdkData without TextEncoder', () => {
    const originalTextEncoder = global.TextEncoder
    const originalBtoa = global.btoa

    global.TextEncoder = undefined
    global.btoa = undefined

    try {
      const headers = mobileHeaders({
        systemVersion: '14.0',
        deviceName: 'samsung SM-S911B',
        deviceModel: 'SM-S911B',
        deviceId: 'device-id',
        ip: '192.168.0.2',
        deviceSystemVersion: '14',
        displayHeight: 2340,
        displayWidth: 1080,
        wifiMac: '02:00:00:00:00:01',
        mnc: '02',
        hardwareId: 'hardware-id',
        advertiserId: 'advertiser-id',
        osId: '0123456789abcdef',
        appKey: '0123456789ABCDEF0123456789ABCDEF',
        wifiBssid: '02:00:00:00:00:02',
        wifiSsid: 'TP-Link_Home',
        screenSize: '1080x2340',
        simId: '257021234567890',
        mcc: '257',
        latitude: 53.900601,
        longitude: 27.558972,
        city: 'Минск',
        country: 'Беларусь'
      })

      const sdkData = JSON.parse(Buffer.from(headers.mobileSdkData, 'base64').toString('utf8'))

      expect(headers.application).toBe(APP_VERSION)
      expect(headers.deviceId).toBe('device-id')
      expect(headers.latitude).toBe('53.900601')
      expect(headers.longitude).toBe('27.558972')
      expect(headers.city).toBe('Минск')
      expect(headers.country).toBe('Беларусь')
      expect(sdkData.Displays[0].name).toBe('Встроенный экран')
      expect(sdkData.DeviceName).toBe('SM-S911B')
      expect(sdkData.GeoLocationInfo.Latitude).toBe(53.900601)
      expect(sdkData.GeoLocationInfo.Longitude).toBe(27.558972)
    } finally {
      global.TextEncoder = originalTextEncoder
      global.btoa = originalBtoa
    }
  })

  it('should backfill location fields in saved device fingerprint', () => {
    const saveData = jest.fn()
    const storage = {
      deviceFingerprint: {
        deviceId: 'saved-device-id'
      }
    }

    global.ZenMoney = {
      getData: key => storage[key],
      setData: (key, value) => {
        storage[key] = value
      },
      saveData,
      getPreferences: () => ({ login: '123456789' })
    }

    const fp = getOrCreateDeviceFingerprint()

    expect(fp.deviceId).toBe('saved-device-id')
    expect(fp.latitude).toBeGreaterThanOrEqual(52)
    expect(fp.latitude).toBeLessThanOrEqual(56)
    expect(fp.longitude).toBeGreaterThanOrEqual(23)
    expect(fp.longitude).toBeLessThanOrEqual(31)
    expect(fp.city).toEqual(expect.any(String))
    expect(fp.country).toBe('Беларусь')
    expect(saveData).toHaveBeenCalled()
  })
})
