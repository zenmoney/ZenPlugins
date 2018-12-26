/* eslint-disable no-unused-vars,no-debugger */
import _ from 'lodash'
import { generateUUID } from '../../common/utils'
import * as BSB from './BSB'
import { floorToMinutes, formatDetails } from './converters'
import { convertToZenMoneyTransaction } from './mappingUtils'
import { getTransactionToTransferReplacements } from './mergeTransfers'

async function login ({ deviceId, username, password }) {
  const authStatus = await BSB.authorize(username, password, deviceId)
  switch (authStatus.userStatus) {
    case 'WAITING_CONFIRMATION':
    case 'SMS_WAS_SENT':
      const prompt = 'Для доступа к банку Вам надо ввести код, который был выслан на ваш телефон СМС сообщением.'
      const retrievedInput = await ZenMoney.readLine(prompt, { inputType: 'numberDecimal' })
      const confirmationCode = Number(retrievedInput)
      if (isNaN(retrievedInput)) {
        throw new TemporaryError(`Ожидался числовой код из СМС, а вы ввели ${JSON.stringify(retrievedInput)}`)
      }
      await BSB.confirm(deviceId, confirmationCode)
      break
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
    instrument: BSB.currencyCodeToIsoCurrency(card.currency),
    balance: card.amount
  }
}

function normalizeBsbTransactions ({ accountCurrency, bsbTransactions, paymentsGroupedByTransactionDate }) {
  return _.sortBy(
    bsbTransactions.filter((transaction) => !BSB.isRejectedTransaction(transaction) && transaction.transactionAmount > 0),
    (x) => x.cardTransactionId
  )
    .map((transaction, index, transactions) => {
      const transactionAmount = BSB.getTransactionFactor(transaction) * transaction.transactionAmount
      const accountAmount = transaction.transactionCurrency === accountCurrency
        ? transactionAmount
        : BSB.figureOutAccountRestsDelta({ transactions, index, accountCurrency })
      if (accountAmount === null) {
        console.error('accountAmount is unknown, ignored transaction', { transaction })
        return null
      }
      const relevantPayments = paymentsGroupedByTransactionDate[transaction.transactionDate] || []
      const matchedPayment = relevantPayments.find((payment) =>
        (transaction.last4.startsWith(payment.last4) || payment.target.slice(0, 4) === transaction.last4.slice(0, 4)) &&
        payment.currencyIso === transaction.transactionCurrency &&
        transaction.transactionAmount === payment.amount
      )
      const { payee, comment } = formatDetails({ transaction, matchedPayment })
      return {
        transactionId: transaction.cardTransactionId,
        transactionDate: new Date(transaction.transactionDate),
        transactionCurrency: transaction.transactionCurrency,
        transactionAmount,
        accountCurrency,
        accountAmount,
        payee,
        comment,
        isCashTransfer: BSB.isCashTransferTransaction(transaction),
        isElectronicTransfer: BSB.isElectronicTransferTransaction(transaction)
      }
    })
    .filter(Boolean)
}

export async function scrape ({ preferences: { username, password }, fromDate, toDate }) {
  const pluginData = {
    deviceId: ZenMoney.getData('deviceId'),
    sessionId: ZenMoney.getData('sessionId')
  }
  if (!pluginData.deviceId) {
    pluginData.deviceId = generateUUID()
    ZenMoney.setData('deviceId', pluginData.deviceId)
    ZenMoney.saveData()
  }
  if (pluginData.sessionId) {
    ZenMoney.setCookie('24.bsb.by', 'JSESSIONID', pluginData.sessionId)
  }
  let probe = await Promise.all([
    BSB.fetchCards(),
    BSB.fetchPaymentsArchive({ fromDate, toDate })
  ])
  if (probe.some((x) => x.status === 401)) {
    await login({ deviceId: pluginData.deviceId, username, password })
    probe = await Promise.all([
      BSB.fetchCards(),
      BSB.fetchPaymentsArchive({ fromDate, toDate })
    ])
  }
  const [cardsResponse, paymentsResponse] = probe
  BSB.assertResponseSuccess(cardsResponse)
  const payments = BSB.extractPaymentsArchive(paymentsResponse)
  const accounts = cardsResponse.body
    .filter((card) => !ZenMoney.isAccountSkipped(calculateAccountId(card)))
    .map((card) => convertToZenMoneyAccount(card))
  const transactionPairs = _.flatten(await Promise.all(accounts.map(async (account) => {
    const bsbTransactions = await BSB.fetchTransactions(account.id, fromDate, toDate)
    const bankTransactions = normalizeBsbTransactions({
      accountCurrency: account.instrument,
      bsbTransactions,
      paymentsGroupedByTransactionDate: _.groupBy(payments, (payment) => floorToMinutes(payment.paymentDate))
    })
    const zenTransactions = bankTransactions.map((x) => convertToZenMoneyTransaction(account.id, x))
    return _.zip(bankTransactions, zenTransactions)
  })))
  const transactionToTransferReplacements = getTransactionToTransferReplacements(transactionPairs)
  return {
    accounts,
    transactions: _.compact(transactionPairs.map(([bankTransaction, zenTransaction]) => {
      const replacement = transactionToTransferReplacements[zenTransaction.id]
      return _.isUndefined(replacement) ? zenTransaction : replacement
    }))
  }
}
