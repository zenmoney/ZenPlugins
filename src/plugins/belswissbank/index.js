import _ from 'lodash'
import { generateUUID } from '../../common/utils'
import {
  assertResponseSuccess,
  authorize,
  confirm,
  currencyCodeToIsoCurrency,
  extractPaymentsArchive,
  fetchCards,
  fetchPaymentsArchive,
  fetchTransactions
} from './BSB'
import { convertApiTransactionsToReadableTransactions } from './converters'

async function login ({ deviceId, username, password }) {
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

function convertToZenMoneyAccount (card) {
  return {
    id: calculateAccountId(card),
    title: card.name,
    type: 'ccard',
    syncID: [card.maskedCardNumber.slice(-4)],
    instrument: currencyCodeToIsoCurrency(card.currency),
    balance: card.amount
  }
}

const sessionTimeoutMs = 15 * 60 * 1000

export async function scrape ({ preferences: { username, password }, fromDate, toDate }) {
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
  let probe = pluginData.scrapeLastSuccessDate.valueOf() + sessionTimeoutMs > Date.now()
    ? await Promise.all([
      fetchCards(),
      fetchPaymentsArchive({ fromDate, toDate })
    ])
    : null
  if (probe === null || probe.some((x) => x.status === 401)) {
    await login({ deviceId: pluginData.deviceId, username, password })
    probe = await Promise.all([
      fetchCards(),
      fetchPaymentsArchive({ fromDate, toDate })
    ])
  }
  const [cardsResponse, paymentsResponse] = probe
  assertResponseSuccess(cardsResponse)
  const paymentsArchive = extractPaymentsArchive(paymentsResponse)
  const accounts = cardsResponse.body
    .filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)))
    .map((card) => convertToZenMoneyAccount(card))
  const apiTransactionsByAccount = _.flatten(await Promise.all(accounts.map(async (account) => ({
    account,
    apiTransactions: await fetchTransactions(account.id, fromDate, toDate)
  }))))
  const readableTransactions = convertApiTransactionsToReadableTransactions(apiTransactionsByAccount, paymentsArchive)
  return {
    accounts,
    transactions: readableTransactions
  }
}
