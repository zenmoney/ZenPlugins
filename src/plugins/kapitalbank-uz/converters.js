import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import moment from 'moment'

/**
 * Конвертер счета из формата банка в формат Дзенмани
 *
 * @param account счет в формате банка
 * @returns счет в формате Дзенмани
 */
export function convertAccount (account) {
  return {
    id: String(account.guid),
    title: 'Счёт ' + account.currency.name + ' *' + account.guid.slice(-4),
    syncIds: [account.accountNumber],
    instrument: account.currency.name,
    type: 'checking',
    balance: account.balance / Math.pow(10, account.currency.scale)
  }
}

/**
 * Конвертер карты из формата банка в формат Дзенмани
 *
 * @param rawCard карта в формате банка
 * @returns карта в формате Дзенмани
 */
export function convertCard (rawCard) {
  const card = {
    id: String(rawCard.guid),
    title: rawCard.cardName,
    syncIds: [rawCard.maskedPan],
    instrument: rawCard.currency.name,
    type: 'ccard'
  }

  if (!rawCard.cardName) {
    card.title = rawCard.processingType + ' *' + rawCard.maskedPan.slice(-4)
  }

  return card
}

/**
 * Конвертер вклада из формата банка в формат Дзенмани
 *
 * @param deposit вклад в формате банка
 * @returns вклад в формате Дзенмани
 */
export function convertDeposit (deposit) {
  try {
    const closeDate = new Date(deposit.closeDate.replace('+', ''))
    const openDate = moment(closeDate).subtract(deposit.period, 'months').toDate()
    const endDateInterval = getIntervalBetweenDates(openDate, closeDate)
    return {
      id: deposit.guid,
      type: 'deposit',
      title: 'Депозит ' + deposit.depositProductName,
      syncIds: [deposit.guid],
      instrument: deposit.currency.name,
      balance: deposit.balance / Math.pow(10, deposit.currency.scale),
      percent: Number(deposit.interestRate),

      startDate: openDate,
      endDateOffsetInterval: endDateInterval.interval,
      endDateOffset: endDateInterval.count,

      payoffStep: 0,
      payoffInterval: null,
      capitalization: false
    }
  } catch (error) {
    console.error(error)
  }
}

/**
 * Конвертер транзакции по счету из формата банка в формат Дзенмани
 *
 * @param accountId идентификатор счета
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertCardOrAccountTransaction (account, rawTransaction) {
  const sign = rawTransaction.transactionType === 'DEBIT' ? -1 : 1
  const invoice = {
    sum: sign * rawTransaction.amount / Math.pow(10, rawTransaction.currency.scale),
    instrument: rawTransaction.currency.name
  }

  let comment = ''
  switch (rawTransaction.module) {
    case 'CONVERSION':
      comment = 'Обмен валюты'
      break
    case 'P2P':
      comment = rawTransaction.transactionType === 'DEBIT' ? 'Исходящий перевод' : 'Входящий перевод'
      break
    case 'DEPOSITS_TRANSACTION':
      comment = 'Пополнение вклада ' + rawTransaction.name
      break
    case 'ACCOUNTS':
      comment = rawTransaction.group.type === 'DEPOSITS' && rawTransaction.transactionType === 'CREDIT' ? 'Выплата процентов по вкладу' : null
      break
  }

  const transaction = {
    hold: false, // авторизация средств или подтвержденная транзакция
    date: new Date(rawTransaction.transactionDate.replace('+', '')),
    merchant: (rawTransaction.module === 'PROCESSING' || rawTransaction.module === 'P2P') && rawTransaction.transactionType === 'DEBIT'
      ? { fullTitle: rawTransaction.name, mcc: null, location: null }
      : null,
    movements: [
      {
        id: rawTransaction.transactionGuid,
        account: { id: account.id },
        invoice: null,
        sum: invoice.sum,
        fee: 0
      }
    ],
    comment
  }

  return transaction
}

/**
 * Конвертер транзакции по вкладу из формата банка в формат Дзенмани
 *
 * @param accountId идентификатор вкладу
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertDepositTransaction (deposit, rawTransaction) {
  if (rawTransaction.activity.type === 'INTEREST') {
    return null // не возвращаем транзакции по выплате процентов, т.к. они будут учтены как пополнения карт или счетов
  }

  let sign = 1
  let comment = ''

  if (rawTransaction.activity.type === 'PARTIAL_REPLENISHMENT') {
    sign = 1
    comment = rawTransaction.activity.description // пополнение вклада
  }

  if (rawTransaction.activity.type === '????') {
    sign = -1
    comment = rawTransaction.activity.description // выплата процентов по вкладу
  }

  const invoice = {
    sum: sign * rawTransaction.amount / Math.pow(10, rawTransaction.currency.scale),
    instrument: rawTransaction.currency.name
  }

  const stringToHash = `${rawTransaction.paymentDate}_${rawTransaction.amount}`
  const hash = hashString(stringToHash)

  const transaction = {
    date: new Date(rawTransaction.paymentDate.replace('+', '')),
    hold: false,
    merchant: null,
    movements: [
      {
        id: String(hash), // TODO сейчас нет айди в исторической записи, вероятно надо отдельный апи дергать
        account: { id: deposit.id },
        invoice: null,
        sum: invoice.sum,
        fee: 0
      }
    ],
    comment
  }

  return transaction
}

function hashString (str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Преобразование в 32-битное целое число
  }
  return hash >>> 0 // Положительное 32-битное целое
}
