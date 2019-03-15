import { generateUUID } from '../../common/utils'
import {
  assertLoginIsSuccessful,
  fetchAccessToken,
  getAccountsWithAccountDetailsCreditInfo,
  getAllCommonMovements,
  isExpiredRefreshToken,
  isBlockedSession,
  isExpiredSession,
  isExpiredToken,
  isNotFoundToken,
  isNotFoundSession,
  login,
  register
} from './api'
import { convertApiAccountsToAccountTuples, convertApiMovementsToReadableTransactions } from './converters'
import { normalizePreferences } from './preferences'

async function executeRegistration ({ pluginData, preferences }) {
  pluginData.registered = true
  ZenMoney.setData('registered', pluginData.registered)
  const { cardNumber, cardExpirationDate, phoneNumber } = normalizePreferences(preferences)
  const { accessToken, refreshToken } = await register({
    deviceId: pluginData.deviceId,
    cardNumber,
    cardExpirationDate,
    phoneNumber
  })
  pluginData.accessToken = accessToken
  ZenMoney.setData('accessToken', pluginData.accessToken)
  pluginData.refreshToken = refreshToken
  ZenMoney.setData('refreshToken', pluginData.refreshToken)
  ZenMoney.saveData()
}

export async function scrape ({ preferences, fromDate, toDate }) {
  const sessionId = generateUUID()

  const pluginData = {
    deviceId: ZenMoney.getData('deviceId'),
    registered: ZenMoney.getData('registered', false),
    accessToken: ZenMoney.getData('accessToken', null),
    refreshToken: ZenMoney.getData('refreshToken', null)
  }
  if (!pluginData.deviceId) {
    pluginData.deviceId = generateUUID()
    ZenMoney.setData('deviceId', pluginData.deviceId)
  }
  if (!pluginData.registered) {
    await executeRegistration({ pluginData, preferences })
  }

  let loginResponse = await login({ sessionId, deviceId: pluginData.deviceId, accessToken: pluginData.accessToken })
  if (isExpiredToken(loginResponse) || isNotFoundToken(loginResponse)) {
    const response = await fetchAccessToken({ sessionId, deviceId: pluginData.deviceId, refreshToken: pluginData.refreshToken })
    if (response.status === 200) {
      console.assert(response.body.operationId === 'OpenID:TokenResult', 'Unexpected response body.operationId', response)
      const accessToken = response.body.access_token
      const expiresIn = response.body.expires_in
      const refreshToken = response.body.refresh_token
      console.log(`got new accessToken, expires in ${((expiresIn - Date.now()) / 86400000).toFixed(2)} day(s)`)
      pluginData.accessToken = accessToken

      ZenMoney.setData('accessToken', accessToken)
      if (refreshToken !== pluginData.refreshToken) {
        console.log('got new refreshToken')
        pluginData.refreshToken = refreshToken
        ZenMoney.setData('refreshToken', refreshToken)
      }
      ZenMoney.saveData()

      loginResponse = await login({ sessionId, deviceId: pluginData.deviceId, accessToken: pluginData.accessToken })
    } else if (isExpiredSession(response) || isBlockedSession(response) || isNotFoundSession(response) || isExpiredRefreshToken(response)) {
      await executeRegistration({ pluginData, preferences })

      loginResponse = await login({ sessionId, deviceId: pluginData.deviceId, accessToken: pluginData.accessToken })
    } else {
      console.assert(false, 'Unhandled fetchAccessToken response', response)
    }
  } else if (isExpiredSession(loginResponse)) {
    await executeRegistration({ pluginData, preferences })

    loginResponse = await login({ sessionId, deviceId: pluginData.deviceId, accessToken: pluginData.accessToken })
  }
  assertLoginIsSuccessful(loginResponse)

  const [
    apiAccounts,
    apiMovements
  ] = await Promise.all([
    getAccountsWithAccountDetailsCreditInfo({ sessionId, deviceId: pluginData.deviceId }),
    getAllCommonMovements({ sessionId, deviceId: pluginData.deviceId, startDate: fromDate, endDate: toDate })
  ])
  const accountTuples = convertApiAccountsToAccountTuples(apiAccounts)
  const readableTransactions = convertApiMovementsToReadableTransactions(apiMovements.reverse(), accountTuples)
  return {
    accounts: accountTuples.map((x) => x.zenMoneyAccount),
    transactions: readableTransactions
  }
}
