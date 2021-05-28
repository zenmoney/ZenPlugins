import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { MD5 } from 'jshashes'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const md5 = new MD5()

export function processAccounts (json) {
  const accounts = []
  let skipAccount = 0
  for (const accountsGroup in json) {
    switch (accountsGroup) {
      case 'cardAccount':
        accounts.push(...json[accountsGroup].map(parseCardAccount))
        break
      case 'depositAccount':
        accounts.push(...json[accountsGroup].map(parseDepositAccount))
        break
      case 'status':
        break
      case 'currentAccount':
        accounts.push(...json[accountsGroup].map(parseCheckingAccount))
        break
      default:
        skipAccount += json[accountsGroup].length
    }
  }

  console.log(`Не обработано ${skipAccount} счетов. Неизвестный тип счёта`)

  return accounts
}

function parseCheckingAccount (account) {
  return {
    id: account.internalAccountId,
    title: `Текущий ${account.personalizedName || account.productName}`,
    syncID: [account.internalAccountId.slice(-4)],

    instrument: codeToCurrencyLookup[account.currency],
    type: 'checking',

    balance: Number.parseFloat(account.balanceAmount),
    rkcCode: account.rkcCode
  }
}

function parseDepositAccount (account) {
  return {
    id: account.internalAccountId,
    title: `Депозит ${account.personalizedName || account.productName}`,
    syncID: [account.internalAccountId.slice(-4)],

    instrument: codeToCurrencyLookup[account.currency],
    type: 'deposit',

    balance: Number.parseFloat(account.balanceAmount),

    capitalization: true,
    percent: account.interestRate,
    startDate: new Date(account.openDate),
    endDateOffset: (new Date(account.endDate).getTime() - new Date(account.openDate).getTime()) / MS_PER_DAY,
    endDateOffsetInterval: 'day',
    payoffStep: 1,
    payoffInterval: 'month',

    accountType: account.accountType,
    currencyCode: account.currency
  }
}

function parseCardAccount (account) {
  const card = (account.cards && account.cards[0]) || {}

  if (!card.cardHash) {
    return null
  }

  return {
    id: account.internalAccountId,
    type: 'card',
    instrument: codeToCurrencyLookup[account.currency],
    currencyCode: account.currency,
    title: card.personalizedName || account.productName,
    balance: account.balance,
    syncID: [...account.cards.map(card => card.cardNumberMasked.slice(-4))],
    cardHash: card.cardHash,
    rkcCode: account.rkcCode
  }
}

export function convertTransaction (json) {
  json.sum = json.operationAmount || json.transactionAmount

  const transaction = {
    date: json.operationDate || json.transactionDate,
    movements: [getMovement(json)],
    merchant: getMerchant(json),
    comment: getComment(json),
    hold: json.hold
  }

  return transaction
}

function getMovement (json) {
  return {
    id: json.id || generateMovementId(json),
    account: { id: json.accountId },
    invoice: null,
    sum: json.sum,
    fee: 0
  }
}

function generateMovementId (json) {
  return md5.hex(`${json.accountId}-${json.operationDate || json.transactionDate}-
  ${json.operationPlace || json.operationName}-${json.operationAmount || json.transactionAmount}-
  ${json.operationCurrency || json.transactionCurrency}`)
}

function getComment (json) {
  if (json.transactionCurrency !== json.operationCurrency) {
    const transactionInfo = `Транзакция: ${json.transactionAmount} ${json.transactionCurrency}`
    return transactionInfo
  }

  if (!json.operationName) {
    return null
  }

  if (json.operationName === 'Оплата товаров/услуг в ОТС') {
    return null
  }

  if (json.operationName.indexOf('Перевод средств на карточку') >= 0) {
    return json.merchant
  }

  return json.operationName
}

function getMerchant (json) {
  if (!json.merchant) {
    return null
  }
  if (json.merchant.indexOf('DABRABYT ERIP PAYMENTS') >= 0) {
    return null
  }
  if (json.merchant.indexOf('PEREVOD NA') >= 0) {
    return null
  }

  return {
    fullTitle: json.merchant,
    mcc: json.mcc ? Number.parseInt(json.mcc) : null,
    location: null
  }
}
