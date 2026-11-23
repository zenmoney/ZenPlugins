import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../api'

afterEach(() => { fetchMock.restore() })

// The QR is from the existing public Webkassa fixture (parseWebkassaResponse-01.html).
// A live lookup redirected to /ru and returned JSON. Only the total is retained to test transport.
const query = 'i=2770949726&f=010101233847&s=1600.00&t=20220419T214746'
const origin = 'https://consumer.oofd.kz'
const code = `${origin}/?${query}`
const landingUrl = `${origin}/ru?${query}`
const lookupUrl = `${origin}/api/consumer-proxy/api/tickets/get-by-url?${query}`

test('looks up a receipt after OOFD redirects to the localized form', async () => {
  const data = { ticket: { totalSum: 1600 } }
  fetchMock.getOnce(code, { __redirectUrl: landingUrl })
  fetchMock.getOnce(lookupUrl, { body: data })

  await expect(fetchReceipt(code)).resolves.toEqual({ status: 'found', data })
})

test('[model] propagates an OOFD lookup transport failure', async () => {
  // A failed network request stays reportable and cannot produce a successful result.
  const error = new Error('Network unavailable')
  fetchMock.getOnce(code, { __redirectUrl: landingUrl })
  fetchMock.getOnce(lookupUrl, { throws: error })

  await expect(fetchReceipt(code)).rejects.toBe(error)
})
