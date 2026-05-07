// Device profiles, fingerprint generation, and mobileSdkData emulation
// for Belinvestbank mobile API anti-fraud requirements

const APP_VERSION = '2.25.0'

// Popular Android device profiles for fingerprint randomization
const DEVICE_PROFILES = [
  { brand: 'samsung', model: 'SM-S911B', sysVer: '14', api: '34', w: 1080, h: 2340 },
  { brand: 'samsung', model: 'SM-A546B', sysVer: '13', api: '33', w: 1080, h: 2340 },
  { brand: 'samsung', model: 'SM-A346B', sysVer: '13', api: '33', w: 1080, h: 2340 },
  { brand: 'samsung', model: 'SM-S901B', sysVer: '13', api: '33', w: 1080, h: 2340 },
  { brand: 'samsung', model: 'SM-A525F', sysVer: '12', api: '31', w: 1080, h: 2400 },
  { brand: 'samsung', model: 'SM-G991B', sysVer: '13', api: '33', w: 1080, h: 2400 },
  { brand: 'Xiaomi', model: '23021RAAEG', sysVer: '13', api: '33', w: 1080, h: 2400 },
  { brand: 'Xiaomi', model: '2201117TG', sysVer: '11', api: '30', w: 1080, h: 2400 },
  { brand: 'Xiaomi', model: '22101320G', sysVer: '12', api: '31', w: 1080, h: 2400 },
  { brand: 'Xiaomi', model: '2203129G', sysVer: '12', api: '31', w: 1080, h: 2400 },
  { brand: 'OnePlus', model: 'NE2211', sysVer: '11', api: '30', w: 1080, h: 1920 },
  { brand: 'OnePlus', model: 'CPH2451', sysVer: '13', api: '33', w: 1080, h: 2400 },
  { brand: 'HUAWEI', model: 'ELE-L29', sysVer: '10', api: '29', w: 1080, h: 2340 },
  { brand: 'HONOR', model: 'ANY-LX1', sysVer: '12', api: '31', w: 1080, h: 2400 },
  { brand: 'Google', model: 'Pixel 7', sysVer: '14', api: '34', w: 1080, h: 2400 },
  { brand: 'realme', model: 'RMX3630', sysVer: '13', api: '33', w: 1080, h: 2400 }
]

// Common WiFi network names in Belarus/CIS region
const WIFI_NAMES = [
  'TP-Link_Home', 'Keenetic-WiFi', 'HUAWEI-B535', 'ASUS_RT-AC68U', 'Xiaomi_Router',
  'MTS_WiFi', 'A1_Home', 'Beltelecom_GPON', 'Home_Network', 'MyWiFi_5G',
  'ZTE_Home', 'Mikrotik_AP', 'Dlink_Home', 'Tenda_WiFi', 'NetByNet_Home'
]

// Belarusian mobile operators (MCC 257)
const BY_OPERATORS = [
  { mcc: '257', mnc: '02' }, // MTS
  { mcc: '257', mnc: '01' }, // A1
  { mcc: '257', mnc: '04' } // life:)
]

// Belarus cities for geo randomization (lat, lon in degrees)
const BY_CITIES = [
  { lat: 53.9, lon: 27.56 },
  { lat: 52.44, lon: 30.98 },
  { lat: 52.1, lon: 23.7 },
  { lat: 55.19, lon: 30.2 },
  { lat: 53.68, lon: 23.83 },
  { lat: 53.9, lon: 30.34 }
]

const BANK_CERT = `-----BEGIN CERTIFICATE-----
MIIJOTCCCCGgAwIBAgIMSqLONbKaZMW658uzMA0GCSqGSIb3DQEBCwUAMGIxCzAJ
BgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMTgwNgYDVQQDEy9H
bG9iYWxTaWduIEV4dGVuZGVkIFZhbGlkYXRpb24gQ0EgLSBTSEEyNTYgLSBHMzAe
Fw0yNTA0MDExMzU2MTRaFw0yNjA1MDMxMzU2MTNaMIIBFTEdMBsGA1UEDwwUUHJp
dmF0ZSBPcmdhbml6YXRpb24xEjAQBgNVBAUTCTgwNzAwMDAyODETMBEGCysGAQQB
gjc8AgEDEwJCWTELMAkGA1UEBhMCQlkxEzARBgNVBAgMCtCc0LjQvdGB0LoxEzAR
BgNVBAcMCtCc0LjQvdGB0LoxeTB3BgNVBAoMcNCe0JDQniDQkdC10LvQvtGA0YPR
gdGB0LrQuNC5INCx0LDQvdC6INGA0LDQt9Cy0LjRgtC40Y8g0Lgg0YDQtdC60L7Q
vdGB0YLRgNGD0LrRhtC40Lgg0JHQtdC70LjQvdCy0LXRgdGC0LHQsNC90LoxGTAX
BgNVBAMTEGJlbGludmVzdGJhbmsuYnkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAw
ggEKAoIBAQDLufFqw1FAFl6i3OLxtrxIAwG9j5BF9sox625iSIpd0SysM+8gEqHX
b3pP2LsMmypQOeS8G1VbkKLpMVSQWGlBWUCyiXcxQmgWKnEhdJu2/zwlMkDPcKIv
6NPi0fZc6uA9GAa14RLntiQY/AyVrsFsP07NkabUxRcDYQFV8QZV2iF6+leT5/UK
HHVNL8iltn22uib9nAUWg7qq7xMnGGxM9/YD5/dxFwBHtdW+71oaqERcLh+wiULn
ot/LYM5QWGk+IiAjyYMmqmQFJ1H1fq38ZH+ucufyPL1V8PJtbyjt4bmtBCoxgyG0
pyJKlY3DqecSFBeQGXAtnQTrn1vAeQAZAgMBAAGjggU4MIIFNDAOBgNVHQ8BAf8E
BAMCBaAwDAYDVR0TAQH/BAIwADCBlgYIKwYBBQUHAQEEgYkwgYYwRwYIKwYBBQUH
MAKGO2h0dHA6Ly9zZWN1cmUuZ2xvYmFsc2lnbi5jb20vY2FjZXJ0L2dzZXh0ZW5k
dmFsc2hhMmczcjMuY3J0MDsGCCsGAQUFBzABhi9odHRwOi8vb2NzcDIuZ2xvYmFs
c2lnbi5jb20vZ3NleHRlbmR2YWxzaGEyZzNyMzBVBgNVHSAETjBMMEEGCSsGAQQB
oDIBATA0MDIGCCsGAQUFBwIBFiZodHRwczovL3d3dy5nbG9iYWxzaWduLmNvbS9y
ZXBvc2l0b3J5LzAHBgVngQwBATBFBgNVHR8EPjA8MDqgOKA2hjRodHRwOi8vY3Js
Lmdsb2JhbHNpZ24uY29tL2dzL2dzZXh0ZW5kdmFsc2hhMmczcjMuY3JsMIIB+QYD
VR0RBIIB8DCCAeyCEGJlbGludmVzdGJhbmsuYnmCHnhuLS04MGFiYWRvYnR1ZHZl
OWJuLnhuLS05MGFpc4IgeG4tLTgwYWJhZG9iMWJkc2U1Ym05dy54bi0tOTBhaXOC
FmliYW5rLmJlbGludmVzdGJhbmsuYnmCFHBvcy5iZWxpbnZlc3RiYW5rLmJ5ghRi
aXouYmVsaW52ZXN0YmFuay5ieYIWbG9naW4uYmVsaW52ZXN0YmFuay5ieYIVbmNt
cy5iZWxpbnZlc3RiYW5rLmJ5ghdjYW1wdXMuYmVsaW52ZXN0YmFuay5ieYIdd2Vi
LXBhcnRuZXJzLmJlbGludmVzdGJhbmsuYnmCFm5jd2ViLmJlbGludmVzdGJhbmsu
YnmCFHd3dy5iZWxpbnZlc3RiYW5rLmJ5ghdpYmtzZ24uYmVsaW52ZXN0YmFuay5i
eYIUdGliLmJlbGludmVzdGJhbmsuYnmCGGFwaS1iaXouYmVsaW52ZXN0YmFuay5i
eYIaYXBpLWliYW5rLmJlbGludmVzdGJhbmsuYnmCFHJjcC5iZWxpbnZlc3RiYW5r
LmJ5ghVyY3AyLmJlbGludmVzdGJhbmsuYnmCFHJjcy5iZWxpbnZlc3RiYW5rLmJ5
ghVyY3MyLmJlbGludmVzdGJhbmsuYnkwHQYDVR0lBBYwFAYIKwYBBQUHAwEGCCsG
AQUFBwMCMB8GA1UdIwQYMBaAFN2z522oLujFTm7PdOZ1PJQVzugdMB0GA1UdDgQW
BBRmWcQ/cVoityc+wUcnRnG6MvmSbTCCAX8GCisGAQQB1nkCBAIEggFvBIIBawFp
AHYAZBHEbKQS7KeJHKICLgC8q08oB9QeNSer6v7VA8l9zfAAAAGV8aOFnwAABAMA
RzBFAiA3ZW0iMS3Rp0Sp1p0cpGYeAJtkpLLav5OMRIF4ceCJBQIhAOFiWG0/8av6
cCj2LVy0E+F2Qap22SRxaUrfqcgXeumaAHcADleUvPOuqT4zGyyZB7P3kN+bwj1x
MiXdIaklrGHFTiEAAAGV8aOFkgAABAMASDBGAiEAxjnAR5Ye2sjJ6HU++fIITiKG
/AHZtdrjyoZcoBDWb/UCIQCahbvOBSOeSWL1ufoYd2Om4zhI22WO/B7ztM5XletJ
HQB2ACUvlMIrKelun0EacgcraVxbUv+XqQ0lQLv83FHsTe4LAAABlfGjhesAAAQD
AEcwRQIhAMvHswDtFbv9nLFPDew9HIiD0cF139Ufp2Iiis0A7URZAiATL2zWm6Sk
biMchT5R/wnsKytq2Xraj4WJKskkbbQO6DANBgkqhkiG9w0BAQsFAAOCAQEAPtKU
bJbyhPN2VSzCZsHYKOuyrNv1bu8frTtxABbfNurnQJEhnZQEfIe9WQ1ShX9z6AzM
CSPub+NgdZ4m65qDovlx9ytW83+ULwtGHWkcmFzgnv1hYuNvbSWSvHbv5So1/+6I
iTrKM/IuEcn+4m2ZxhnLxOKl/ofgw2LpV1T1s5oxClzW1uU35HvZLwInReYmP6yF
rr9+sx5lWZ5CJPJgBmgN9M3I86qHJTZiO2skkWQVohpGyuBr17SUgDcmjGA+seMN
RcKU18IVYcmzCkZymo7An3zD68Pq38TGn1QcYieV8vdE18uLGUkRnFN1bqodNFu5
9FjOp+7y/TY6Iv819Q==
-----END CERTIFICATE-----`

function utf8ToBase64 (str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

// Seeded PRNG (mulberry32) — deterministic random from login
function createSeededRandom (seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  let state = h >>> 0
  return function () {
    state |= 0
    state = state + 0x6D2B79F5 | 0
    let t = Math.imul(state ^ state >>> 15, 1 | state)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function seededUUID (rand) {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (rand() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function seededHex (rand, length) {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) result += chars[(rand() * 16) | 0]
  return result
}

function seededMAC (rand) {
  const parts = []
  for (let i = 0; i < 6; i++) {
    let byte = (rand() * 256) | 0
    if (i === 0) byte = (byte & 0xfe) | 0x02
    parts.push(byte.toString(16).padStart(2, '0'))
  }
  return parts.join(':')
}

function seededDigits (rand, length) {
  let result = ''
  for (let i = 0; i < length; i++) result += ((rand() * 10) | 0).toString()
  return result
}

function seededFcmToken (rand) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const tokenChars = chars + '-_'
  let instanceId = ''
  for (let i = 0; i < 22; i++) instanceId += chars[(rand() * chars.length) | 0]
  let token = 'APA91b'
  for (let i = 0; i < 134; i++) token += tokenChars[(rand() * tokenChars.length) | 0]
  return utf8ToBase64(`${instanceId}:${token}`)
}

function generateRandomGeo () {
  const city = BY_CITIES[Math.floor(Math.random() * BY_CITIES.length)]
  return {
    lat: Math.round((city.lat + (Math.random() - 0.5) * 0.15) * 1000000) / 1000,
    lon: Math.round((city.lon + (Math.random() - 0.5) * 0.15) * 1000000) / 1000
  }
}

export function getOrCreateDeviceFingerprint () {
  let fp = ZenMoney.getData('deviceFingerprint')
  if (fp) return fp

  // Deterministic generation based on login — survives failed syncs
  const login = ZenMoney.getData('login') || ZenMoney.getPreferences().login || 'default'
  const rand = createSeededRandom('belinvest_fp_v3_' + login)

  const existingDeviceId = ZenMoney.getData('deviceId')
  const profile = DEVICE_PROFILES[(rand() * DEVICE_PROFILES.length) | 0]
  const operator = BY_OPERATORS[(rand() * BY_OPERATORS.length) | 0]

  fp = {
    deviceId: existingDeviceId || seededUUID(rand),
    deviceName: `${profile.brand} ${profile.model}`,
    deviceModel: profile.model,
    systemVersion: `${profile.sysVer}.0`,
    deviceSystemVersion: profile.sysVer,
    androidVersion: profile.api,
    screenSize: `${profile.w}x${profile.h}`,
    displayWidth: profile.w,
    displayHeight: profile.h,
    hardwareId: seededUUID(rand),
    advertiserId: seededUUID(rand),
    osId: seededHex(rand, 16),
    appKey: seededHex(rand, 32).toUpperCase(),
    wifiMac: seededMAC(rand),
    wifiBssid: seededMAC(rand),
    wifiSsid: WIFI_NAMES[(rand() * WIFI_NAMES.length) | 0],
    simId: '257' + operator.mnc + seededDigits(rand, 10),
    mcc: operator.mcc,
    mnc: operator.mnc,
    fcmToken: seededFcmToken(rand),
    ip: `192.168.${(rand() * 255) | 0}.${(rand() * 254 + 1) | 0}`
  }

  ZenMoney.setData('deviceId', fp.deviceId)
  ZenMoney.setData('deviceFingerprint', fp)
  ZenMoney.saveData()
  return fp
}

function generateMobileSdkData (fp) {
  const now = Date.now()
  const geo = generateRandomGeo()
  const sdkData = {
    AdvertiserProvider: 'GOOGLE',
    Languages: 'ru',
    AdvertiserLimitTracking: false,
    HoursSinceHopToDeskInstall: -1,
    SDK_VERSION: '4.9.3',
    TIMESTAMP: now,
    HoursSinceAirmirrorInstall: -1,
    PhoneCallState: 0,
    DeviceSystemVersion: fp.deviceSystemVersion,
    DeviceModel: fp.deviceName,
    GeoLocationInfo: {
      Status: 0,
      Speed: 0,
      Heading: 0,
      HorizontalAccuracy: 1,
      Latitude: geo.lat,
      Longitude: geo.lon,
      AltitudeAccuracy: 0,
      Timestamp: now - Math.floor(Math.random() * 5000000),
      Altitude: 0
    },
    DeviceSystemName: 'Android',
    HoursSinceQSInstall: -1,
    HoursSinceAweSunClientInstall: -1,
    AdbUsbEnabled: false,
    TimeZone: '3.0',
    AppInMultiWindowMode: false,
    HoursSinceAwerayRemoteInstall: -1,
    MultitaskingSupported: false,
    HoursSinceAircastInstall: -1,
    UnknownSources: -1,
    WiFiMacAddress: fp.wifiMac,
    HoursSinceAirdroidInstall: -1,
    HoursSinceAirdroidRemoteSupportInstall: -1,
    HoursSinceRustDeskInstall: -1,
    MNC: fp.mnc,
    HardwareID: fp.hardwareId,
    InstallationSource: '',
    DeveloperTools: 0,
    HoursSinceDiscordInstall: -1,
    CellTowerId: null,
    HoursSinceRuDesktopInstall: -1,
    Displays: [
      {
        flags: 131,
        name: '\u0412\u0441\u0442\u0440\u043e\u0435\u043d\u043d\u044b\u0439 \u044d\u043a\u0440\u0430\u043d',
        logicalHeight: fp.displayHeight,
        state: 2,
        displayId: 0,
        logicalWidth: fp.displayWidth
      }
    ],
    Emulator: 0,
    AdvertiserId: fp.advertiserId,
    AdbWifiEnabled: false,
    AppInPictureInPictureMode: false,
    OS_ID: fp.osId,
    AppKey: fp.appKey,
    HoursSinceAnyDeskInstall: -1,
    RdpConnection: false,
    WiFiNetworksData: {
      BSSID: fp.wifiBssid,
      Channel: '0',
      SSID: `"${fp.wifiSsid}"`,
      SignalStrength: `-${Math.floor(Math.random() * 60) + 20}`
    },
    ScreenSize: fp.screenSize,
    AccessibilityEnabled: false,
    DisplayInPresentationMode: false,
    HoursSinceTVHInstall: -1,
    HoursSinceZoomInstall: -1,
    LocationAreaCode: null,
    SIM_ID: fp.simId,
    AccessibilityServices: [],
    MCC: fp.mcc,
    Compromised: 0,
    PhoneNumber: '',
    DeviceName: fp.deviceModel
  }
  return utf8ToBase64(JSON.stringify(sdkData, null, 2))
}

export function mobileHeaders (fp, cookie) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Android',
    DEVICE_TOKEN: '123456',
    Connection: 'Keep-Alive',
    'Accept-Encoding': 'gzip',
    language: 'ru',
    system: 'android',
    systemVersion: fp.systemVersion,
    application: APP_VERSION,
    device: fp.deviceName,
    deviceId: fp.deviceId,
    ip: fp.ip,
    mobileSdkData: generateMobileSdkData(fp)
  }
  if (cookie) {
    headers.Cookie = cookie
    headers['zp-cookie'] = cookie
  }
  return headers
}

export { APP_VERSION, BANK_CERT }
