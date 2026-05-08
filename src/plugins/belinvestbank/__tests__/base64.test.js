import { encodeUtf8ToBase64 } from '../base64'

describe('encodeUtf8ToBase64', () => {
  it('should encode utf8 strings without browser globals', () => {
    expect(encodeUtf8ToBase64('Встроенный экран')).toBe('0JLRgdGC0YDQvtC10L3QvdGL0Lkg0Y3QutGA0LDQvQ==')
    expect(encodeUtf8ToBase64('device-id:token')).toBe('ZGV2aWNlLWlkOnRva2Vu')
  })
})
