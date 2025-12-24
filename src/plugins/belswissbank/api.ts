import { fetch, FetchOptions, FetchResponse } from '../../common/network'
import { InvalidOtpCodeError, UserInteractionError } from '../../errors'
import { APP_VERSION } from './consts'
import { Device, Preferences, Session } from './models'
import { Strings } from './strings'
import { encryptCredentials, formatToApiDate, getDevice } from './utils'
import _ from 'lodash'

const BASE_URL = 'https://mobile.bsb.by/api/v1/'

interface LoginResponse {
  needSecondFactor: boolean
  payload?: {
    userDeviceId: string
    userLoginId: number
  }
  tokens?: {
    accessToken: string
    widgetToken: string
  }
}

function raiseUnhandledResponse (response: FetchResponse): never {
  const header = _.get(response.body, 'header', '') as string
  const message = _.get(response.body, 'message') as string
  const code = _.get(response.body, 'code') as string
  const rest = _.omit(response.body as {}, 'header', 'message', 'code')
  throw new Error([
    `${response.status} ${code}: ${header}`,
    message,
    Object.keys(rest).length > 0 ? JSON.stringify(rest) : ''
  ].filter(Boolean).join('\n'))
}

export class Api {
  private readonly preferences: Preferences
  private readonly device: Device

  private _session: Session | null = null

  get session (): Session {
    console.assert(this._session !== null, 'Session is not initialized')
    return this._session as Session
  }

  constructor (preferences: Preferences) {
    this.preferences = preferences
    this.device = getDevice()
  }

  async fetchCards (): Promise<unknown[]> {
    const response = await this.fetchApi('card-management/cards/actual?with-tokenized=false&with-hidden=false', {
      method: 'GET'
    })
    return response.body as unknown[]
  }

  async fetchAccounts (): Promise<unknown[]> {
    const response = await this.fetchApi('account-management/accounts?is-bpk=false&is-arrest=false&with-expired-card=false', {
      method: 'GET'
    })
    return response.body as unknown[]
  }

  async fetchTransactions (cardId: number, fromDate: Date, toDate: Date): Promise<unknown[]> {
    const pageSize = 50
    let pageNumber = 1
    let finished = false
    const transactions: unknown[] = []

    while (!finished) {
      const response = await this.fetchApi('payment-management/payments/search', {
        method: 'POST',
        body: {
          cardId,
          endDate: formatToApiDate(toDate),
          startDate: formatToApiDate(fromDate),
          nameSearch: '',
          pageNumber,
          pageSize,
          showConsumptions: false,
          showEnrollments: false,
          showTransfers: false
        }
      })

      const payments = _.get(response.body, 'payments') as unknown[]
      const totalPages = _.get(response.body, 'totalPage', 1) as number
      const currentPage = _.get(response.body, 'currentPage', 1) as number

      pageNumber += 1
      if (currentPage >= totalPages) {
        finished = true
      }

      transactions.push(...payments)
    }
    return transactions
  }

  async login (isInBackground: boolean): Promise<void> {
    let loginResponse: LoginResponse
    do {
      const salt = await this.fetchSalt()
      loginResponse = await this.authLogin(salt)
      if (!loginResponse.needSecondFactor && loginResponse.tokens !== undefined) {
        this._session = {
          accessToken: loginResponse.tokens.accessToken
          // widgetToken: loginResponse.tokens!.widgetToken
        }
        break
      } else if (loginResponse.needSecondFactor && loginResponse.payload !== undefined) {
        if (isInBackground) {
          throw new UserInteractionError()
        }
        await this.sendSmsCode(loginResponse.payload.userLoginId)
        const smsCode = await this.askSmsCode()
        await this.confirmSmsCode(smsCode, loginResponse.payload.userDeviceId)
      }
    } while (loginResponse.needSecondFactor)
  }

  private async confirmSmsCode (code: string, userDeviceId: string): Promise<void> {
    const response = await this.fetchApi('authentication-management/free-zone/auth/check-device-code', {
      method: 'POST',
      body: {
        smsCode: code,
        userDeviceId
      },
      sanitizeRequestLog: {
        body: {
          smsCode: true,
          userDeviceId: true
        }
      },
      parse: () => null,
      isUnhandled: () => false
    })
    if (response.status !== 200) {
      throw new Error(`Unexpected confirm SMS code response status: ${response.status}`)
    }
  }

  private async askSmsCode (): Promise<string> {
    const code = await ZenMoney.readLine(Strings.AskSmsCode, { inputType: 'text', time: 120000 })
    if (code === null || code.trim().length === 0) {
      throw new InvalidOtpCodeError(Strings.ErrorSmsIsEmpty)
    }

    return code.trim()
  }

  private async sendSmsCode (loginId: number): Promise<void> {
    await this.fetchApi('authentication-management/free-zone/auth/send-code', {
      method: 'POST',
      body: {
        userLoginId: loginId,
        userDevice: this.getUserDevice(),
        deviceNotificationToken: ''
      },
      sanitizeRequestLog: {
        body: {
          userLoginId: true
        }
      },
      parse: () => null
    })
  }

  private async authLogin (salt: string): Promise<LoginResponse> {
    const response = await this.fetchApi('authentication-management/free-zone/auth/login', {
      method: 'POST',
      body: {
        password: encryptCredentials(this.preferences.password.trim(), salt),
        username: encryptCredentials(this.preferences.username.trim(), salt),
        userDevice: this.getUserDevice(),
        deviceNotificationToken: ''
      },
      sanitizeRequestLog: {
        body: {
          password: true,
          username: true
        }
      },
      sanitizeResponseLog: {
        body: {
          payload: {
            userDeviceId: true,
            userLoginId: true
          },
          tokenContainer: {
            accessToken: true
          },
          widgetTokenContainer: {
            widgetToken: true
          }
        }
      },
      isUnhandled: () => false
    })
    if (response.status === 400) {
      if (_.get(response.body, 'code') !== 'MAS-0007') {
        raiseUnhandledResponse(response)
      }

      return {
        needSecondFactor: true,
        payload: {
          userDeviceId: _.get(response.body, 'payload.userDeviceId'),
          userLoginId: _.get(response.body, 'payload.userLoginId')
        }
      }
    } else if (response.status === 200) {
      return {
        needSecondFactor: false,
        tokens: {
          accessToken: _.get(response.body, 'tokenContainer.accessToken'),
          widgetToken: _.get(response.body, 'widgetTokenContainer.widgetToken')
        }
      }
    } else {
      raiseUnhandledResponse(response)
    }
  }

  private async fetchSalt (): Promise<string> {
    const response = await this.fetchApi('authentication-management/free-zone/auth/salt', {
      method: 'POST',
      body: this.getUserDevice(),
      parse: (salt: string) => salt,
      sanitizeResponseLog: {
        body: true
      }
    })
    return response.body as string
  }

  private async fetchApi (url: string, {
    isUnhandled = (response) => response.status !== 200, ...options
  }: FetchOptions & {
    isUnhandled?: (res: FetchResponse) => boolean
  }): Promise<FetchResponse> {
    const response = await fetch(BASE_URL + url, {
      method: options.method,
      headers: {
        ...this.commonHeaders(),
        ...(options?.headers as object ?? {})
      },
      body: options.body,
      sanitizeRequestLog: _.defaultsDeep({}, options.sanitizeRequestLog ?? {
        headers: {
          Authorization: true
        }
      }),
      sanitizeResponseLog: _.defaultsDeep({}, options.sanitizeResponseLog ?? {
        headers: {
          'set-cookie': true
        }
      }),
      parse: options.parse ?? JSON.parse,
      stringify: options.stringify ?? JSON.stringify
    })

    if (isUnhandled(response)) {
      raiseUnhandledResponse(response)
    }

    return response
  }

  private getUserDevice (): object {
    return {
      appVersion: APP_VERSION,
      deviceDescription: `${this.device.manufacturer} ${this.device.model}`,
      deviceGuid: this.device.androidId,
      deviceIP: this.device.ip,
      deviceOs: 'Android GMS',
      deviceOsVersion: this.device.osVersion
    }
  }

  private commonHeaders (): Record<string, string> {
    return {
      'Accept-Language': 'ru-RU',
      userSession: '',
      Authorization: `Bearer ${(this._session != null) ? this.session.accessToken : ''}`,
      'Device-Guid': this.device.androidId,
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept-Encoding': 'gzip',
      'User-Agent': 'okhttp/4.12.0'
    }
  }
}
