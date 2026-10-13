import { defineConfig } from 'playwright/test'

// Playwright's disposal declaration needs this type even on the repository's TS 4.7.
// Browser tests do not use that method; production types need no newer TS features.
declare global { interface SymbolConstructor { readonly asyncDispose: unique symbol, readonly dispose: unique symbol } }

export default defineConfig({
  testDir: '..',
  testMatch: '**/*.playwright.test.ts',
  outputDir: '../node_modules/.cache/playwright-results',
  workers: 1,
  timeout: 60000,
  reporter: 'list',
  use: {
    actionTimeout: 10000,
    hasTouch: true,
    viewport: { width: 800, height: 700 },
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit', use: { browserName: 'webkit' } }
  ]
})
