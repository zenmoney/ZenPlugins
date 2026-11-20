import fetchMock from 'fetch-mock'
import { InvalidPreferencesError, TemporaryError, ZPAPIError } from '../../../errors'
import { ScrapeFunc } from '../../../types/zenmoney'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { scrape } = require('../index') as { scrape: ScrapeFunc<{ phone: string, password: string }> }

const params = {
  preferences: { phone: 'model-phone', password: 'model-password' },
  fromDate: new Date('2026-11-17T00:00:00Z'),
  toDate: new Date('2026-11-18T00:00:00Z'),
  isFirstRun: true,
  isInBackground: false
}

beforeEach(() => {
  const zenMoney: Partial<typeof ZenMoney> = {}
  global.ZenMoney = zenMoney as typeof ZenMoney
  // mail_inbound 222670, mtbank build 157, 2026-11-18, userIdentityByPhone.
  // Reduced to the success flag used before checking the password; no cookie is needed here.
  fetchMock.post('https://mybank.by/api/v1/login/userIdentityByPhone', { status: 200, body: { success: true } })
})

afterEach(() => fetchMock.restore())

it('shows a credential error for the observed rejection without a bank error code', async () => {
  // Same log, login/checkPassword4; reduced to the failure flag and classification fields.
  fetchMock.post('https://mybank.by/api/v1/login/checkPassword4', {
    status: 200,
    body: { success: false, error: { code: null, error_description: 'Bad credentials' } }
  })
  const result = scrape(params)
  await expect(result).rejects.toBeInstanceOf(InvalidPreferencesError)
  await expect(result).rejects.toHaveProperty('message', 'Неверный номер телефона или пароль')
  expect(ZenMoney.locale).toBe('ru')
})

it('[model] preserves transport failures without blaming the credentials', async () => {
  // A failed password request is not evidence of an incorrect password.
  const failure = new Error('transport failed')
  fetchMock.post('https://mybank.by/api/v1/login/checkPassword4', { throws: failure })
  const result = scrape(params)
  await expect(result).rejects.toBe(failure)
  await expect(result).rejects.not.toBeInstanceOf(ZPAPIError)
})

it('reports the bank waiting period when password checks are temporarily locked', async () => {
  // mail_inbound 224792, build 157, login/checkPassword4, reduced to the rejection fields.
  fetchMock.post('https://mybank.by/api/v1/login/checkPassword4', {
    status: 200,
    body: { success: false, error: { code: null, error_description: 'Пользователь временно заблокирован. Время блокировки: 90 сек.' } }
  })
  const result = scrape(params)
  await expect(result).rejects.toBeInstanceOf(TemporaryError)
  await expect(result).rejects.toHaveProperty('message', 'Пользователь временно заблокирован. Время блокировки: 90 сек.')
})
