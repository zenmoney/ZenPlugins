import { adjustTransactions } from '../../common/transactionGroupHandler'
import { chooseDistinctCards, convertAccounts, convertTransactions } from './converters'
import { assertResponseSuccess, authLogin, getCardDesc, getCards, getMobileToken, getSalt } from './prior'

async function refreshAuth ({ preferences: { login, password } }) {
  const { authAccessToken, clientSecret } = await getMobileToken()
  const loginSalt = await getSalt({ authAccessToken, clientSecret, login })
  const { accessToken, userSession } = await authLogin({ authAccessToken, clientSecret, loginSalt, login, password })
  return {
    registered: true,
    accessToken,
    clientSecret,
    userSession
  }
}

async function refreshAndPersistAuth ({ preferences }) {
  const pluginData = await refreshAuth({ preferences })
  for (const key of Object.keys(pluginData)) {
    ZenMoney.setData(key, pluginData[key])
  }
  ZenMoney.saveData()
  return pluginData
}

export async function scrape ({ preferences, fromDate, toDate }) {
  preferences.login = preferences.login.trim()
  let pluginData = {
    registered: ZenMoney.getData('registered', false),
    accessToken: ZenMoney.getData('accessToken', null),
    clientSecret: ZenMoney.getData('clientSecret', null),
    userSession: ZenMoney.getData('userSession', null)
  }
  if (!pluginData.registered) {
    pluginData = await refreshAndPersistAuth({ preferences })
  }
  let responses = await Promise.all([
    getCards({ accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession }),
    getCardDesc({ accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession, fromDate, toDate })
  ])
  if (responses.some((response) => response.status === 401 || [
    /^Необходимо авторизоваться$/
  ].some((regexp) => regexp.test(response.body?.errorMessage)))) {
    pluginData = await refreshAndPersistAuth({ preferences })
    responses = await Promise.all([
      getCards({ accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession }),
      getCardDesc({ accessToken: pluginData.accessToken, clientSecret: pluginData.clientSecret, userSession: pluginData.userSession, fromDate, toDate })
    ])
  }
  for (const response of responses) {
    assertResponseSuccess(response)
  }
  const [apiAccounts, apiAccountDetails] = responses.map((x) => x.body.result)
  const accounts = convertAccounts(apiAccounts, apiAccountDetails)
  const apiAccountsWithoutDuplicates = chooseDistinctCards(apiAccounts)
  const transactions = convertTransactions({
    apiAccountsWithoutDuplicates,
    apiAccountDetails,
    accounts
    // includeDateTimeInComment: preferences.includeDateTimeInComment
  })

  return {
    accounts: accounts.map(account => account.account),
    transactions: adjustTransactions({ transactions })
  }
}
