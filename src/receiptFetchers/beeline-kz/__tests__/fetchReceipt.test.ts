import fetchMock from 'fetch-mock'
import { fetchReceipt } from '../index'
import { convertReceipt } from '../converters'
import { manifest } from '../ZenmoneyManifest'
import html from './convertReceipt-02.html'

// Observed slashless /t URL, receipts.csv row 1175; complete public page captured 2026-11-05.
const code = 'https://ofd.beeline.kz/t?i=458561192526&f=010103277637&s=3500.0&t=20260107T141054'
afterEach(() => fetchMock.restore())
test('matches and retrieves the slashless receipt route', async () => {
  fetchMock.get(code, { body: html })
  const matcher = manifest.capabilities.fetchReceipt?.matcher
  expect(matcher instanceof RegExp && matcher.test(code)).toBe(true)
  await expect(fetchReceipt({ code: { format: 'qr', value: code }, isInBackground: true })).resolves.toEqual({ status: 'found', receipt: convertReceipt(html) })
})
