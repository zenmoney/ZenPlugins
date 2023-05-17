import { generateUUID } from '../../common/utils'
import {
  assertResponseSuccess,
  authorize,
  confirm,
  fetchCards,
  fetchArchiveTransactionsResponse,
  fetchSmsTransactions,
  fetchStatementTransactions,
  unpackArchiveTransactions
} from './BSB'
import { convertBSBToZenMoneyTransactions, convertToZenMoneyAccount } from './converters'
import _ from 'lodash'

async function login ({
  deviceId,
  username,
  password
}) {
  const authStatus = await authorize(username, password, deviceId)
  switch (authStatus.userStatus) {
    case 'WAITING_CONFIRMATION':
    case 'SMS_WAS_SENT': {
      const prompt = 'Для доступа к банку Вам надо ввести код, который был выслан на ваш телефон СМС сообщением.'
      const retrievedInput = await ZenMoney.readLine(prompt, { inputType: 'numberDecimal' })
      const confirmationCode = Number(retrievedInput)
      if (isNaN(retrievedInput)) {
        throw new TemporaryError(`Ожидался числовой код из СМС, а вы ввели ${JSON.stringify(retrievedInput)}`)
      }
      await confirm(deviceId, confirmationCode)
      break
    }
    case 'OK':
      break
    default:
      throw new Error(`unhandled auth userStatus "${authStatus.userStatus}"`)
  }
}

const calculateAccountId = (card) => card.cardId.toString()

const sessionTimeoutMs = 15 * 60 * 1000

export async function scrape ({
  preferences: {
    username,
    password
  },
  fromDate,
  toDate
}) {
  const pluginData = {
    deviceId: ZenMoney.getData('deviceId'),
    sessionId: ZenMoney.getData('sessionId'),
    scrapeLastSuccessDate: new Date(ZenMoney.getData('scrape/lastSuccessDate'))
  }
  if (!pluginData.deviceId) {
    pluginData.deviceId = generateUUID()
    ZenMoney.setData('deviceId', pluginData.deviceId)
    ZenMoney.saveData()
  }
  if (pluginData.sessionId) {
    ZenMoney.setCookie('24.bsb.by', 'JSESSIONID', pluginData.sessionId)
  }

  const fetchProbe = () => Promise.all([
    fetchCards(),
    fetchArchiveTransactionsResponse({
      fromDate,
      toDate
    })
  ])

  let probe = pluginData.scrapeLastSuccessDate.valueOf() + sessionTimeoutMs > Date.now()
    ? await fetchProbe()
    : null
  if (probe === null || probe.some((x) => x.status === 401)) {
    await login({
      deviceId: pluginData.deviceId,
      username,
      password
    })
    probe = await fetchProbe()
  }
  const [cardsResponse, archiveResponse] = probe
  assertResponseSuccess(cardsResponse)
  const archiveTxs = unpackArchiveTransactions(archiveResponse)

  const cardsWithoutSkipped = cardsResponse.body.filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)))
  const accountsWithTxs = await Promise.all(Object.entries(_.groupBy(cardsWithoutSkipped, x => x.iban)).map(async ([iban, allCardsForIban]) => {
    const latestCardForAccount = _.orderBy(allCardsForIban, x => x.expiryDate, 'desc')[0]
    const account = convertToZenMoneyAccount(latestCardForAccount)
    const [smsTxs, statementTxs] = await Promise.all([
      Promise.all(allCardsForIban.map(card => fetchSmsTransactions(card.cardId, fromDate, toDate))).then(x => _.flatten(x)),
      fetchStatementTransactions(latestCardForAccount.cardId, fromDate, toDate)
    ])
    return {
      account,
      smsTxs,
      statementTxs
    }
  }))
  const accounts = accountsWithTxs.map(x => x.account)
  const transactions = convertBSBToZenMoneyTransactions(accountsWithTxs, archiveTxs)
  return {
    accounts,
    transactions
  }
}
