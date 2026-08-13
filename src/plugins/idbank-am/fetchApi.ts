import crypto from 'crypto-js'
import { dateInTimezone } from '../../common/dateUtils'
import { fetchJson, FetchOptions, FetchResponse } from '../../common/network'
import { getArray, getNumber, getOptNumber, getOptString } from '../../types/get'
import { BankMessageError, InvalidLoginOrPasswordError, InvalidOtpCodeError, TemporaryError } from '../../errors'
import { LoginResult, OtpChannel, Preferences, Session } from './models'

const BASE_URL = 'https://www.idbanking.am/api'

// Банк живёт по Еревану и летнее время в Армении не переводят с 2012 года
const ARMENIA_TIMEZONE_OFFSET_MINUTES = 240

// Длины ключа и вектора инициализации в Token
const KEY_LENGTH = 32
const IV_LENGTH = 16

// Без User-Agent интернет-банк отвечает пустым телом со статусом 200.
// Представляемся честно: банк показывает эту строку в уведомлении о входе,
// и там должно быть устройство пользователя, а не выдуманный чужой компьютер
function getUserAgent (): string {
  const os = [ZenMoney.device?.os?.name, ZenMoney.device?.os?.version].filter(part => part != null && part !== '').join(' ')
  const version = ZenMoney.application?.version
  return `ZenMoney${version != null && version !== '' ? `/${version}` : ''}${os !== '' ? ` (${os})` : ''}`
}

// Коды ответа из OpCode интернет-банка
export const OP_CODE = {
  success: 0,
  attemptUnsuccessful: 3,
  accountBlocked: 7,
  incorrectActivationCode: 21,
  authorizationFailed: 33,
  codeNotValid: 52,
  accountIsBlocked: 54,
  incorrectPassword: 55,
  unverifiedDevice: 255,
  unrecognizedDevice: 363
}

// Идентификаторы устройства и сессии в логи не пишем
const SANITIZE_HEADERS = { device_id: true, _SessionId_: true }

interface RequestParams {
  deviceId: string
  sessionId?: string
  body?: Record<string, unknown>
  // Ключ шифрования тела из Login. Без него тело уходит открытым JSON
  token?: string
  // Коды, которые разбирает вызывающий код, а не общий обработчик ошибок
  allowedOpCodes?: number[]
}

async function fetchApi (path: string, { deviceId, sessionId, body, token, allowedOpCodes }: RequestParams, options?: FetchOptions): Promise<unknown> {
  const encrypted = body != null && token != null
  const headers: Record<string, string> = {
    'User-Agent': getUserAgent(),
    Origin: 'https://www.idbanking.am',
    Referer: 'https://www.idbanking.am/',
    Lang: 'en',
    device_id: deviceId
  }
  if (!encrypted) {
    // Интернет-банк разрешает отправлять тело открытым JSON с этим заголовком
    headers._EncMethod_ = 'NONE'
  }
  if (sessionId != null) {
    headers._SessionId_ = sessionId
  }
  const response = await fetchJson(`${BASE_URL}/${path}`, {
    method: 'POST',
    headers,
    ...body != null && token != null
      ? { body: encryptBody(body, token), stringify: (body: string) => body }
      : body != null ? { body } : {},
    ...options,
    sanitizeRequestLog: {
      headers: SANITIZE_HEADERS,
      ...(options?.sanitizeRequestLog as Record<string, unknown> | undefined)
    }
  })
  if (response.status >= 500 || response.status === 429) {
    throw new TemporaryError('Банк временно недоступен. Повторите синхронизацию позже.')
  }
  return handleOpCode(response, allowedOpCodes ?? [])
}

// Token приходит в виде '<ключ 32 байта>-<вектор инициализации 16 байт>'.
// Режем по длине, а не по дефису: он может встретиться и внутри ключа
function encryptBody (body: Record<string, unknown>, token: string): string {
  const key = token.slice(0, KEY_LENGTH)
  const iv = token.slice(KEY_LENGTH + 1)
  console.assert(key.length === KEY_LENGTH && iv.length === IV_LENGTH, 'unexpected token format')
  return crypto.AES.encrypt(crypto.enc.Utf8.parse(JSON.stringify(body)), crypto.enc.Utf8.parse(key), {
    iv: crypto.enc.Utf8.parse(iv),
    mode: crypto.mode.CBC,
    padding: crypto.pad.Pkcs7
  }).toString()
}

function handleOpCode (response: FetchResponse, allowedOpCodes: number[]): unknown {
  // Часть эндпоинтов отдаёт данные без кода результата, а часть — строкой
  const opCode = parseOpCode(response.body)
  if (opCode == null || opCode === OP_CODE.success || allowedOpCodes.includes(opCode)) {
    return response.body
  }
  switch (opCode) {
    case OP_CODE.incorrectActivationCode:
    case OP_CODE.codeNotValid:
      throw new InvalidOtpCodeError()
    case OP_CODE.accountBlocked:
    case OP_CODE.accountIsBlocked:
      throw new TemporaryError('Банк заблокировал доступ к аккаунту. Обратитесь в контактный центр Idram +374 60 700700.')
    case OP_CODE.authorizationFailed:
      throw new TemporaryError('Банк завершил сессию. Повторите синхронизацию.')
    case OP_CODE.unrecognizedDevice:
      throw new TemporaryError(
        'Банк не узнал устройство и запретил вход. Позвоните в контактный центр Idram ' +
        '+374 60 700700, попросите разрешить вход, затем повторите синхронизацию.'
      )
    default:
      // OpDesc в норме содержит машинный код вида 'Err:EN-0', человеку он бесполезен
      throw new BankMessageError(parseBankMessage(response.body) ?? `OpCode ${opCode}`)
  }
}

// Код результата приходит то числом, то строкой, а у выписки его нет вовсе
function parseOpCode (body: unknown): number | null {
  const rawOpCode = getOptNumber(body, 'OpCode') ?? getOptString(body, 'OpCode')
  return rawOpCode != null ? Number(rawOpCode) : null
}

function parseBankMessage (body: unknown): string | null {
  const message = getOptString(body, 'OpDesc')
  return message != null && message !== '' && !/^Err:[A-Z]{2}-\d+$/.test(message) ? message : null
}

export async function fetchLogin ({ phone, password }: Preferences, deviceId: string): Promise<LoginResult> {
  const response = await fetchApi('Signin/Login', {
    deviceId,
    body: { u: phone, p: password },
    // Про неверные данные и новое устройство банк сообщает кодом, разбираем их сами
    allowedOpCodes: [OP_CODE.attemptUnsuccessful, OP_CODE.incorrectPassword, OP_CODE.unverifiedDevice]
  }, {
    sanitizeRequestLog: { body: { u: true, p: true } },
    sanitizeResponseLog: { body: { Token: true, SessionId: true, AccountId: true, Phone: true, Email: true } }
  })
  const opCode = parseOpCode(response)
  if (opCode === OP_CODE.attemptUnsuccessful || opCode === OP_CODE.incorrectPassword) {
    throw new InvalidLoginOrPasswordError()
  }
  if (opCode === OP_CODE.unverifiedDevice) {
    return {
      isDeviceVerified: false,
      accountId: getNumber(response, 'AccountId'),
      channels: parseOtpChannels(response)
    }
  }
  return { isDeviceVerified: true, ...parseSession(response, '') }
}

// Ассерт вместо явной проверки вывалил бы в лог весь ответ вместе с ключами
function parseSession (response: unknown, prefix: string): { sessionId: string, token: string } {
  const sessionId = getOptString(response, `${prefix}SessionId`)
  const token = getOptString(response, `${prefix}Token`)
  if (sessionId == null || token == null) {
    throw new TemporaryError('Банк не открыл сессию. Повторите синхронизацию.')
  }
  return { sessionId, token }
}

// Банк перечисляет доступные способы доставки кода прямо в ответе на вход
function parseOtpChannels (response: unknown): OtpChannel[] {
  const channels: OtpChannel[] = []
  for (const [path, kind] of [['Phone', 'phone'], ['Email', 'email']] as Array<[string, OtpChannel['kind']]>) {
    const type = getOptNumber(response, `${path}.ChannelType`)
    if (type != null) {
      channels.push({ type, kind, recipient: getOptString(response, `${path}.Value`) ?? '' })
    }
  }
  return channels
}

export async function fetchOtp (accountId: number, channelType: number, deviceId: string): Promise<void> {
  await fetchApi('SignIn/SendFingerPrintOtp', {
    deviceId,
    body: { AccountId: accountId, ChannelType: channelType }
  }, {
    sanitizeRequestLog: { body: { AccountId: true } }
  })
}

export async function fetchDeviceConfirmation (accountId: number, code: string, channelType: number, deviceId: string): Promise<{ sessionId: string, token: string }> {
  const response = await fetchApi('SignIn/DeviceConfirm', {
    deviceId,
    body: { Code: code, AccountId: accountId, ChannelType: channelType }
  }, {
    sanitizeRequestLog: { body: { Code: true, AccountId: true } },
    sanitizeResponseLog: { body: { Result: true } }
  })
  return parseSession(response, 'Result.')
}

export async function fetchAccounts (session: Session): Promise<unknown[]> {
  const response = await fetchApi('MyInfo/getClientAccounts', {
    deviceId: session.auth.deviceId,
    sessionId: session.sessionId
  }, {
    // В ответе полные номера счетов и телефон клиента
    sanitizeResponseLog: { body: { Result: true } }
  })
  return getArray(response, 'Result')
}

export async function fetchCards (session: Session): Promise<unknown[]> {
  const response = await fetchApi('MyInfo/getClientCards', {
    deviceId: session.auth.deviceId,
    sessionId: session.sessionId
  }, {
    // В ответе полные номера карт и телефон клиента
    sanitizeResponseLog: { body: { Result: true } }
  })
  return getArray(response, 'Result')
}

export async function fetchAccountTransactions (accountNumber: string, fromDate: Date, toDate: Date, session: Session): Promise<unknown[]> {
  const response = await fetchApi('MyInfo/getAccTransactionsByDays', {
    deviceId: session.auth.deviceId,
    sessionId: session.sessionId,
    token: session.token,
    body: {
      account: accountNumber,
      fromdate: formatDate(fromDate),
      todate: formatDate(toDate),
      format: ''
    }
  }, {
    // Details каждой карточной операции содержит полный номер карты
    sanitizeResponseLog: { body: { AccTranByDaysList: true, CustomerName: true } }
  })
  return getArray(response, 'AccTranByDaysList')
}

// Интернет-банк ждёт даты в формате 'DD/MM/YYYY' и по своему календарю:
// ночная покупка в Ереване иначе выпадет из выписки до утра
function formatDate (date: Date): string {
  const local = dateInTimezone(date, ARMENIA_TIMEZONE_OFFSET_MINUTES)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(local.getDate())}/${pad(local.getMonth() + 1)}/${local.getFullYear()}`
}
