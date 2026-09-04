import { InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryError, UserInteractionError } from '../../../../errors'
import { Preferences } from '../../models'
import { AUTO_SUBMIT_PAGE } from '../../__fixtures__/autoSubmitPage'
import { LOGIN_PAGE } from '../../__fixtures__/loginPage'
import { MAIN_PAGE } from '../../__fixtures__/mainPage'
import { PIN_PAGE } from '../../__fixtures__/pinPage'

const mockFetch = jest.fn()

jest.mock('../../../../common/network', () => ({ fetch: mockFetch }))
// Банка cookie здесь не проверяется, а её обёртка мешала бы увидеть сами запросы
jest.mock('../../../../common/cookie/fetchCookie', () => ({ makeFetchCookie: (fetch: unknown) => fetch }))

const preferences: Preferences = { login: 'user', password: 'secret', otpChannel: '5' }

// Настоящая страница содержимого несёт форму Pages с номером клиента —
// по ней и опознаётся живая сессия
const CONTENT_PAGE = '<form name=Pages><input type="hidden" name="custid" value="100500">' +
  '<input type="hidden" name="csrf_token" value="3"></form>' +
  "<script>records: [{ recid: 1,c1: '22300100000001',c8: 'USD',c4: '1',c6: '1'}]</script>"

function respondWith (...bodies: string[]): void {
  for (const body of bodies) {
    mockFetch.mockResolvedValueOnce({ status: 200, url: 'https://online.artsakhbank.am/', headers: {}, body })
  }
}

// Полный путь до страницы счетов: форма входа, смена языка, пароль,
// промежуточная страница, главная и первая содержательная страница.
// Последним вход догружает страницу карт — до сохранения сессии
function respondWithSignIn (firstPage: string, ...rest: string[]): void {
  respondWith(LOGIN_PAGE, LOGIN_PAGE, AUTO_SUBMIT_PAGE, MAIN_PAGE, firstPage, ...rest, CONTENT_PAGE)
}

// Тело уходит одной multipart-строкой, разбираем её обратно в поля
function sentFields (index: number): Record<string, string> {
  const body = mockFetch.mock.calls[index][1].body as string
  const fields: Record<string, string> = {}
  for (const match of body.matchAll(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n--/g)) {
    fields[match[1]] = match[2]
  }
  return fields
}

describe('вход', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { login } = require('../../api') as typeof import('../../api')
  let readLine: jest.Mock

  beforeEach(() => {
    readLine = jest.fn()
    // Платформа не 'browser', иначе плагин начнёт снимать страницы для разбора
    global.ZenMoney = {
      readLine,
      getData: jest.fn(),
      setData: jest.fn(),
      saveData: jest.fn(),
      application: { platform: 'ios' }
    } as unknown as typeof ZenMoney
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.ZenMoney = undefined as unknown as typeof ZenMoney
  })

  it('переключает форму на английский до того, как отправит логин', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(mockFetch.mock.calls[0][1].method).toBe('GET')
    expect(sentFields(1)).toEqual({ ACTION: 'PGLANG', csrf_token: 'TESTCSRFTOKEN0001', lang: '2' })
  })

  it('отправляет логин, пароль и выбранный способ доставки кода', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(sentFields(2)).toEqual({
      ACTION: 'PGLOGIN',
      csrf_token: 'TESTCSRFTOKEN0001',
      lang: '2',
      login: 'user',
      password: 'secret',
      secur_kind: '5',
      mysecure_kind: '5'
    })
  })

  // Браузерный отладчик читает из preferences.xml только EditTextPreference,
  // поэтому списка otpChannel в разработке не существует
  it('выбирает СМС, когда способ доставки не задан', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login({ login: 'user', password: 'secret' }, false)

    expect(sentFields(2)).toEqual(expect.objectContaining({ secur_kind: '3', mysecure_kind: '3' }))
  })

  it('берёт токен из последней отданной страницы, а не из первой', async () => {
    const rotated = LOGIN_PAGE.replace('TESTCSRFTOKEN0001', 'TESTCSRFTOKEN0002')
    respondWith(LOGIN_PAGE, rotated, AUTO_SUBMIT_PAGE, MAIN_PAGE, CONTENT_PAGE, CONTENT_PAGE)

    await login(preferences, false)

    expect(sentFields(1).csrf_token).toBe('TESTCSRFTOKEN0001')
    expect(sentFields(2).csrf_token).toBe('TESTCSRFTOKEN0002')
  })

  it('не шлёт секреты форм в лог', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(mockFetch.mock.calls[2][1].sanitizeRequestLog).toMatchObject({ body: true })
    expect(mockFetch.mock.calls[3][1].sanitizeRequestLog).toMatchObject({ body: true })
  })

  // Секреты банк раскладывает не только по телу: сессия живёт в cookie,
  // а номер клиента и номер счёта уходят строкой запроса
  it('маскирует cookie сессии и секреты строки запроса во всех запросах', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    for (const [, options] of mockFetch.mock.calls) {
      expect(options.sanitizeRequestLog.headers).toMatchObject({ cookie: true })
      expect(options.sanitizeRequestLog.url.query).toMatchObject({ custid: true, PARAM: true })
      expect(options.sanitizeResponseLog.headers).toMatchObject({ 'set-cookie': true })
    }
  })

  it('сообщает словами банка, когда тот вернул форму входа обратно', async () => {
    respondWith(LOGIN_PAGE, LOGIN_PAGE, `${LOGIN_PAGE}<script>$('#login').w2tag('Wrong login or password')</script>`)

    const error = await login(preferences, false).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(InvalidLoginOrPasswordError)
    expect(error).toEqual(expect.objectContaining({ message: expect.stringContaining('Wrong login or password') }))
  })

  // Браузер проходит эту страницу сам; без ручного повтора мы бы остановились
  // на промежуточной странице и никогда не дошли до данных
  it('идёт по промежуточной странице на main.php её же полями', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(mockFetch.mock.calls[3][0]).toBe('https://online.artsakhbank.am/main.php')
    expect(sentFields(3)).toEqual({ ACTION: 'LOGIN', ssl_Kind: '3', csrf_token: 'TESTCSRFTOKEN0002' })
  })

  it('просит содержимое через param.php с номером клиента', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    const url = mockFetch.mock.calls[4][0] as string
    expect(url).toContain('/param.php?')
    expect(url).toContain('custid=100500')
    expect(url).toContain('page=accounts')
    expect(url).toContain('lang=2')
  })

  it('не принимает за сессию ответ без номера клиента', async () => {
    respondWith(LOGIN_PAGE, LOGIN_PAGE, AUTO_SUBMIT_PAGE, '<html>error</html>')

    await expect(login(preferences, false)).rejects.toBeInstanceOf(TemporaryError)
  })
})

describe('подтверждение входа кодом', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { login } = require('../../api') as typeof import('../../api')
  let readLine: jest.Mock

  beforeEach(() => {
    readLine = jest.fn()
    global.ZenMoney = {
      readLine,
      getData: jest.fn(),
      setData: jest.fn(),
      saveData: jest.fn(),
      application: { platform: 'ios' }
    } as unknown as typeof ZenMoney
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.ZenMoney = undefined as unknown as typeof ZenMoney
  })

  it('повторяет SetPin: подменяет page и ACTION и досылает код', async () => {
    respondWithSignIn(PIN_PAGE, CONTENT_PAGE, CONTENT_PAGE)
    readLine.mockResolvedValueOnce('123456')

    await login(preferences, false)

    expect(mockFetch.mock.calls[5][0]).toBe('https://online.artsakhbank.am/param.php')
    expect(sentFields(5)).toEqual({
      csrf_token: '3',
      lang: '2',
      custid: '100500',
      page: 'AFTERLOGIN',
      isdoc: '0',
      ACTION: 'CHPASS',
      REASON: '.',
      CONPASS_REQ: '123456',
      // Банк присылает своё время в скрытом поле, отправляем его обратно как есть
      TIME: '00:22:54'
    })
  })

  it('отправляет код без лишних пробелов', async () => {
    respondWithSignIn(PIN_PAGE, CONTENT_PAGE, CONTENT_PAGE)
    readLine.mockResolvedValueOnce('  123456 ')

    await login(preferences, false)

    expect(sentFields(5).CONPASS_REQ).toBe('123456')
  })

  it('не спрашивает код, когда банк его не просит', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(readLine).not.toHaveBeenCalled()
  })

  // Банк блокирует учётную запись за повторные неудачные входы, поэтому в фоне,
  // где код спросить не у кого, до отправки логина дело доходить не должно
  it('в фоновой синхронизации не отправляет логин и не тратит попытку входа', async () => {
    await expect(login(preferences, true)).rejects.toBeInstanceOf(UserInteractionError)

    expect(readLine).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // Второй фактор включён не у всех: тому, у кого банк код не просит,
  // фоновая синхронизация должна работать молча
  it('в фоне всё же входит, если банк код у этого пользователя не спрашивал', async () => {
    const getData = jest.fn().mockImplementation((key: string) => key === 'otpRequired' ? false : undefined)
    global.ZenMoney = { ...global.ZenMoney, getData } as unknown as typeof ZenMoney
    respondWithSignIn(CONTENT_PAGE)

    await expect(login(preferences, true)).resolves.toEqual(
      expect.objectContaining({ accountsPage: expect.any(String), cardsPage: expect.any(String) }))
  })

  it('запоминает появившееся требование кода до выхода из фоновой синхронизации', async () => {
    const getData = jest.fn().mockImplementation((key: string) => key === 'otpRequired' ? false : undefined)
    global.ZenMoney = { ...global.ZenMoney, getData } as unknown as typeof ZenMoney
    respondWithSignIn(PIN_PAGE)

    await expect(login(preferences, true)).rejects.toBeInstanceOf(UserInteractionError)

    expect(ZenMoney.setData).toHaveBeenCalledWith('otpRequired', true)
    expect(ZenMoney.saveData).toHaveBeenCalled()
  })

  it('останавливается, когда код не введён, и не дёргает банк впустую', async () => {
    respondWithSignIn(PIN_PAGE)
    readLine.mockResolvedValueOnce('')

    await expect(login(preferences, false)).rejects.toBeInstanceOf(InvalidOtpCodeError)
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })

  // Банк не отвечает кодом ошибки: на неверный код он снова рисует ту же форму
  it('распознаёт неверный код по повторной форме', async () => {
    respondWithSignIn(PIN_PAGE, PIN_PAGE)
    readLine.mockResolvedValueOnce('000000')

    await expect(login(preferences, false)).rejects.toBeInstanceOf(InvalidOtpCodeError)
  })
})

describe('переиспользование сессии', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { login } = require('../../api') as typeof import('../../api')
  let getData: jest.Mock
  let setData: jest.Mock
  let readLine: jest.Mock

  const STORED = {
    cookies: { bcsession: 'stored-session' },
    context: { custid: '100500', csrfToken: '3' }
  }

  beforeEach(() => {
    getData = jest.fn()
    setData = jest.fn()
    readLine = jest.fn()
    global.ZenMoney = {
      readLine, getData, setData, saveData: jest.fn(), application: { platform: 'ios' }
    } as unknown as typeof ZenMoney
  })

  afterEach(() => {
    jest.resetAllMocks()
    global.ZenMoney = undefined as unknown as typeof ZenMoney
  })

  // Ради этого всё и затевалось: пока банк помнит сессию, код не спрашиваем
  it('пропускает вход и код, когда прошлая сессия ещё жива', async () => {
    getData.mockReturnValueOnce(STORED)
    respondWith(CONTENT_PAGE, CONTENT_PAGE)

    await login(preferences, false)

    // Только счета и карты: ни входа, ни кода
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(readLine).not.toHaveBeenCalled()
  })

  it('заходит заново, когда банк забыл сессию', async () => {
    getData.mockReturnValueOnce(STORED)
    respondWith(PIN_PAGE)
    respondWithSignIn(CONTENT_PAGE)
    readLine.mockResolvedValueOnce('123456')

    await login(preferences, false)

    expect(mockFetch.mock.calls[1][0]).toContain('/login.php')
  })

  it('запоминает сессию после успешного входа', async () => {
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(setData).toHaveBeenCalledWith('auth', expect.objectContaining({
      context: { custid: '100500', csrfToken: '3' }
    }))
  })

  it('не спотыкается, когда сохранённой сессии ещё нет', async () => {
    getData.mockReturnValueOnce(undefined)
    respondWithSignIn(CONTENT_PAGE)

    await expect(login(preferences, false)).resolves.toEqual(expect.objectContaining({ accountsPage: expect.any(String) }))
  })

  // Раньше проверка была отрицательной, и неузнанный ответ банка проходил
  // как живая сессия: дальше в конвертер уезжала пустая страница
  it('не принимает за живую сессию неузнанный ответ банка', async () => {
    getData.mockReturnValueOnce(STORED)
    respondWith('<html><body>Service unavailable</body></html>')
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(mockFetch.mock.calls[1][0]).toContain('/login.php')
  })

  // Банк отдаёт грид только при первой загрузке страницы, поэтому сессия без
  // данных на странице счетов бесполезна: запрашивать её второй раз нельзя
  it('не принимает сессию, на которой страница счетов приходит без данных', async () => {
    getData.mockReturnValueOnce(STORED)
    respondWith('<form name=Pages><input type="hidden" name="custid" value="100500"></form>')
    respondWithSignIn(CONTENT_PAGE)

    await login(preferences, false)

    expect(mockFetch.mock.calls[1][0]).toContain('/login.php')
  })
})
