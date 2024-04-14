import { FetchResponse, fetch } from '../../common/network'
import { toAtLeastTwoDigitsString } from '../../common/stringUtils'
import { InvalidLoginOrPasswordError } from '../../errors'
import { AccountDetails, Preferences } from './models'

const baseUrl = 'https://hb.posted.co.rs/posted/en/'

async function fetchUrl (url: string, options: Record<string, unknown>): Promise<FetchResponse> {
  const response = await fetch(baseUrl + url, {
    ...options,
    ...{
      sanitizeResponseLog: { headers: { 'set-cookie': true } },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }
    }
  }) as FetchResponse & { headers: Record<string, string> }

  return response
}

export async function fetchAuthorization ({ login, password }: Preferences): Promise<void> {
  if ('trustCertificates' in ZenMoney) {
    // Expires: Wednesday, 22 January 2025
    ZenMoney.trustCertificates(['-----BEGIN CERTIFICATE-----\n' +
  'MIIG8DCCBdigAwIBAgIQCZEMca4TANvyAKqemQblITANBgkqhkiG9w0BAQsFADBZ\n' +
'MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMTMwMQYDVQQDEypE\n' +
'aWdpQ2VydCBHbG9iYWwgRzIgVExTIFJTQSBTSEEyNTYgMjAyMCBDQTEwHhcNMjMx\n' +
'MjIyMDAwMDAwWhcNMjUwMTIxMjM1OTU5WjCBgDELMAkGA1UEBhMCUlMxETAPBgNV\n' +
'BAcTCEJlbGdyYWRlMUQwQgYDVQQKDDtCYW5rYSBQb8WhdGFuc2thIMWhdGVkaW9u\n' +
'aWNhLCBha2Npb25hcnNrbyBkcnXFoXR2bywgQmVvZ3JhZDEYMBYGA1UEAxMPaGIu\n' +
'cG9zdGVkLmNvLnJzMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6nJ9\n' +
'MIRcIOEfriQthK8pJqLwGlv/ccMxENou+6/TKk5M2zM5Cit8d9Xdf3p1iVZc6IF+\n' +
'uBPuN15ZuEJQI6iDqHZlQ3P/DinkH8ChLaOFu9su94jyO/t8W42IZQetwygGXUDl\n' +
'8xtbCl9adlvnmsOiWX8X4MMV+Rho69SI3Ifj2MbqDETtgVuLzK7uuuediYMxru4h\n' +
'wCxEI/BNi7BC0mQPOGivjnSg1Irr4k4PV6wg2BglXc8uW6mqktsxmK8NgcGGnh0Y\n' +
'/P3uqRz2uerp/6o1XWUaqEyf4Cq3bpgLaencEfF7Ihvgkn02r7An/MBmsY+ZiqWR\n' +
'YyPzs6079qhm18SX/wIDAQABo4IDijCCA4YwHwYDVR0jBBgwFoAUdIWAwGbH3zfe\n' +
'z70pN6oDHb7tzRcwHQYDVR0OBBYEFIibQyvLDwZrUjt3VpYcv2pX+b0MMBoGA1Ud\n' +
'EQQTMBGCD2hiLnBvc3RlZC5jby5yczA+BgNVHSAENzA1MDMGBmeBDAECAjApMCcG\n' +
'CCsGAQUFBwIBFhtodHRwOi8vd3d3LmRpZ2ljZXJ0LmNvbS9DUFMwDgYDVR0PAQH/\n' +
'BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMBBggrBgEFBQcDAjCBnwYDVR0fBIGX\n' +
'MIGUMEigRqBEhkJodHRwOi8vY3JsMy5kaWdpY2VydC5jb20vRGlnaUNlcnRHbG9i\n' +
'YWxHMlRMU1JTQVNIQTI1NjIwMjBDQTEtMS5jcmwwSKBGoESGQmh0dHA6Ly9jcmw0\n' +
'LmRpZ2ljZXJ0LmNvbS9EaWdpQ2VydEdsb2JhbEcyVExTUlNBU0hBMjU2MjAyMENB\n' +
'MS0xLmNybDCBhwYIKwYBBQUHAQEEezB5MCQGCCsGAQUFBzABhhhodHRwOi8vb2Nz\n' +
'cC5kaWdpY2VydC5jb20wUQYIKwYBBQUHMAKGRWh0dHA6Ly9jYWNlcnRzLmRpZ2lj\n' +
'ZXJ0LmNvbS9EaWdpQ2VydEdsb2JhbEcyVExTUlNBU0hBMjU2MjAyMENBMS0xLmNy\n' +
'dDAMBgNVHRMBAf8EAjAAMIIBfQYKKwYBBAHWeQIEAgSCAW0EggFpAWcAdQBOdaMn\n' +
'XJoQwzhbbNTfP1LrHfDgjhuNacCx+mSxYpo53wAAAYyRzfryAAAEAwBGMEQCIGza\n' +
'Os35Je90dCHyLaEqrhY7cFBRl5MNG4yxKW5Y++7/AiBbPeN9/SeX4YiOkdKacKZy\n' +
'zu2T+5gfUBUkVdMb5TempgB2AH1ZHhLheCp7HGFnfF79+NCHXBSgTpWeuQMv2Q6M\n' +
'Lnm4AAABjJHN+xoAAAQDAEcwRQIgEVkfWOq8K3y6Y1yj4QgDsC74ZfrBgIaSGdPy\n' +
'ItSS6e8CIQDq6BBLlAXL8SIE1C6e9UGDvrTlPrqw2rw4KJOBisvhHwB2AObSMWNA\n' +
'd4zBEEEG13G5zsHSQPaWhIb7uocyHf0eN45QAAABjJHN+z4AAAQDAEcwRQIgds6p\n' +
'ATMLxRqMdaeA3v0fZGlKDLA8+p/OarKSXuYJVngCIQD9nejKrh8cZJ3pTIIKvo4g\n' +
'p927IpIUtytCMPj0LqNwlDANBgkqhkiG9w0BAQsFAAOCAQEAEKcAQE/BKG0FO9rI\n' +
'EzKhzPXmLJOGJOqUYyVpufedaFZUja5vzjQnRARaJVUtVfPvYWnpwKHwIZXimDwD\n' +
'sA1LAKDNbvUM2p+faEXRD1zuNbvlq9ONWj9T0uSxSqlMtc+tA94YTb+fk//h28xs\n' +
'+MewZb66NSxH6NslE/XhpiTDuV8k0zOsFmZhC6xmNhB2A3KodX6kFfq6xOqD7pE3\n' +
'Ty7wje3T76s1u6ZPzNh6un6QY1XMNEAe8xqdJS8dI6aYKINAXESG879nP6yy7xVi\n' +
'yiLED9/J8asAg527yi6ANxNZ15CtTXktzxwJ5XE4GyKVZ1Fx8+kl80Nu5SyZ5gD4\n' +
'tGKeqA==\n' +
  '-----END CERTIFICATE-----'
    ])
  }

  const response = await fetchUrl('index.jsp', {
    method: 'POST',
    body: `korisnik=${login}&lozinka=${password}`
  }) as FetchResponse & { headers: Record<string, string> }

  if ((response.body as string).includes('<div class=error>')) {
    throw new InvalidLoginOrPasswordError()
  }
}

export async function fetchAllAccounts (): Promise<AccountDetails[]> {
  const response = await fetchUrl('fracld.jsp?NF=1356', {
    method: 'POST'
  })

  const string = response.body as string
  const regexp = /(\d\d\d\d\d)\s+(\d\d\d\d\d\d\d\d\d)(\d)/g

  const matches = string.matchAll(regexp)

  const accounts: AccountDetails[] = []
  for (const match of matches) {
    const [, , accountId, accountType] = match
    accounts.push({
      id: Number(accountId),
      type: Number(accountType)
    })
  }

  return accounts
}

export async function fetchAccountData (account: AccountDetails): Promise<string> {
  const response = await fetchUrl('racsta.jsp', {
    method: 'POST',
    body: `RACUNPSTIP=${account.type}&racun=${account.id}`
  })

  return response.body as string
}

export async function fetchCardTransactions (cardNumber: string, fromDate: Date, toDate: Date): Promise<string> {
  fromDate = fromDate.getFullYear() >= toDate.getFullYear() ? fromDate : new Date(toDate.getFullYear(), 0, 1)

  const fromDay = toAtLeastTwoDigitsString(fromDate.getDate())
  const fromMonth = toAtLeastTwoDigitsString(fromDate.getMonth() + 1)
  const toDay = toAtLeastTwoDigitsString(toDate.getDate())
  const toMonth = toAtLeastTwoDigitsString(toDate.getMonth() + 1)
  const year = toDate.getFullYear()

  const response = await fetchUrl('karttrn.jsp', {
    method: 'POST',
    body: `KOM=K3&H1=${cardNumber}&IRADIO=I2&oddan=${fromDay}&odmes=${fromMonth}&dodan=${toDay}&domes=${toMonth}&god=${year}`
  })

  return response.body as string
}
