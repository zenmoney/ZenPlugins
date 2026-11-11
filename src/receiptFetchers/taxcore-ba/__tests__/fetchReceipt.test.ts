import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import source1 from './convertReceipt-01.json'

const args = (value: string): Parameters<typeof fetchReceipt>[0] => ({ code: { format: 'qr', value }, isInBackground: true })
beforeEach(() => { Object.assign(globalThis, { ZenMoney: { locale: 'en' } }); fetchMock.catch(() => { throw new Error('Unexpected receipt request') }) })
afterEach(() => { fetchMock.restore(); jest.restoreAllMocks() })

// Complete observed response, captured 2026-11-05; receipts.csv row 1689.
test('retrieves and converts observed route 1 in the background', async () => {
  const code = 'https://suf.poreskaupravars.org/v/?vl=A0tQVTRWWDUzS1BVNFZYNTMicAAA0W8AALzoLQAAAAAAAAABoN8LUcwAAABKj8VCxasTmwTLgQ8pBQ4dXW19yOEyJvgKcieKLJu9TXTH7YmJrdt3UwaKr11gC5rWQauzErLY+lbQc8rFCbpkEMjmAKzF4O7Z2ldjTTV/p7SFGxmKJSmfUa3v18bgb+ntpYrodPWQJ1VmCShJuHkHVH/QxiYtDJf3usZzM4yfhuNIRy2OSiR1DotgMbeaKGUOaGb6AQAPPUDsIewnKiEUDEgd8lRgk6+fMfLEKXtRTQtLiDvNiwDG90IoN13mM8zk9+Vxc5gIJwZ4Equf/9Y0M5c/W+3g7PTwqHKRsWCRezdAzCuu1Z0kYjGr5WwpDdx8+A38qcmx9dtcOBx92F0GKxuYQuFdEMd+/rG3xgDLepUmXF2vXT5vJcP/vtaxglllTfKyApD943dXJmAgUjuyzmi758RVcbMUOmCqTZ718dLWXlugGs9hyTCfGxjLD8mlmxKZOj6DWID5hUjt4oH4yLFe4sdadcKhA9213ZBwWyCMWJwZndNrg4Co9mIUv6vRPS1X/DbCqEoRw/EM6hOOhc8hc07cr9PLtPb8Bn1Jxspf3eY5SnI4tsqwtiiW8kpLhuZWF8uF/Ahi/GYaiuNZRRiHBR0FZF65dySRoc9aZcCVgqzuxlwbT9cQoG4ZhOmCp35pHL0wW18kvXWs96klQV2+WSY/409JKJLQbd/m+3gjoDkDwYz2DaQRdkRCDJ0='
  fetchMock.get('https://suf.poreskaupravars.org/v/?vl=A0tQVTRWWDUzS1BVNFZYNTMicAAA0W8AALzoLQAAAAAAAAABoN8LUcwAAABKj8VCxasTmwTLgQ8pBQ4dXW19yOEyJvgKcieKLJu9TXTH7YmJrdt3UwaKr11gC5rWQauzErLY+lbQc8rFCbpkEMjmAKzF4O7Z2ldjTTV/p7SFGxmKJSmfUa3v18bgb+ntpYrodPWQJ1VmCShJuHkHVH/QxiYtDJf3usZzM4yfhuNIRy2OSiR1DotgMbeaKGUOaGb6AQAPPUDsIewnKiEUDEgd8lRgk6+fMfLEKXtRTQtLiDvNiwDG90IoN13mM8zk9+Vxc5gIJwZ4Equf/9Y0M5c/W+3g7PTwqHKRsWCRezdAzCuu1Z0kYjGr5WwpDdx8+A38qcmx9dtcOBx92F0GKxuYQuFdEMd+/rG3xgDLepUmXF2vXT5vJcP/vtaxglllTfKyApD943dXJmAgUjuyzmi758RVcbMUOmCqTZ718dLWXlugGs9hyTCfGxjLD8mlmxKZOj6DWID5hUjt4oH4yLFe4sdadcKhA9213ZBwWyCMWJwZndNrg4Co9mIUv6vRPS1X/DbCqEoRw/EM6hOOhc8hc07cr9PLtPb8Bn1Jxspf3eY5SnI4tsqwtiiW8kpLhuZWF8uF/Ahi/GYaiuNZRRiHBR0FZF65dySRoc9aZcCVgqzuxlwbT9cQoG4ZhOmCp35pHL0wW18kvXWs96klQV2+WSY/409JKJLQbd/m+3gjoDkDwYz2DaQRdkRCDJ0=', { body: JSON.stringify(source1) })
  await expect(fetchReceipt(args(code))).resolves.toEqual({ status: 'found', receipt: convertReceipt(source1) })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  expect(ZenMoney.locale).toBe('sr')
})

// Model input and transport invariants: never send unsupported input or conceal an original failure.
test('[model] unsupported host makes no request', async () => {
  await expect(fetchReceipt(args('https://other.invalid/?next=' + encodeURIComponent('https://suf.poreskaupravars.org/v/?vl=A0tQVTRWWDUzS1BVNFZYNTMicAAA0W8AALzoLQAAAAAAAAABoN8LUcwAAABKj8VCxasTmwTLgQ8pBQ4dXW19yOEyJvgKcieKLJu9TXTH7YmJrdt3UwaKr11gC5rWQauzErLY+lbQc8rFCbpkEMjmAKzF4O7Z2ldjTTV/p7SFGxmKJSmfUa3v18bgb+ntpYrodPWQJ1VmCShJuHkHVH/QxiYtDJf3usZzM4yfhuNIRy2OSiR1DotgMbeaKGUOaGb6AQAPPUDsIewnKiEUDEgd8lRgk6+fMfLEKXtRTQtLiDvNiwDG90IoN13mM8zk9+Vxc5gIJwZ4Equf/9Y0M5c/W+3g7PTwqHKRsWCRezdAzCuu1Z0kYjGr5WwpDdx8+A38qcmx9dtcOBx92F0GKxuYQuFdEMd+/rG3xgDLepUmXF2vXT5vJcP/vtaxglllTfKyApD943dXJmAgUjuyzmi758RVcbMUOmCqTZ718dLWXlugGs9hyTCfGxjLD8mlmxKZOj6DWID5hUjt4oH4yLFe4sdadcKhA9213ZBwWyCMWJwZndNrg4Co9mIUv6vRPS1X/DbCqEoRw/EM6hOOhc8hc07cr9PLtPb8Bn1Jxspf3eY5SnI4tsqwtiiW8kpLhuZWF8uF/Ahi/GYaiuNZRRiHBR0FZF65dySRoc9aZcCVgqzuxlwbT9cQoG4ZhOmCp35pHL0wW18kvXWs96klQV2+WSY/409JKJLQbd/m+3gjoDkDwYz2DaQRdkRCDJ0=')))).resolves.toEqual({ status: 'notApplicable' })
  expect(fetchMock.called()).toBe(false)
})

test('[model] original transport failures propagate', async () => {
  const failure = new Error('Connection failed')
  fetchMock.get('https://suf.poreskaupravars.org/v/?vl=A0tQVTRWWDUzS1BVNFZYNTMicAAA0W8AALzoLQAAAAAAAAABoN8LUcwAAABKj8VCxasTmwTLgQ8pBQ4dXW19yOEyJvgKcieKLJu9TXTH7YmJrdt3UwaKr11gC5rWQauzErLY+lbQc8rFCbpkEMjmAKzF4O7Z2ldjTTV/p7SFGxmKJSmfUa3v18bgb+ntpYrodPWQJ1VmCShJuHkHVH/QxiYtDJf3usZzM4yfhuNIRy2OSiR1DotgMbeaKGUOaGb6AQAPPUDsIewnKiEUDEgd8lRgk6+fMfLEKXtRTQtLiDvNiwDG90IoN13mM8zk9+Vxc5gIJwZ4Equf/9Y0M5c/W+3g7PTwqHKRsWCRezdAzCuu1Z0kYjGr5WwpDdx8+A38qcmx9dtcOBx92F0GKxuYQuFdEMd+/rG3xgDLepUmXF2vXT5vJcP/vtaxglllTfKyApD943dXJmAgUjuyzmi758RVcbMUOmCqTZ718dLWXlugGs9hyTCfGxjLD8mlmxKZOj6DWID5hUjt4oH4yLFe4sdadcKhA9213ZBwWyCMWJwZndNrg4Co9mIUv6vRPS1X/DbCqEoRw/EM6hOOhc8hc07cr9PLtPb8Bn1Jxspf3eY5SnI4tsqwtiiW8kpLhuZWF8uF/Ahi/GYaiuNZRRiHBR0FZF65dySRoc9aZcCVgqzuxlwbT9cQoG4ZhOmCp35pHL0wW18kvXWs96klQV2+WSY/409JKJLQbd/m+3gjoDkDwYz2DaQRdkRCDJ0=', { throws: failure })
  await expect(fetchReceipt(args('https://suf.poreskaupravars.org/v/?vl=A0tQVTRWWDUzS1BVNFZYNTMicAAA0W8AALzoLQAAAAAAAAABoN8LUcwAAABKj8VCxasTmwTLgQ8pBQ4dXW19yOEyJvgKcieKLJu9TXTH7YmJrdt3UwaKr11gC5rWQauzErLY+lbQc8rFCbpkEMjmAKzF4O7Z2ldjTTV/p7SFGxmKJSmfUa3v18bgb+ntpYrodPWQJ1VmCShJuHkHVH/QxiYtDJf3usZzM4yfhuNIRy2OSiR1DotgMbeaKGUOaGb6AQAPPUDsIewnKiEUDEgd8lRgk6+fMfLEKXtRTQtLiDvNiwDG90IoN13mM8zk9+Vxc5gIJwZ4Equf/9Y0M5c/W+3g7PTwqHKRsWCRezdAzCuu1Z0kYjGr5WwpDdx8+A38qcmx9dtcOBx92F0GKxuYQuFdEMd+/rG3xgDLepUmXF2vXT5vJcP/vtaxglllTfKyApD943dXJmAgUjuyzmi758RVcbMUOmCqTZ718dLWXlugGs9hyTCfGxjLD8mlmxKZOj6DWID5hUjt4oH4yLFe4sdadcKhA9213ZBwWyCMWJwZndNrg4Co9mIUv6vRPS1X/DbCqEoRw/EM6hOOhc8hc07cr9PLtPb8Bn1Jxspf3eY5SnI4tsqwtiiW8kpLhuZWF8uF/Ahi/GYaiuNZRRiHBR0FZF65dySRoc9aZcCVgqzuxlwbT9cQoG4ZhOmCp35pHL0wW18kvXWs96klQV2+WSY/409JKJLQbd/m+3gjoDkDwYz2DaQRdkRCDJ0='))).rejects.toBe(failure)
})
