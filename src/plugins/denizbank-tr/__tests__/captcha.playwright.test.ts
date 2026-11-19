import path from 'path'
import { buildSync } from 'esbuild'
import { test, expect } from 'playwright/test'

const source = buildSync({ entryPoints: [path.resolve(__dirname, '../captcha.webview.ts')], bundle: true, format: 'iife', globalName: 'DenizCaptchaPage', target: 'es2020', write: false }).outputFiles[0].text
const pixel = 'R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

test.use({ viewport: { width: 390, height: 780 }, colorScheme: 'light' })

// Models browser interaction with opaque UI challenges; no bank requests or credential submission.
test('refreshes the image, clears old input and submits the displayed revision', async ({ page }, testInfo) => {
  let revision = 0
  const submitted: unknown[] = []
  await page.exposeFunction('denizCaptchaRefresh', () => ({ image: pixel, revision: ++revision }))
  await page.exposeFunction('denizCaptchaSubmit', (version: number, code: string) => { submitted.push({ revision: version, code }); return null })
  await page.exposeFunction('denizCaptchaCancel', () => {})
  await page.setContent('<html><head></head><body></body></html>')
  await page.addScriptTag({ content: source + ';DenizCaptchaPage.mount();' })
  await expect(page.getByLabel('Resimdeki kod')).toBeEnabled()
  await expect.poll(async () => await page.locator('img').evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true)
  await page.screenshot({ path: path.resolve('.local/checks/captcha-preview-' + testInfo.project.name + '.png') })
  await page.getByLabel('Resimdeki kod').fill('old')
  await page.getByRole('button', { name: 'Yeni resim' }).click()
  await expect(page.getByLabel('Resimdeki kod')).toHaveValue('')
  await expect(page.getByRole('status')).toHaveText('Resim yenilendi. Yeni kodu girin.')
  await page.getByLabel('Resimdeki kod').fill('new')
  await page.getByRole('button', { name: 'Devam et' }).click()
  await expect.poll(() => submitted).toEqual([{ revision: 2, code: 'new' }])
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
})

test('automatically replaces a minute-old image before accepting new input', async ({ page }) => {
  let revision = 0
  await page.clock.install({ time: new Date('2026-11-15T00:00:00Z') })
  await page.exposeFunction('denizCaptchaRefresh', () => ({ image: pixel, revision: ++revision }))
  await page.exposeFunction('denizCaptchaSubmit', () => null)
  await page.exposeFunction('denizCaptchaCancel', () => {})
  await page.setContent('<html><head></head><body></body></html>')
  await page.addScriptTag({ content: source + ';DenizCaptchaPage.mount();' })
  await expect(page.getByLabel('Resimdeki kod')).toBeEnabled()
  await page.getByLabel('Resimdeki kod').fill('old')
  await page.clock.fastForward(60000)
  await expect(page.getByLabel('Resimdeki kod')).toHaveValue('')
  await expect.poll(() => revision).toBe(2)
  await expect(page.getByRole('status')).toHaveText('Resim yenilendi. Yeni kodu girin.')
})
