import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
import { toISODateString } from '../../common/dateUtils'

export const card = 'card'
export const deposit = 'deposit'
export const checking = 'checking'

export function convertCard (json) {
  return convertAccount(json, card)
}

export function convertDeposit (json) {
  return convertAccount(json, deposit)
}

export function convertCheckingAccount (json) {
  return convertAccount(json, checking)
}

export function convertAccount (json, accountType) {
  switch (accountType) {
    case card:
      if (json.cards && json.cards.length > 0) { // only loading card accounts
        const account = {
          id: json.internalAccountId,
          type: card,
          title: json.productName,
          currencyCode: json.currency,
          instrument: codeToCurrencyLookup[json.currency],
          balance: Number.parseFloat(json.cards[0].balance || 0),
          syncID: [json.internalAccountId],
          rkcCode: json.rkcCode,
          cardHash: json.cards[0].cardHash
        }

        for (const el of json.cards) {
          account.syncID.push(el.cardNumberMasked.slice(-4))
        }

        return account
      }
      return null
    case deposit:
      return {
        id: json.internalAccountId,
        type: deposit,
        title: 'Депозит ' + json.productName,
        currencyCode: json.currency,
        instrument: codeToCurrencyLookup[json.currency],
        balance: Number.parseFloat(json.balanceAmount),
        syncID: [json.internalAccountId],
        capitalization: true,
        startDate: new Date(json.openDate),
        endDateOffset: (new Date(json.endDate).getTime() - new Date(json.openDate).getTime()) / 1000 / 60 / 60 / 24,
        endDateOffsetInterval: 'day',
        percent: json.interestRate,
        payoffInterval: 'month',
        payoffStep: 1,
        rkcCode: json.rkcCode
      }
    case checking:
      return {
        id: json.internalAccountId,
        type: checking,
        title: json.productName,
        currencyCode: json.currency,
        instrument: codeToCurrencyLookup[json.currency],
        balance: Number.parseFloat(json.balanceAmount || 0),
        syncID: [json.internalAccountId],
        rkcCode: json.rkcCode
      }
    default:
      return null
  }
}

export function convertTransaction (apiTransaction, accounts, hold = false) {
  if (apiTransaction.accountNumber.length > 16) {
    apiTransaction.accountNumber = apiTransaction.accountNumber.slice(-16)
  }

  const account = accounts.find(account => {
    return account.syncID.indexOf(apiTransaction.accountNumber) !== -1
  })
  const sign = (apiTransaction.operationCode && apiTransaction.operationCode === 3) || (apiTransaction.operationSign === '-1') ? -1 : 1
  const currency = apiTransaction.transactionCurrency
  const transactionCurrency = currency.length === 3 ? currency : currency.length === 2 ? `0${currency}` : `00${currency}`
  let fee = 0
  if (apiTransaction.operationName && apiTransaction.operationName.indexOf('Удержано подоходного налога') >= 0) {
    const nameSplit = apiTransaction.operationName.split(' ')
    fee = Number.parseFloat(nameSplit[nameSplit.length - 1])
  }
  if (apiTransaction.transactionAmount === 0 && fee === 0) {
    return null
  }
  const invoice = {
    sum: sign * Math.round((apiTransaction.transactionAmount - fee) * 100) / 100,
    instrument: codeToCurrencyLookup[transactionCurrency]
  }
  const transaction = {
    date: new Date(apiTransaction.operationDate ?? apiTransaction.operationDetail.paymentDate),
    movements: [
      {
        id: apiTransaction.transactionAuthCode ? apiTransaction.transactionAuthCode : null,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : sign * Math.abs(apiTransaction.operationAmount),
        fee
      }
    ],
    merchant: null,
    comment: null,
    hold
  };
  [
    parseCashTransfer,
    parseInnerTransfer,
    parseOuterTransfer,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account, invoice))

  return transaction
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (apiTransaction.operationCode === 6 || (!!apiTransaction.operationName && (
    apiTransaction.operationName.indexOf('наличны') >= 0 ||
    apiTransaction.operationName.indexOf('Снятие денег со счета') >= 0 ||
    apiTransaction.operationName.indexOf('Пополнение наличными') >= 0))) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: invoice.instrument,
        syncIds: null
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
    return true
  }
}

function parseInnerTransfer (transaction, apiTransaction, account, invoice) {
  if ((apiTransaction.operationPlace && [
    'BNB PEREVOD'
  ].indexOf(apiTransaction.operationPlace) >= 0) ||
    (apiTransaction.operationName && [
      'Выдача части на другой счет'
    ].indexOf(apiTransaction.operationName) >= 0)
  ) {
    transaction.groupKeys = [
      `${toISODateString(transaction.date)}_` +
      `${invoice.instrument}_` +
      `${Math.abs(invoice.sum)}`
    ]
    return true
  }
  return false
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if ([
    /POPOLNENIE KARTY/i
  ].some(regexp => regexp.test(apiTransaction.operationPlace)) ||
    [
      /P2P/i
    ].some(regexp => regexp.test(apiTransaction.operationName))) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'ccard',
        instrument: invoice.instrument,
        syncIds: null
      },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })
    return true
  }
}

function cleanMerchantTitle (title) {
  if (!title) return null
  // Remove technical prefixes
  let cleaned = title
    .replace(/^(I\.-SHOP|PT|TO OOO)\s*/i, '')
    .trim()

  // Remove MCC suffix if present (e.g. "SUPERMARKET\nMCC 5411, ...")
  const mccIndex = cleaned.indexOf('\nMCC ')
  if (mccIndex > 0) {
    cleaned = cleaned.substring(0, mccIndex).trim()
  }

  // Remove surrounding quotes
  cleaned = cleaned.replace(/^"(.+)"$/, '$1').trim()

  return cleaned || null
}

function parseMcc (apiTransaction) {
  const mccCode = apiTransaction.operationDetail?.mccCode
  if (!mccCode) return null
  const match = mccCode.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

function parseLocation (apiTransaction) {
  const location = apiTransaction.operationDetail?.terminalLocation || ''
  if (!location || location === '-') return { city: null, country: null }
  // Format: "BLR MINSK", "BLR G. MINSK", "BLR d.BOLSHOE STI", "G. MINSK"
  let country = null
  let city = location

  // Check for country code at the beginning
  if (/^BLR\s+/i.test(location)) {
    country = 'BLR'
    city = location.replace(/^BLR\s+/i, '')
  }

  // Clean up city prefixes (G. = город, d. = деревня)
  city = city
    .replace(/^G\.\s*/i, '')
    .replace(/^d\.\s*/i, '')
    .trim()

  return { city: city || null, country }
}

function getMerchantName (apiTransaction) {
  // For hold transactions - merchant is in operationDetail.operationName or top-level operationName
  if (apiTransaction.operationDetail?.operationName && apiTransaction.operationDetail.operationName !== '-') {
    return cleanMerchantTitle(apiTransaction.operationDetail.operationName)
  }
  // For settled transactions - merchant is in operationPlace
  if (apiTransaction.operationPlace) {
    return cleanMerchantTitle(apiTransaction.operationPlace)
  }
  return null
}

function isIgnoredMerchant (merchantName) {
  if (!merchantName) return true
  const ignored = [
    'BNB - OPLATA USLUG',
    'Оплата услуг в интернет(мобильном) банкинге',
    'OPLATA USLUG - KOMPLAT BNB',
    'BNB KOMPLAT ERIP OTHER',
    'BNB KOMPLAT ERIP MB SV',
    'BNB KOMPLAT ERIP MB',
    'BNB KOMPLAT SMS',
    'BNB-BANK ERIP',
    'BNB-BANK FEE SMS'
  ]
  if (ignored.some(i => merchantName.indexOf(i) >= 0)) return true
  // BLR MINSK / SOA BNB without actual merchant name
  if (/^BLR\s+(\w+\.?\s*)?(MINSK|SOA\s+BNB)/.test(merchantName)) return true
  if (/^G\.\s*MINSK$/i.test(merchantName)) return true
  if (/^SOA\s+BNB$/i.test(merchantName)) return true
  return false
}

function parsePayee (transaction, apiTransaction) {
  const merchantName = getMerchantName(apiTransaction)
  if (isIgnoredMerchant(merchantName)) {
    return false
  }

  const mcc = parseMcc(apiTransaction)
  const { city, country } = parseLocation(apiTransaction)

  transaction.merchant = {
    mcc,
    location: null
  }

  // Try to parse structured merchant (format: "NAME > CITY COUNTRY")
  const merchant = (apiTransaction.operationPlace || '').split('>').map(str => str.trim())
  if (merchant.length === 2) {
    transaction.merchant.title = cleanMerchantTitle(merchant[0])
    const geo = merchant[1].split(' ')
    transaction.merchant.city = merchant[1].replace(' ' + geo[geo.length - 1], '').trim()
    transaction.merchant.country = geo[geo.length - 1]
  } else if (city) {
    // Use structured merchant with city (country may be null)
    transaction.merchant.city = city
    transaction.merchant.country = country
    transaction.merchant.title = merchantName
  } else {
    // Use fullTitle for non-structured merchant without location
    transaction.merchant.fullTitle = merchantName
  }
}

function parseComment (transaction, apiTransaction, account) {
  if (apiTransaction.operationCurrency !== account.currencyCode) {
    transaction.comment = `${apiTransaction.operationAmount} ${codeToCurrencyLookup[apiTransaction.operationCurrency]}`
    return false
  }
  if (!apiTransaction.operationName) { return false }

  if (apiTransaction.operationName.indexOf('Капитализация. Удержано подоходного налога') >= 0) {
    transaction.comment = 'Капитализация'
    return false
  }

  const operationName = apiTransaction.operationName

  // Useless technical comments - don't add to transaction
  const ignoredComments = [
    'Списание по операции ПЦ "Перечисление с карты на карту" ',
    'On-line пополнение договора (списание с БПК)',
    'Покупки',
    'Покупки(конверсия)',
    'Операция в Интернет-Банк',
    'Покупка товаров и услуг',
    'Списание по операции ПЦ "Оплата услуг в ИБ" ',
    // New technical comments to ignore
    'Оплата товаров, работ или услуг',
    'Оплата товаров, работ или услуг в устройствах других Банков',
    'Пополнение карт через ЕРИП в устройствах иных банков',
    'Оплата услуг в СДБО БНБ-Банк'
  ]

  // For transfer operations, no need for comment - return true to stop processing
  if (operationName === 'Списание по операции ПЦ "Перечисление с карты на карту" ' ||
      operationName === 'On-line пополнение договора (списание с БПК)') {
    return true
  }

  // Skip useless technical comments
  if (ignoredComments.includes(operationName)) {
    return false
  }

  // Check for comments with MCC info (hold transactions) - extract only useful part if any
  if (operationName.includes('\nMCC ')) {
    // The merchant name is before \nMCC - don't duplicate it in comment
    return false
  }

  transaction.comment = operationName
  return false
}

export function getLastTransactionDate (str) {
  const [day, month, year, hour, minute, second] = str.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`)
}

export function transactionsUnique (array) {
  const a = array.concat()
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i].date.getDate() === a[j].date.getDate() &&
        a[i].date.getFullYear() === a[j].date.getFullYear() &&
        a[i].date.getMonth() === a[j].date.getMonth() &&
        a[i].date.getHours() === a[j].date.getHours() &&
        a[i].movements.length === a[j].movements.length &&
        a[i].movements[0].account.id === a[j].movements[0].account.id &&
        a[i].movements[0].sum === a[j].movements[0].sum) {
        a.splice(j--, 1)
      }
    }
  }
  return a
}

export function convertTestTransactions (apiTransactions, accounts, hold = false) {
  const transactions = []
  for (const apiTransaction of apiTransactions) {
    const transaction = convertTransaction(apiTransaction, accounts, hold = false)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return transactionsUnique(transactions)
}
