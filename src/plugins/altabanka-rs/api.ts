import { fetch, FetchResponse } from '../../common/network'
import { InvalidPreferencesError } from '../../errors'
import { parseAccounts, parseTransactions } from './parsers'
import { AccountInfo, AccountTransaction } from './types'
import moment from 'moment'

const BASE_URL = 'https://online.altabanka.rs/Retail/'

export class AltaBankaApi {
  private requestToken: string = ''

  private headers (): Record<string, string> {
    return {
      'content-type': 'application/json',
      'x-requested-with': 'XMLHttpRequest',
      'x-holos-session': '1',
      'x-holos-requesttoken': this.requestToken
    }
  }

  public async login (login: string): Promise<void> {
    const otp = await ZenMoney.readLine(
      'Введите OTP-код из мобильного приложения Alta Banka',
      { inputType: 'number', time: 120000 }
    )

    if (otp === null) {
      throw new InvalidPreferencesError('Время ввода OTP истекло')
    }

    const loginPage = await fetch(BASE_URL + 'Home/Login', {
      method: 'GET'
    }) as FetchResponse & { headers: Record<string, string> }

    const cookies = loginPage.headers['set-cookie'] ?? ''
    const match = cookies.match(/altaretv4_HolosToken=([^;]+)/)
    this.requestToken = match?.[1] ?? ''

    const response = await fetch(
      BASE_URL + 'Protected/Services/RetailLoginService.svc/LoginUO',
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          username: login,
          otp,
          appType: 'AUTH_1',
          sessionID: 1
        }),
        sanitizeRequestLog: true
      }
    ) as FetchResponse & { body: string }

    const result = JSON.parse(response.body)

    if (result.ErrorCode != null) {
      throw new InvalidPreferencesError('Неверный логин или OTP-код')
    }

    this.requestToken = result.RequestToken

    // Сохраняем сессию чтобы не просить OTP при следующей синхронизации
    await ZenMoney.saveCookies()
    ZenMoney.setData('requestToken', this.requestToken)
    ZenMoney.saveData()
  }

  public async restoreSession (): Promise<boolean> {
    const savedToken = ZenMoney.getData('requestToken') as string | undefined
    if (savedToken == null || savedToken === '') {
      return false
    }
    this.requestToken = savedToken
    await ZenMoney.restoreCookies()
    return true
  }

  public async fetchAccounts (): Promise<AccountInfo[]> {
    const response = await fetch(
      BASE_URL + 'Protected/Services/DataService.svc/GetAllAccountBalance',
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ gridName: 'AccountBalancePreview' })
      }
    ) as FetchResponse & { body: string }

    return parseAccounts(JSON.parse(response.body))
  }

  public async fetchTransactions (
    account: AccountInfo,
    fromDate: Date,
    toDate: Date
  ): Promise<AccountTransaction[]> {
    const response = await fetch(
      BASE_URL + 'Protected/Services/DataService.svc/GetTransactionalAccountTurnover',
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          accountNumber: account.accountNumber,
          productCoreID: account.productCoreID,
          filterParam: {
            Currency: account.currency,
            DateFrom: moment(fromDate).format('DD.MM.YYYY'),
            DateTo: moment(toDate).format('DD.MM.YYYY'),
            Direction: '',
            AmountLow: '',
            AmountHigh: ''
          },
          gridName: 'RetailAccountTurnoverTransactionPreviewMasterDetail'
        })
      }
    ) as FetchResponse & { body: string }

    return parseTransactions(JSON.parse(response.body))
  }
}

export const altaBankaApi = new AltaBankaApi()
