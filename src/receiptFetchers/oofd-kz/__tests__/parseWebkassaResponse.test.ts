import fixture1 from './parseWebkassaResponse-01.html'
import fixture2 from './convertReceipt-01.json'
import { parseWebkassaResponse } from '../api'
import { fetchReceipt } from '../index'

const html: string = fixture1
const parameters = {
  fiscalNumber: '2770949726',
  cashboxNumber: '010101233847',
  totalSum: '1600.00',
  purchaseTime: '20220419T214746'
}

test('extracts OOFD lookup parameters from the original Webkassa page', () => {
  expect(parseWebkassaResponse(html)).toEqual(parameters)
})

function response (body: unknown, url: string): Response {
  const result = new Response(typeof body === 'string' ? body : JSON.stringify(body))
  Object.defineProperty(result, 'url', { value: url })
  return result
}

test('follows the Webkassa redirect before loading the OOFD JSON receipt', async () => {
  const previousFetch = global.fetch
  const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
    .mockResolvedValueOnce(response(html, 'https://kkm.webkassa.kz/fixture'))
    .mockResolvedValueOnce(response('', 'https://consumer.oofd.kz/ticket/fixture'))
    .mockResolvedValueOnce(response(fixture2, 'https://consumer.oofd.kz/api/tickets/ticket/fixture'))
  global.fetch = fetchMock
  try {
    await expect(fetchReceipt({ code: { format: 'qr', value: 'http://kkm.webkassa.kz/fixture' }, isInBackground: false })).resolves.toHaveProperty('status', 'found')
    const calls = fetchMock.mock.calls
    expect(calls[0][0]).toBe('https://kkm.webkassa.kz/fixture')
    const lookupUrl = calls[1][0]
    assert(typeof lookupUrl === 'string', 'Expected OOFD lookup URL')
    expect(Object.fromEntries(new URL(lookupUrl).searchParams)).toEqual({ i: parameters.fiscalNumber, f: parameters.cashboxNumber, s: parameters.totalSum, t: parameters.purchaseTime })
    expect(calls[2][0]).toBe('https://consumer.oofd.kz/api/tickets/ticket/fixture')
  } finally {
    global.fetch = previousFetch
  }
})

test('a redirect to the root means absence; an unexpected path remains an error', async () => {
  const previousFetch = global.fetch
  global.fetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
    .mockResolvedValueOnce(response('', 'https://consumer.oofd.kz/'))
    .mockResolvedValueOnce(response('', 'https://consumer.oofd.kz/login'))
  const args = { code: { format: 'qr' as const, value: 'https://consumer.oofd.kz/?i=70000001&f=70000002&s=5766&t=20210303T132501' }, isInBackground: false }
  try {
    await expect(fetchReceipt(args)).resolves.toEqual({ status: 'notFound' })
    await expect(fetchReceipt(args)).rejects.toThrow('Unexpected OOFD receipt path')
  } finally {
    global.fetch = previousFetch
  }
})
