import { flatten } from 'lodash'
import qs from 'querystring'
import { InvalidPreferencesError, TemporaryError } from '../../errors'
import { toISODateString } from '../../common/dateUtils'
import { fetchJson, ParseError } from '../../common/network'
import { generateRandomString } from '../../common/utils'

function summarizeResponse (response) {
  return response
    ? {
        status: response.status,
        url: response.url,
        contentType: response.headers?.['content-type'],
        flow: response.body?.flow,
        state: response.body?.state,
        errCode: response.body?.error?.errCode,
        errDesc: response.body?.error?.errDesc
      }
    : null
}

function throwTemporary (message, response) {
  console.warn(message, summarizeResponse(response))
  const error = new TemporaryError(message)
  error.responseSummary = summarizeResponse(response)
  throw error
}

function ensure (condition, message, response) {
  if (!condition) {
    throwTemporary(message, response)
  }
}

async function safeFetch (label, fn) {
  try {
    return await fn()
  } catch (error) {
    console.warn(`optional account endpoint failed: ${label}`, error?.responseSummary || error?.response || error?.message || error)
    return []
  }
}

export function generateDevice () {
  return {
    id: 'PSR1.180720.061',
    androidId: generateRandomString(16, '0123456789abcdef')
  }
}

export function isLikelyAuthGateError (error) {
  const response = error?.responseSummary || error?.response
  const contentType = String(response?.contentType || response?.headers?.['content-type'] || '')

  return error instanceof ParseError ||
    response?.status === 401 ||
    response?.status === 403 ||
    /text\/html/i.test(contentType)
}

async function fetchApi (url, options) {
  const params = {
    appId: 'bankApp3Generation',
    ...options?.accountId && { accountId: options.accountId }
  }
  const fullUrl = url + ((url.indexOf('?') === -1) ? '?' : '&') + qs.stringify(params)

  return fetchJson('https://iphone.bankhapoalim.co.il' + fullUrl, {
    method: 'GET',
    ...options,
    sanitizeResponseLog: {
      headers: {
        'set-cookie': true
      }
    },
    headers: {
      mobile: 'ca',
      'x-dynatrace': 'MT_3_1_1842511945_1_BankApp-Android-Gen3_0_1001_130',
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'User-Agent': 'okhttp/3.12.1',
      ...options && options.headers
    }
  })
}

export async function login ({ login, password }, device) {
  const response = await fetchApi('/authenticate/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: {
      organization: '106402333',
      identifier: login,
      credentials: password,
      authType: '0',
      flow: 'authenticate',
      state: 'logon',
      mfp: JSON.stringify({
        deviceSignature: {
          collector: 'Android',
          collectorVersion: '8.1.2',
          system: {
            platform: 'Android28',
            androidId: device.androidId,
            osVersion: '9',
            deviceName: 'generic_x86_64',
            model: ZenMoney.device.model,
            board: 'goldfish_x86_64',
            brand: 'google',
            host: 'abfarm719',
            id: device.id,
            type: 'userdebug',
            user: 'android-build',
            cpuAbi: 'x86_64',
            cpuAbi2: null,
            hardware: 'ranchu',
            manufacturer: ZenMoney.device.manufacturer,
            serial: 'unknown',
            tags: 'dev-keys',
            locale: 'English (United States)',
            radio: '1.0.0.0',
            processName: 'בנק הפועלים',
            systemName: 'AndroidOS',
            jailBroken: false,
            timeZone: 'Europe/Moscow',
            debuggerAttached: true,
            totalDiskSpace: '1937',
            totalMemory: 1494,
            numberOfProcessors: 4
          },
          screen: { displayId: `sdk_gphone_x86_64-userdebug 9${device.id} 5075414 dev-keys`, width: '768', height: '1184', orientation: '1' },
          browser: { userAgent: `Dalvik 2.1.0 (Linux; U; Android 9; ${ZenMoney.device.model} Build ${device.id})` },
          wifi: {
            connected: true,
            macAddress: '02:00:00:00:00:00',
            ipAddress: '192.168.232.2',
            netmaskAddress: '0.0.0.0',
            gatewayAddress: '192.168.232.1',
            broadcastAddress: '255.255.255.255',
            userEnabled: true
          },
          telephony: {
            imeiNumber: null,
            carrierIsoCountryCode: 'us',
            carrierName: 'Android',
            carrierMobileCountryCode: null,
            simOperatorName: 'T-Mobile',
            carrierMobileNetworkCode: '260',
            networkType: 'GPRS',
            phoneType: 'GSM',
            simIsoCountryCode: 'us',
            isRoamingNetwork: false,
            cellIpAddress: null,
            simSerialNumber: null,
            subscriberId: null
          },
          camera: {
            numberOfCameras: null,
            rearCamera: null,
            frontCamera: '__SDK_DISABLED__',
            autoFocus: null,
            flash: null,
            rearCameraSupportedSizes: null,
            rearCameraSupportedFormats: null,
            frontCameraSupportedSizes: '__SDK_DISABLED__',
            frontCameraSupportedFormats: '__SDK_DISABLED__'
          },
          bluetooth: { macAddress: null, supported: null },
          extra: { account: null, securityPolicy: true },
          location: { latitude: null, longitude: null }
        },
        ipAddress: '192.168.232.2'
      }),
      deviceId: '10010110210310410510610710810910a10b10c10d10e10f'
    },
    stringify: qs.stringify,
    sanitizeRequestLog: { body: { identifier: true, credentials: true } }
  })

  if (response.body.error?.errCode === '1.6' && response.body.error?.errDesc === 'Login Failure') {
    throw new InvalidPreferencesError()
  }

  if (!response.body.error &&
    response.body.flow === 'AUTHENTICATE' &&
    response.body.state === 'LANDPAGE') {
    return { state: 'LANDPAGE' }
  }

  if (!response.body.error &&
    response.body.flow === 'AUTHENTICATE' &&
    response.body.state === 'LOGONOTP') {
    console.warn('login returned LOGONOTP', summarizeResponse(response))
    return { state: 'LOGONOTP' }
  }

  throwTemporary('unexpected login response', response)
}

async function fetchMainAccountDetails (mainAccount, accountId) {
  const response = await fetchApi('/ServerServices/general/accounts/selectedAccount/totalBalances', { accountId })
  mainAccount.details = response.body
  mainAccount.structType = 'checking'
  return [mainAccount]
}

async function fetchForeignCurrencyAccount (accountId) {
  const response = await fetchApi('/ServerServices/foreign-currency/transactions?type=business', { accountId })
  const account = response.body
  if (!account) {
    return []
  }
  account.mainProductId = accountId
  account.structType = 'foreignCurrencyAccount'
  return [account]
}

async function fetchDeposits (url, structType, accountId) {
  const response = await fetchApi(url, { accountId })
  return (response.body?.list || []).map(account => {
    const result = account.data?.[0]
    if (!result) {
      return null
    }
    result.structType = structType
    return result
  }).filter(Boolean)
}

async function fetchLoans (accountId) {
  const response = await fetchApi('/ServerServices/credit-and-mortgage/v3/loans', { accountId })
  return await Promise.all((response.body?.data || []).map(async account => {
    const query = qs.stringify({ unitedCreditTypeCode: account.unitedCreditTypeCode })
    const detailsResponse = await fetchApi(`/ServerServices/credit-and-mortgage/v3/loans/${account.creditSerialNumber}?${query}`, { accountId })

    account.details = detailsResponse.body
    account.structType = 'loan'
    return account
  }))
}

async function fetchMortgages (accountId) {
  const response = await fetchApi('/ServerServices/credit-and-mortgage/mortgages', { accountId })
  return (response.body?.data || []).map(account => {
    account.structType = 'mortgage'
    return account
  })
}

export async function fetchAccounts () {
  const response = await fetchApi('/ServerServices/general/accounts?lang=he')
  ensure(Array.isArray(response.body), 'unexpected accounts response', response)

  const accounts = []
  await Promise.all(response.body.map(async mainAccount => {
    ensure(mainAccount.accountNumber && mainAccount.branchNumber && mainAccount.bankNumber, 'unexpected account', { body: mainAccount })
    const accountId = `${mainAccount.bankNumber}-${mainAccount.branchNumber}-${mainAccount.accountNumber}`
    accounts.push(...flatten(await Promise.all([
      async () => await fetchMainAccountDetails(mainAccount, accountId),
      async () => await safeFetch('foreign currency', async () => fetchForeignCurrencyAccount(accountId)),
      async () => await safeFetch('deposits', async () => fetchDeposits('/ServerServices/deposits-and-savings/deposits?view=details&lang=he', 'deposit', accountId)),
      async () => await safeFetch('savings', async () => fetchDeposits('/ServerServices/deposits-and-savings/savingsDeposits?view=details&lang=he', 'saving', accountId)),
      async () => await safeFetch('loans', async () => fetchLoans(accountId)),
      async () => await safeFetch('mortgages', async () => fetchMortgages(accountId))
    ].map(fn => fn()))))
  }))
  return accounts
}

export async function fetchTransactions (product, fromDate, toDate) {
  const fromDateStr = toISODateString(fromDate).replace(/-/g, '')
  const toDateStr = toISODateString(toDate).replace(/-/g, '')

  if (product.type === 'foreignCurrencyAccount') {
    const response = await fetchApi('/ServerServices/foreign-currency/transactions?type=business&view=details&' +
      `retrievalStartDate=${fromDateStr}&` +
      `retrievalEndDate=${toDateStr}&` +
      `currencyCodeList=${product.currencyCode}&` +
      `detailedAccountTypeCodeList=${product.detailedAccountTypeCode}`, { accountId: product.id })
    return response.body.balancesAndLimitsDataList?.transactions || []
  }

  const transactions = []
  const limit = 50
  const query = qs.stringify({
    numItemsPerPage: limit,
    sortCode: '1',
    retrievalStartDate: fromDateStr,
    retrievalEndDate: toDateStr,
    dataGroupCatenatedKey: ''
  })

  let response = await fetchApi(`/ServerServices/current-account/transactions?${query}`, {
    accountId: product.id
  })
  while (true) {
    const batch = response.body?.transactions || (response.status === 204 ? [] : null)
    ensure(Array.isArray(batch), 'unexpected transactions response', response)
    transactions.push(...batch)

    const dataHeader = response.headers['data-header']
    if (batch.length < limit || !dataHeader) {
      break
    }
    const integrityHeader = response.headers['integrity-header']
    ensure(dataHeader && integrityHeader, 'unexpected transactions continuation response', response)
    response = await fetchApi(`/ServerServices/current-account/transactions/${dataHeader}?${query}`, {
      accountId: product.id,
      headers: {
        add_integrity_header: 'true',
        'integrity-header': integrityHeader
      }
    })
  }

  return transactions
}
