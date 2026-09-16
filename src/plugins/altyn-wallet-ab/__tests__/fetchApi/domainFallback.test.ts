import type { TemporaryError } from '../../../../errors'
import { AltynAccount } from '../../models'

const mockFetchJson = jest.fn()

// Заглушка common/network: ParseError нужен для instanceof в isNetworkError
jest.mock('../../../../common/network', () => {
  class ParseError {
    response: unknown
    constructor (response: unknown) {
      this.response = response
    }
  }
  return { ParseError, fetchJson: mockFetchJson }
})

const preferences = { token: 'test-token', pin: '1234' }

function account (): AltynAccount {
  return {
    account_number: 'A-100000000001',
    bank_name: null,
    bic: null,
    bank_inn: null,
    bank_kpp: null,
    cor_account: null,
    currency: 'RUB',
    balance: '1.00'
  }
}

const okResponse = (): unknown => ({ status: 200, url: '', headers: {}, body: { results: [account()] } })

describe('фолбек домена API', () => {
  beforeEach(() => {
    // сбрасываем реестр модулей (кеш рабочего домена) между тестами;
    // классы ошибок берём из того же свежего реестра, иначе instanceof не сработает
    jest.resetModules()
    mockFetchJson.mockReset()
  })

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const freshFetchAccounts = (): typeof import('../../fetchApi')['fetchAccounts'] => require('../../fetchApi').fetchAccounts
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const freshErrors = (): typeof import('../../../../errors') => require('../../../../errors')

  it('падает на запасной домен, когда основной недоступен', async () => {
    mockFetchJson
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND api.lk.altyn.in'))
      .mockResolvedValueOnce(okResponse())

    const result = await freshFetchAccounts()(preferences)

    expect(result).toHaveLength(1)
    expect(mockFetchJson).toHaveBeenCalledTimes(2)
    expect(mockFetchJson.mock.calls[0][0]).toBe('https://api.lk.altyn.in/account/')
    expect(mockFetchJson.mock.calls[1][0]).toBe('https://api.lk.altyn.one/account/')
  })

  it('кеширует рабочий домен и не пробует недоступный повторно', async () => {
    mockFetchJson
      .mockRejectedValueOnce(new Error('connect ECONNREFUSED'))
      .mockResolvedValue(okResponse())

    const fetch = freshFetchAccounts()
    await fetch(preferences)
    await fetch(preferences)

    // только один запрос к недоступному домену за весь запуск
    expect(mockFetchJson).toHaveBeenCalledTimes(3)
    expect(mockFetchJson.mock.calls[2][0]).toBe('https://api.lk.altyn.one/account/')
  })

  it('бросает TemporaryError, когда недоступны оба домена', async () => {
    mockFetchJson
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND api.lk.altyn.in'))
      .mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND api.lk.altyn.one'))

    const error: unknown = await freshFetchAccounts()(preferences).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(freshErrors().TemporaryError)
    expect((error as TemporaryError).message).toContain('нет связи ни с одним доменом')
    expect(mockFetchJson).toHaveBeenCalledTimes(2)
  })

  it('не переключает домен на HTTP-ошибку статуса (сервер ответил)', async () => {
    mockFetchJson.mockResolvedValue({ status: 401, url: '', headers: {}, body: {} })

    const error: unknown = await freshFetchAccounts()(preferences).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(freshErrors().InvalidLoginOrPasswordError)
    expect(mockFetchJson).toHaveBeenCalledTimes(1)
    expect(mockFetchJson.mock.calls[0][0]).toBe('https://api.lk.altyn.in/account/')
  })
})
