import { mobileHeaders } from '../fingerprint'

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
        mcc: '257'
      })

      const sdkData = JSON.parse(Buffer.from(headers.mobileSdkData, 'base64').toString('utf8'))

      expect(headers.deviceId).toBe('device-id')
      expect(sdkData.Displays[0].name).toBe('Встроенный экран')
      expect(sdkData.DeviceName).toBe('SM-S911B')
    } finally {
      global.TextEncoder = originalTextEncoder
      global.btoa = originalBtoa
    }
  })
})
