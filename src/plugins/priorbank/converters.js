import _ from 'lodash'
import { subtract } from '../../common/decimal'
import { formatCommentFeeLine, joinCommentLines } from '../../common/converters'

function accountIban (card) {
  const iban = card.iban?.replace(/\s/g, '').toUpperCase()
  return /^BY\d{2}[A-Z0-9]{24}$/.test(iban) ? iban : null
}

function groupOwnCards (allCards) {
  const ownCards = allCards.filter(card => card.status?.respCode !== -9999)
  return Object.values(_.groupBy(ownCards, ({ clientObject: card }) =>
    JSON.stringify([card.type, card.currIso, accountIban(card) || card.id])))
}

export function convertAccounts (apiAccounts, apiAccountDetails) {
  if (!Array.isArray(apiAccountDetails)) { return [] }
  const detailsById = _.keyBy(apiAccountDetails, 'id')
  const accounts = groupOwnCards(apiAccounts).map(group => {
    const cards = _.sortBy(_.uniqBy(group, 'clientObject.id'), 'clientObject.id')
    const cardWithDetails = cards.find(card => detailsById[card.clientObject.id])
    console.assert(cardWithDetails, 'could not find details for account', cards.map(card => card.clientObject.id))
    const account = convertCard(cards[0], detailsById[cardWithDetails.clientObject.id])
    account.syncID = _.uniq([...account.syncID, ...cards.map(card => card.clientObject.cardMaskedNumber.slice(-4))]).sort()
    const products = cards.map(card => ({ id: card.clientObject.id.toString(), type: 'card' }))
    return { account, products }
  })
  const identifierCounts = _.countBy(_.flatMap(accounts, ({ account }) => account.syncID))
  for (const { account } of accounts) {
    if (account.syncID.every(id => identifierCounts[id] > 1)) {
      account.syncID.push(account.id)
    }
  }
  return accounts
}

export function convertCard (card, details) {
  const creditLimit = details.contract.creditLimit || 0
  const iban = accountIban(card.clientObject)
  return {
    id: card.clientObject.id.toString(),
    title: card.clientObject.customSynonym || card.clientObject.defaultSynonym,
    type: 'ccard',
    syncID: [card.clientObject.cardMaskedNumber.slice(-4), ...(iban ? [iban] : [])],
    instrument: card.clientObject.currIso,
    balance: Number(subtract(card.balance.available, creditLimit)),
    ...creditLimit && { creditLimit }
  }
}

const extractRegularTransactionAmount = ({ accountCurrency, apiTransaction }) => {
  if (accountCurrency === apiTransaction.transCurrIso) {
    return apiTransaction.accountAmount
  }
  if (apiTransaction.amount === 0) {
    if (apiTransaction.feeAmount !== 0) {
      return apiTransaction.feeAmount
    }
    console.error({ accountCurrency, apiTransaction })
    throw new Error('Cannot handle corrupted transaction amounts')
  }
  return Math.sign(apiTransaction.accountAmount) * Math.abs(apiTransaction.amount)
}

export function chooseDistinctCards (cardsBodyResult, cardDetails) {
  const detailsById = _.keyBy(cardDetails, 'id')
  return groupOwnCards(cardsBodyResult).map(cards => _.sortBy(cards, [
    (x) => detailsById[x.clientObject.id] ? 0 : 1,
    (x) => x.clientObject.cardStatus === 1 ? 0 : 1,
    (x) => x.clientObject.defaultSynonym,
    (x) => x.clientObject.id
  ])[0])
}

function parseDate (apiTransactionPayload) {
  return apiTransactionPayload.transTime
    ? new Date(apiTransactionPayload.transDate.substring(0, 11) + apiTransactionPayload.transTime + apiTransactionPayload.transDate.substring(19))
    : new Date(apiTransactionPayload.transDate)
}

export function convertTransaction (apiTransaction, mainAccount, isRegularTransaction) {
  if (apiTransaction.amount === 0 || apiTransaction.accountAmount === 0) {
    return null
  }
  apiTransaction.transDetails = apiTransaction.transDetails.trim()
  const accountCurrency = mainAccount.account.instrument
  const accountId = mainAccount.account.id

  let sum
  let invoiceSum
  if (isRegularTransaction) {
    sum = apiTransaction.accountAmount
    invoiceSum = extractRegularTransactionAmount({ accountCurrency, apiTransaction })
  } else {
    const sign = Math.sign(-apiTransaction.amount)
    sum = sign * Math.abs(apiTransaction.amount)
    invoiceSum = sign * Math.abs(apiTransaction.transAmount)
  }
  const invoice = apiTransaction.transCurrIso === accountCurrency
    ? null
    : { sum: invoiceSum, instrument: apiTransaction.transCurrIso }

  const fee = 0
  const date = parseDate(apiTransaction)
  const transaction = {
    movements: [
      {
        id: null,
        account: { id: accountId },
        invoice,
        sum,
        fee
      }
    ],
    date,
    hold: !isRegularTransaction,
    merchant: null,
    comment: null
  };
  [
    parseInnerTransfer,
    parseCashTransfer,
    parseOuterTransfer,
    parsePayee,
    parseComment
  ].some(parser => parser(transaction, apiTransaction, invoice))

  transaction.comment = joinCommentLines([
    cleanComment(transaction.comment),
    formatCommentFeeLine(fee || apiTransaction.feeAmount || 0, accountCurrency)
  ])
  return transaction
}

function parseCashTransfer (transaction, apiTransaction, invoice) {
  let regex
  if ([
    /^ATM/,
    /^Cash/,
    /^Credit .* CASH-IN( \d+| )?$/
  ].some(regexp => {
    regex = regexp
    return regexp.test(apiTransaction.transDetails)
  })) {
    transaction.merchant = null
    transaction.movements.push({
      id: null,
      account: {
        type: 'cash',
        instrument: apiTransaction.transCurrIso,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: invoice ? -invoice.sum : -transaction.movements[0].sum,
      fee: 0
    })
    if (regex.toString().startsWith('/^Credit ')) {
      regex = /^Credit/
    }
    transaction.comment = apiTransaction.transDetails.replace(regex, '').trim()
    return true
  }
  return false
}

function parseInnerTransfer (transaction, apiTransaction, invoice) {
  if (![
    /^CH Debit .*P2P( |_)SDBO/,
    /^CH Payment .*P2P( |_)SDBO/,
    /.* SOU INTERNETBANK$/ // под вопросом
  ].some(regexp => regexp.test(apiTransaction.transDetails))) {
    return false
  }
  const sum = invoice ? -invoice.sum : -transaction.movements[0].sum
  transaction.groupKeys = [`${apiTransaction.transDate.slice(0, 10)}_${apiTransaction.transTime}_${Math.abs(sum)}_${apiTransaction.transCurrIso}`]
  if ([
    /.* SOU INTERNETBANK$/
  ].some(regexp => regexp.test(apiTransaction.transDetails))) {
    return false
  } else {
    return true
  }
}

function parseOuterTransfer (transaction, apiTransaction, invoice) {
  if ([
    /^Перевод с карты на счет/,
    /^CH Debit/,
    /^CH Payment/,
    /.* MOBILE BANK$/,
    /Unique RUS MOSCOW YANDEX.MONEY\s*$/
  ].some(regexp => {
    return regexp.test(apiTransaction.transDetails)
  })) {
    transaction.movements.push({
      id: null,
      account: {
        type: null,
        instrument: apiTransaction.transCurrIso,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: invoice ? -invoice.sum : -transaction.movements[0].sum,
      fee: 0
    })
    transaction.comment = apiTransaction.transDetails
      .replace(/^Перевод с карты на счет/, '')
      .replace('. Перевод не связан с предпринимательской деятельностью.', '').trim() || null
    return true
  }
  return false
}

function parsePayee (transaction, apiTransaction, invoice) {
  let regex
  if (![
    /^Retail /
  ].some(regexp => {
    regex = regexp
    return regexp.test(apiTransaction.transDetails)
  })) {
    return false
  }
  transaction.merchant = parseMerchant(apiTransaction.transDetails.replace(regex, ''))
  return true
}

function parseComment (transaction, apiTransaction, invoice) {
  let regex
  if ([
    /^Credit /,
    /^Reversal. Retail /
  ].some(regexp => {
    regex = regexp
    return regexp.test(apiTransaction.transDetails)
  })) {
    transaction.merchant = parseMerchant(apiTransaction.transDetails.replace(regex, ''))
    return true
  }
  transaction.comment = apiTransaction.transDetails
  return true
}

function parseMerchant (text) {
  const fullTitle = text.trim()
  const match = /^([A-Z]{3}) (\S+) (.+)$/.exec(fullTitle)
  if (!match) {
    return { fullTitle, mcc: null, location: null }
  }
  const [, country, place, title] = match
  return {
    title: title.replace(/\s+/g, ' ').trim(),
    // The terminal location sometimes contains a website instead of a city.
    city: place.includes('.') ? null : place,
    country,
    mcc: null,
    location: null
  }
}

function cleanComment (comment) {
  if (comment === null) return null
  const text = comment.replace(/\s+/g, ' ').trim()
  if (/^(?:Поступление на контракт клиента|Payment From Client Contract) \d+(?:-\d+)+$/.test(text) ||
      /^Retail [A-Z]{3} \S+ MOBILE BANK$/.test(text)) {
    return null
  }
  return text.replace(/^Зачисление денежных средств (Онлайн пополнение счета) IBAN: [A-Z]{2}\d{2}[A-Z0-9]+$/, '$1') || null
}

export function convertTransactions ({ apiAccountsWithoutDuplicates, apiAccountDetails, accounts }) {
  const items = _.flatMap(apiAccountsWithoutDuplicates, (apiAccount) => {
    const mainAccount = accounts.find(account => account.products.some(product => product.id === apiAccount.clientObject.id.toString()))
    if (!mainAccount) {
      console.log('could not find mainAccount for account', apiAccount)
      return []
    }
    const cardDesc = apiAccountDetails.find((x) => x.id === apiAccount.clientObject.id)
    const abortedTransactions = _.flatMap(cardDesc.contract.abortedContractList, (x) => x.abortedTransactionList.reverse())
    const regularTransactions = _.flatMap(cardDesc.contract.account.transCardList, (x) => x.transactionList.reverse())
    const readableAbortedTransactions = abortedTransactions.map(apiTransaction => {
      return convertTransaction(apiTransaction, mainAccount, false)
    })
    const readableRegularTransactions = regularTransactions.map(apiTransaction => {
      return convertTransaction(apiTransaction, mainAccount, true)
    })
    return [
      ...readableAbortedTransactions,
      ...readableRegularTransactions
    ]
  }).filter(x => x)
  return items
}
