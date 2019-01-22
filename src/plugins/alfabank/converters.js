import _ from 'lodash'
import { ensureSyncIDsAreUniqueButSanitized, sanitizeSyncId } from '../../common/accounts'
import { addMovement, formatComment, getSingleReadableTransactionMovement, makeCashTransferMovement } from '../../common/converters'
import { mergeTransfers } from '../../common/mergeTransfers'
import { formatWithCustomInspectParams } from '../../consoleAdapter'
import { parseApiAmount } from './api'

const trimPostfix = (string, postfix) => {
  if (!string.endsWith(postfix)) {
    throw new Error(`${JSON.stringify(string)} does not end with ${postfix}`)
  }
  return string.slice(0, -postfix.length)
}

function convertCreditApiAccount (apiAccount) {
  const {
    'Кредитный продукт и валюта': typeWithDashAndInstrument,
    'Доступный лимит': availableWithInstrument,
    'Установленный лимит': creditLimitWithInstrument
  } = apiAccount.accountDetailsCreditInfo
  const instrumentPostfix = ' ' + apiAccount.currencyCode
  if (availableWithInstrument && creditLimitWithInstrument) {
    return {
      available: parseApiAmount(trimPostfix(availableWithInstrument, instrumentPostfix)),
      creditLimit: parseApiAmount(trimPostfix(creditLimitWithInstrument, instrumentPostfix))
    }
  } else if (
    typeWithDashAndInstrument.startsWith('Кредит наличными') ||
    typeWithDashAndInstrument.startsWith('Потребительский кредит') ||
    typeWithDashAndInstrument.startsWith('Ипотечный кредит') ||
    typeWithDashAndInstrument.startsWith('Разрешенный овердрафт') ||
    typeWithDashAndInstrument.startsWith('Кредитный продукт') ||
    typeWithDashAndInstrument.startsWith('Бизнес - кредит') ||
    typeWithDashAndInstrument.startsWith('Автокредит')
  ) {
    return {
      startBalance: 0,
      balance: parseApiAmount(apiAccount.amount)
    }
  } else {
    console.error({ apiAccount })
    throw new Error(`Unhandled credit account named ${apiAccount.description} (see logs)`)
  }
}

function convertNonCreditApiAccount (apiAccount) {
  return {
    balance: parseApiAmount(apiAccount.amount)
  }
}

export function toZenmoneyAccount (apiAccount) {
  const { description, number, currencyCode, creditInfo } = apiAccount
  return {
    type: 'ccard',
    id: number,
    title: description,
    syncID: [number],
    instrument: currencyCode,
    ...creditInfo
      ? convertCreditApiAccount(apiAccount)
      : convertNonCreditApiAccount(apiAccount)
  }
}

export const convertApiAccountsToAccountTuples = (apiAccounts) => {
  const zenMoneyAccounts = ensureSyncIDsAreUniqueButSanitized({
    accounts: apiAccounts.map(toZenmoneyAccount),
    sanitizeSyncId
  })
  return apiAccounts.map((apiAccount, index) => {
    const zenMoneyAccount = zenMoneyAccounts[index]
    console.assert(zenMoneyAccount.id === apiAccount.number, 'invariant: ensureSyncIDsAreUniqueButSanitized changed order')
    return { apiAccount, zenMoneyAccount }
  })
}

const dateRegExp = /\d{2}\.\d{2}\.\d{2}/
const spaceRegExp = /\s+/
const amountRegExp = /(\d+\.\d+|\.\d+|\d+\.?)/
const currencyRegExp = /([A-Z]{3})/
const optionalMccRegExp = /(?:\s+MCC(\d+))?/

// poor mans parser generator
const descriptionRegExp = new RegExp([
  dateRegExp,
  spaceRegExp,
  amountRegExp,
  spaceRegExp,
  currencyRegExp,
  optionalMccRegExp
].map((x) => x.source).join(''))

export function parseApiMovementDescription (description, sign) {
  const match = description.match(descriptionRegExp)
  if (!match) {
    return {
      origin: null,
      mcc: null
    }
  }
  const [, amount, currency, mcc] = match
  return {
    origin: {
      amount: sign * Number(amount),
      instrument: currency
    },
    mcc: mcc ? Number(mcc) : null
  }
}

function findMovementAccountTuple (apiMovement, accountTuples) {
  const parsedAmount = parseApiAmount(apiMovement.amount)
  const candidates = parsedAmount > 0
    ? [
      apiMovement.recipientInfo && apiMovement.recipientInfo.recipientAccountNumberDescription,
      apiMovement.recipientInfo && apiMovement.recipientInfo.recipientValue
    ] : [
      apiMovement.senderInfo && apiMovement.senderInfo.senderAccountNumberDescription
    ]
  const candidatesLast4Chars = _.uniq(_.compact(candidates).map((x) => x.slice(-4)))
  if (candidatesLast4Chars.length === 1) {
    const last4 = candidatesLast4Chars[0]
    const matchingAccounts = accountTuples.filter((x) => x.apiAccount.number.endsWith(last4))
    if (matchingAccounts.length !== 1) {
      console.warn(
        `cannot match ${parsedAmount > 0 ? 'recipient' : 'sender'} account unambiguously (no single match), ignoring movement`,
        { apiMovement, last4, matchingAccounts }
      )
      return null
    }
    return matchingAccounts[0]
  }
  if (candidatesLast4Chars.length === 0) {
    const nonOwnSharedAccountTuples = accountTuples.filter((x) => x.apiAccount.sharedAccountInfo && !x.apiAccount.sharedAccountInfo.isOwn)
    if (nonOwnSharedAccountTuples.length === 1) {
      return nonOwnSharedAccountTuples[0]
    }
  }
  console.warn(
    `cannot extract ${parsedAmount > 0 ? 'recipient' : 'sender'} account id (no single candidate), ignoring movement`,
    { apiMovement, candidatesLast4Chars }
  )
  return null
}

export const normalizeIsoDate = (isoDate) => isoDate.replace(/([+-])(\d{2})(\d{2})$/, '$1$2:$3')

export const extractDate = (apiMovement) => {
  const created = new Date(normalizeIsoDate(apiMovement.createDate))
  if (apiMovement.executeTimeStamp) {
    const executed = new Date(normalizeIsoDate(apiMovement.executeTimeStamp))
    return executed < created
      ? executed
      : created
  }
  return created
}

function convertApiMovementToReadableTransaction (apiMovement, accountId) {
  const sum = parseApiAmount(apiMovement.amount)
  const accountInstrument = apiMovement.currency
  const { mcc, origin } = parseApiMovementDescription(apiMovement.description, Math.sign(sum))
  // TODO rename origin.amount to origin.sum to avoid mapping
  const invoice = origin === null || origin.instrument === accountInstrument
    ? null
    : { sum: origin.amount, instrument: origin.instrument }
  const readableTransaction = {
    movements: [
      {
        id: apiMovement.key,
        account: { id: accountId },
        invoice,
        sum,
        fee: 0
      }
    ],
    date: extractDate(apiMovement),
    hold: apiMovement.hold,
    merchant: {
      title: (apiMovement.recipientInfo && apiMovement.recipientInfo.recipientName) || apiMovement.shortDescription || null,
      mcc,
      location: null
    },
    comment: formatComment({ invoice, sum, fee: 0, accountInstrument })
  }
  if (apiMovement.shortDescription === 'Снятие наличных в банкомате' ||
    apiMovement.description.startsWith('Внесение наличных рублей') ||
    apiMovement.description.includes('Внесение средств через устройство')) {
    return addMovement(readableTransaction, makeCashTransferMovement(readableTransaction, accountInstrument))
  }
  // TODO transfers from other banks can be handled
  return readableTransaction
}

const makeNeverLosingDataMergeCustomizer = (relatedMovements) => function (valueInA, valueInB, key, objA, objB) {
  if (valueInA && valueInB && valueInA !== valueInB && !(_.isPlainObject(valueInA) && _.isPlainObject(valueInB))) {
    if (key === 'recipientAccountNumberDescription' && objA.recipientValue && valueInB.endsWith(objA.recipientValue.slice(-4))) {
      return
    }
    throw new Error(formatWithCustomInspectParams(
      key,
      `has ambiguous values:`, [valueInA, valueInB],
      { objects: [objA, objB], relatedMovements }
    ))
  }
}

export const isPossiblyTransfer = ({ reference }) => {
  return reference !== 'HOLD' &&
    reference !== '' &&
    !reference.startsWith('CRD_') &&
    !reference.startsWith('OP1ED') &&
    !reference.startsWith('CASHIN') &&
    // following references are the same for deposits creation/destroy/percentages:
    !reference.startsWith('U') && // ^U\d{2}A
    !reference.startsWith('PML') && // ^PML\d{4}B\d{8}$
    !reference.startsWith('AQ') && // ^AQ\d
    !reference.startsWith('AL') // ^AL\d\w
}

function complementTransferSides (apiMovements) {
  const relatedMovementsByReferenceLookup = _.fromPairs(_.toPairs(_.groupBy(apiMovements, x => {
    delete x.actions
    return x.reference
  })).filter(([key, items]) => isPossiblyTransfer({ reference: key }) && items.length === 2))
  return apiMovements.map((apiMovement) => {
    const relatedMovements = relatedMovementsByReferenceLookup[apiMovement.reference]
    if (!relatedMovements) {
      return apiMovement
    }
    const neverLosingDataMergeCustomizer = makeNeverLosingDataMergeCustomizer(relatedMovements)
    const senderInfo = _.mergeWith({}, ...relatedMovements.map((x) => x.senderInfo), neverLosingDataMergeCustomizer)
    const recipientInfo = _.mergeWith({}, ...relatedMovements.map((x) => x.recipientInfo), neverLosingDataMergeCustomizer)
    const executeTimeStamp = relatedMovements.map((x) => x.executeTimeStamp).find(Boolean)
    return { ...apiMovement, executeTimeStamp, senderInfo, recipientInfo }
  })
}

const isTransferItem = ({ apiMovement: { senderInfo, recipientInfo, reference, description }, readableTransaction }) => {
  if (readableTransaction.movements.length > 1) {
    return false
  }
  if (!isPossiblyTransfer({ reference })) {
    return false
  }
  if (description.startsWith('Внутрибанковский перевод между счетами')) {
    return true
  }
  const movement = getSingleReadableTransactionMovement(readableTransaction)
  if (movement.sum > 0) {
    return senderInfo.senderNameBank === `АО "АЛЬФА-БАНК"`
  } else {
    return recipientInfo && recipientInfo.recipientNameBank === `АО "АЛЬФА-БАНК"`
  }
}

export function convertApiMovementsToReadableTransactions (apiMovements, accountTuples) {
  const movementsWithoutDuplicates = _.uniqBy(apiMovements, x => x.key)
  const movementsWithCompleteSides = complementTransferSides(movementsWithoutDuplicates)
  const processedMovements = movementsWithCompleteSides.map((apiMovement) => {
    const accountTuple = findMovementAccountTuple(apiMovement, accountTuples)
    if (accountTuple === null) {
      return null
    }
    const { apiAccount, zenMoneyAccount } = accountTuple
    return {
      apiMovement,
      apiAccount,
      readableTransaction: convertApiMovementToReadableTransaction(apiMovement, zenMoneyAccount.id)
    }
  })
  const processedMovementsWithoutNonAccountableArtifacts = processedMovements.filter((processedMovement) => {
    if (processedMovement === null) {
      return false
    }
    const { apiMovement, apiAccount } = processedMovement
    if (!apiAccount.accountDetailsCreditInfo || !apiAccount.accountDetailsCreditInfo['Кредитный продукт и валюта'].startsWith('Кредитная карта')) {
      return true
    }
    return !apiMovement.shortDescription || !apiMovement.shortDescription.startsWith('Погашение ')
  })
  return mergeTransfers({
    items: processedMovementsWithoutNonAccountableArtifacts,
    selectReadableTransaction: (item) => item.readableTransaction,
    makeGroupKey: (item) => isTransferItem(item) ? item.apiMovement.reference : null
  })
}
