import { parseOuterAccountData } from '../../common/accounts'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

const ACCOUNT_TYPES = new Set([
  'CURRENT_ACCOUNT',
  'CARD_ACCOUNT',
  'DREAMS_ACCOUNT',
  'SAVINGS_ACCOUNT',
  'REVOLVING_ACCOUNT',
  'CREDIT_ACCOUNT',
  'LOAN2'
])
const SAVINGS_ACCOUNT_TYPES = new Set(['DREAMS_ACCOUNT', 'SAVINGS_ACCOUNT'])
const TRANSACTION_TYPES = new Set(['INCOME', 'EXPENSE'])
const TRANSACTION_STATUSES = new Set(['PROCESSING', 'COMPLETED', 'REJECTED'])
const INTERNAL_OPERATION_TYPES = new Set([
  'INTERNAL_CARD_TRANSFER',
  'INTERNAL_ACCOUNT_TRANSFER',
  'DEPOSIT_REPLENISHMENT',
  'LOAN_REPAYMENT',
  'FX'
])
const EXTERNAL_TRANSFER_TYPES = new Set([
  'CARD_TRANSFER',
  'OTHER_CARD_INTERNAL',
  'EXTERNAL_ACCOUNT_TRANSFER',
  'INSTANT_TRANSFER',
  'RECEIVER_INSTANT_TRANSFER',
  'OTHER_CLIENT_INTERNAL'
])
const PAYMENT_OPERATION_TYPES = new Set([
  'UTILITIES_BILLS',
  'MOBILE_REFILL',
  'CARD_PAYMENT',
  'ACCOUNT_PAYMENT'
])
const OPERATION_TYPES = new Set([
  ...INTERNAL_OPERATION_TYPES,
  ...EXTERNAL_TRANSFER_TYPES,
  ...PAYMENT_OPERATION_TYPES
])
const CASH_PATTERN = /(?:отримання|зняття|видача|поповнення).*готів|готівк|\b(?:ATM|CASH)\b/i
const GENERIC_COMMENTS = new Set([
  'операція по картці',
  'операція за карткою',
  'оплата карткою',
  'готівкою',
  'переказ між власними рахунками'
])

function enumValue (value) {
  if (typeof value === 'string') return value
  return value && typeof value === 'object' && typeof value.name === 'string' ? value.name : null
}

function normalizeText (value) {
  return typeof value === 'string' && value.trim()
    ? value.replace(/\s+/g, ' ').trim()
    : null
}

function normalizeTitle (value) {
  const title = normalizeText(value)
  return title && title.toLowerCase() !== 'unknown' ? title : null
}

function normalizeIdentifier (value) {
  if (value && typeof value === 'object') {
    value = value.unformatted || value.formatted || value.number
  }
  return String(value || '').replace(/\s/g, '').replace(/x/gi, '*').toUpperCase()
}

function uniqStrings (values) {
  return [...new Set(values.map(normalizeIdentifier).filter(Boolean))]
}

function normalizeCardIdentifier (value) {
  const identifier = normalizeIdentifier(value)
  return /^\d{12,19}$/.test(identifier)
    ? `${identifier.slice(0, 6)}${'*'.repeat(identifier.length - 10)}${identifier.slice(-4)}`
    : identifier
}

function toNumber (value, fieldName) {
  const number = Number(value)
  console.assert(Number.isFinite(number), 'UKRSIB monetary value is invalid', {
    fieldName,
    actualType: value === null ? 'null' : typeof value
  })
  return number
}

function toOptionalNumber (value, fieldName) {
  return value === null || value === undefined ? null : toNumber(value, fieldName)
}

function getAmountValue (amount, fieldName) {
  if (amount === null || amount === undefined) return null
  const value = typeof amount === 'object' ? amount.sum : amount
  return toOptionalNumber(value, fieldName)
}

function getCurrency (value) {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return null
  return normalizeText(value.name) || normalizeText(value.code) || normalizeText(value.currency)
}

function getAmountCurrency (amount) {
  if (!amount || typeof amount !== 'object') return null
  return getCurrency(amount.currency) || getCurrency(amount.instrument)
}

function toDate (value, fieldName) {
  let normalized = value
  if (typeof normalized === 'number' && normalized > 0 && normalized < 100000000000) normalized *= 1000
  const date = new Date(normalized)
  console.assert(Number.isFinite(date.getTime()), 'UKRSIB date is invalid', {
    fieldName,
    actualType: value === null ? 'null' : typeof value
  })
  return date
}

function getEndDateOffset (startDate, endDate, period) {
  if (endDate && endDate.getTime() > startDate.getTime()) {
    return getIntervalBetweenDates(startDate, endDate)
  }
  const count = Number(period)
  return {
    interval: 'day',
    count: Number.isFinite(count) && count > 0 ? Math.round(count) : 1
  }
}

function isArchivedStatus (value) {
  return /ARCHIV|CLOSED|CANCELLED|TERMINATED|EXPIRED/i.test(enumValue(value) || String(value || ''))
}

function getNaturalAccountSyncIds (apiAccount, cards) {
  return uniqStrings([
    apiAccount.iban,
    apiAccount.number
  ]).concat(uniqStrings(cards.flatMap(card => [
    normalizeCardIdentifier(card.pan),
    normalizeCardIdentifier(card.number)
  ]))).filter((value, index, values) => values.indexOf(value) === index)
}

function createSyncIdsResolver (products) {
  const naturalIds = new Map()
  const naturalCounts = new Map()
  const fallbackCounts = new Map()

  for (const product of products) {
    const ids = product.kind === 'account'
      ? getNaturalAccountSyncIds(product.api, product.cards)
      : []
    naturalIds.set(product, ids)
    for (const id of ids) naturalCounts.set(id, (naturalCounts.get(id) || 0) + 1)
    const fallback = normalizeIdentifier(product.api.id)
    if (fallback) fallbackCounts.set(fallback, (fallbackCounts.get(fallback) || 0) + 1)
  }

  return product => {
    const uniqueNaturalIds = naturalIds.get(product).filter(id => naturalCounts.get(id) === 1)
    if (uniqueNaturalIds.length > 0) return uniqueNaturalIds

    const rawFallback = normalizeIdentifier(product.api.id)
    const fallback = fallbackCounts.get(rawFallback) === 1
      ? rawFallback
      : rawFallback ? `${product.kind.toUpperCase()}:${rawFallback}` : null
    console.assert(fallback, 'UKRSIB product has no stable unique identifier', {
      productKind: product.kind,
      hasProductId: Boolean(rawFallback),
      naturalIdentifierCount: naturalIds.get(product).length
    })
    return fallback ? [fallback] : []
  }
}

function convertRegularAccount (product, syncIds) {
  const apiAccount = product.api
  const accountType = enumValue(apiAccount.type)
  console.assert(ACCOUNT_TYPES.has(accountType), 'UKRSIB account type is unsupported', {
    accountId: String(apiAccount.id),
    accountType
  })
  const balance = getAmountValue(apiAccount.balance, 'account.balance')
  const instrument = getAmountCurrency(apiAccount.balance) || getCurrency(apiAccount.currency)
  console.assert(instrument, 'UKRSIB account currency is missing', {
    accountId: String(apiAccount.id),
    accountType
  })
  const creditLimit = getAmountValue(apiAccount.overdraft?.overdraftLimit, 'account.overdraft.overdraftLimit')
  const available = getAmountValue(apiAccount.totalAvailableAmount, 'account.totalAvailableAmount')
  const firstCard = product.cards[0]
  const hasCards = product.cards.length > 0 || accountType === 'CARD_ACCOUNT'
  return {
    account: {
      id: String(apiAccount.id),
      type: hasCards ? 'ccard' : 'checking',
      title: normalizeTitle(apiAccount.alias) || normalizeTitle(apiAccount.name) ||
        normalizeTitle(firstCard?.alias) || normalizeTitle(firstCard?.name) ||
        (hasCards ? 'Картковий рахунок' : 'Поточний рахунок'),
      instrument,
      syncIds,
      balance,
      ...creditLimit !== null && { creditLimit },
      ...available !== null && { available },
      savings: SAVINGS_ACCOUNT_TYPES.has(accountType),
      archived: isArchivedStatus(apiAccount.status) || (product.cards.length > 0 && product.cards.every(card => isArchivedStatus(card.status)))
    },
    fetchParams: {
      productIds: [String(apiAccount.id)],
      cardIds: product.cards.map(card => String(card.id))
    }
  }
}

function convertDeposit (product, syncIds) {
  const apiDeposit = product.api
  const balance = getAmountValue(apiDeposit.balance, 'deposit.balance')
  const instrument = getAmountCurrency(apiDeposit.balance) || getCurrency(apiDeposit.currency)
  const startDate = toDate(apiDeposit.openDate, 'deposit.openDate')
  const endDate = apiDeposit.closeDate == null ? null : toDate(apiDeposit.closeDate, 'deposit.closeDate')
  const { interval, count } = getEndDateOffset(startDate, endDate, apiDeposit.period)
  console.assert(instrument, 'UKRSIB deposit currency is missing', {
    depositId: String(apiDeposit.id)
  })
  return {
    account: {
      id: String(apiDeposit.id),
      type: 'deposit',
      title: normalizeTitle(apiDeposit.alias) || normalizeTitle(apiDeposit.name) || 'Депозит',
      instrument,
      syncIds,
      balance,
      startDate,
      startBalance: balance === null ? 0 : Math.max(0, balance),
      capitalization: enumValue(apiDeposit.chargingType) === 'DEPOSIT',
      percent: toOptionalNumber(apiDeposit.rate, 'deposit.rate'),
      endDateOffsetInterval: interval,
      endDateOffset: count,
      payoffInterval: 'month',
      payoffStep: 1,
      archived: isArchivedStatus(apiDeposit.status)
    },
    fetchParams: {
      productIds: [String(apiDeposit.id)],
      cardIds: []
    }
  }
}

function convertLoan (product, syncIds) {
  const apiLoan = product.api
  const principal = getAmountValue(apiLoan.amount, 'loan.amount')
  const debt = getAmountValue(apiLoan.debtDetails?.amount, 'loan.debtDetails.amount')
  const instrument = getAmountCurrency(apiLoan.debtDetails?.amount) ||
    getAmountCurrency(apiLoan.amount) || getCurrency(apiLoan.currency)
  const startDate = toDate(apiLoan.startDate, 'loan.startDate')
  const endDate = apiLoan.endDate == null ? null : toDate(apiLoan.endDate, 'loan.endDate')
  const { interval, count } = getEndDateOffset(startDate, endDate, null)
  console.assert(instrument, 'UKRSIB loan currency is missing', {
    loanId: String(apiLoan.id)
  })
  return {
    account: {
      id: String(apiLoan.id),
      type: 'loan',
      title: normalizeTitle(apiLoan.alias) || normalizeTitle(apiLoan.name) || 'Кредит',
      instrument,
      syncIds,
      balance: debt === null ? (principal === null ? null : -Math.abs(principal)) : -Math.abs(debt),
      startDate,
      startBalance: principal === null ? 0 : Math.abs(principal),
      capitalization: Boolean(apiLoan.isInstallment),
      percent: toOptionalNumber(apiLoan.rate, 'loan.rate'),
      endDateOffsetInterval: interval,
      endDateOffset: count,
      payoffInterval: 'month',
      payoffStep: 1,
      archived: isArchivedStatus(apiLoan.status)
    },
    fetchParams: {
      productIds: [String(apiLoan.id)],
      cardIds: []
    }
  }
}

export function convertAccounts (apiProducts) {
  console.assert(apiProducts && Array.isArray(apiProducts.accounts) && Array.isArray(apiProducts.cards) &&
    Array.isArray(apiProducts.deposits) && Array.isArray(apiProducts.loans), 'UKRSIB product graph is malformed', {
    hasProducts: Boolean(apiProducts),
    accountsType: typeof apiProducts?.accounts,
    cardsType: typeof apiProducts?.cards,
    depositsType: typeof apiProducts?.deposits,
    loansType: typeof apiProducts?.loans
  })
  const cardsByAccountId = new Map()
  for (const card of apiProducts.cards) {
    const accountId = String(card.accountId)
    cardsByAccountId.set(accountId, [...(cardsByAccountId.get(accountId) || []), card])
  }
  const loanIds = new Set(apiProducts.loans.map(loan => String(loan.id)))
  const products = [
    ...apiProducts.accounts
      .filter(account => enumValue(account.type) !== 'LOAN2' || !loanIds.has(String(account.id)))
      .map(api => ({ kind: 'account', api, cards: cardsByAccountId.get(String(api.id)) || [] })),
    ...apiProducts.deposits.map(api => ({ kind: 'deposit', api, cards: [] })),
    ...apiProducts.loans.map(api => ({ kind: 'loan', api, cards: [] }))
  ]
  const resolveSyncIds = createSyncIdsResolver(products)
  return products.map(product => {
    const syncIds = resolveSyncIds(product)
    if (product.kind === 'account') return convertRegularAccount(product, syncIds)
    if (product.kind === 'deposit') return convertDeposit(product, syncIds)
    return convertLoan(product, syncIds)
  })
}

export function parseDescription (description) {
  description = normalizeText(description && description.replace(/[\s:]*(Apple|Google)\s+Pay\s*[*\d]+\.?$/i, ''))
  if (!description) return { comment: null, merchant: null }

  let isMerchant = false
  for (const pattern of [
    /^Оплата товарів\\послуг(?: - інтернет)?\s*\\\s*/,
    /^Повернення коштів за товар\\послугу\s*\\\s*/
  ]) {
    if (pattern.test(description)) {
      description = description.replace(pattern, '')
      isMerchant = true
      break
    }
  }
  if (!isMerchant) return { comment: description, merchant: null }

  const parts = description.split('\\').map(normalizeText)
  if ((parts.length === 4 || parts.length === 5) && parts[1] && parts[2] && parts[3]) {
    return {
      comment: null,
      merchant: {
        country: parts[1],
        city: parts[2],
        title: normalizeText(parts.slice(3).filter(Boolean).join(' ')),
        mcc: null,
        location: null
      }
    }
  }
  return {
    comment: null,
    merchant: { fullTitle: description, mcc: null, location: null }
  }
}

function getToolObject (side, name) {
  const tool = side?.[name]
  return tool && typeof tool === 'object' ? tool : null
}

function getToolId (side, name) {
  const tool = side?.[name]
  if (tool && typeof tool === 'object') return tool.id == null ? null : String(tool.id)
  return tool === null || tool === undefined ? null : String(tool)
}

function createPlansLookup (plans) {
  const lookup = new Map()
  for (const plan of plans) {
    for (const productId of plan.fetchParams.productIds) lookup.set(`product:${productId}`, plan.account)
    for (const cardId of plan.fetchParams.cardIds) lookup.set(`card:${cardId}`, plan.account)
  }
  return side => {
    const accountId = getToolId(side, 'account') || normalizeText(side?.accountId)
    const cardId = getToolId(side, 'card') || normalizeText(side?.cardId)
    return (accountId && lookup.get(`product:${accountId}`)) ||
      (cardId && lookup.get(`card:${cardId}`)) || null
  }
}

function getMainAndCounterparty (apiTransaction, plans) {
  const resolveSide = createPlansLookup(plans)
  const senderAccount = resolveSide(apiTransaction.sender)
  const receiverAccount = resolveSide(apiTransaction.receiver)
  const type = enumValue(apiTransaction.type)
  const expectedMain = type === 'EXPENSE' ? senderAccount : receiverAccount
  const fallbackAccounts = [senderAccount, receiverAccount].filter(Boolean)
  const uniqueFallbackAccounts = [...new Map(fallbackAccounts.map(account => [account.id, account])).values()]
  const mainAccount = expectedMain || (uniqueFallbackAccounts.length === 1 ? uniqueFallbackAccounts[0] : null)
  const counterpartyAccount = type === 'EXPENSE' ? receiverAccount : senderAccount
  console.assert(mainAccount, 'UKRSIB transaction cannot be linked to a synced account', {
    transactionId: String(apiTransaction.id),
    transactionType: type,
    hasSenderAccount: Boolean(senderAccount),
    hasReceiverAccount: Boolean(receiverAccount)
  })
  return { mainAccount, counterpartyAccount }
}

function getAccountAmount (apiTransaction) {
  const status = enumValue(apiTransaction.status)
  const preferred = status === 'PROCESSING'
    ? apiTransaction.blockAmount || apiTransaction.postAmount
    : apiTransaction.postAmount || apiTransaction.blockAmount
  return preferred || apiTransaction.operationAmount
}

function createMovement (apiTransaction, account, sign, id = apiTransaction.id, amount = getAccountAmount(apiTransaction)) {
  const accountAmount = getAmountValue(amount, 'transaction.accountAmount')
  const accountAmountCurrency = getAmountCurrency(amount) || account.instrument
  const operationAmount = getAmountValue(apiTransaction.operationAmount, 'transaction.operationAmount')
  const operationCurrency = getAmountCurrency(apiTransaction.operationAmount) || accountAmountCurrency
  console.assert(accountAmount !== null && operationAmount !== null, 'UKRSIB transaction amount is missing', {
    transactionId: String(apiTransaction.id),
    hasAccountAmount: accountAmount !== null,
    hasOperationAmount: operationAmount !== null
  })
  console.assert(accountAmountCurrency === account.instrument, 'UKRSIB transaction account amount currency does not match the account', {
    transactionId: String(apiTransaction.id),
    accountId: account.id,
    accountInstrument: account.instrument,
    amountInstrument: accountAmountCurrency
  })
  return {
    id: id == null ? null : String(id),
    account: { id: account.id },
    invoice: operationCurrency !== account.instrument
      ? { sum: sign * Math.abs(operationAmount), instrument: operationCurrency }
      : null,
    sum: sign * Math.abs(accountAmount),
    fee: 0
  }
}

function getSideAmount (side) {
  return getToolObject(side, 'account')?.amount ||
    getToolObject(side, 'card')?.amount ||
    getToolObject(side, 'foreignCard')?.amount || null
}

function createCounterpartyMovement (apiTransaction, account, sign) {
  let amount = getSideAmount(sign > 0 ? apiTransaction.receiver : apiTransaction.sender)
  const operationCurrency = getAmountCurrency(apiTransaction.operationAmount)
  if (!amount && operationCurrency === account.instrument) amount = apiTransaction.operationAmount
  console.assert(amount, 'UKRSIB internal transfer counterparty amount is missing', {
    transactionId: String(apiTransaction.id),
    accountId: account.id,
    accountInstrument: account.instrument,
    operationInstrument: operationCurrency
  })
  return createMovement(apiTransaction, account, sign, `${String(apiTransaction.id)}:${account.id}`, amount)
}

function getExternalIdentifiers (side) {
  return uniqStrings([
    side?.accountNumber,
    side?.cardNumber,
    getToolObject(side, 'account')?.number,
    getToolObject(side, 'card')?.number,
    getToolObject(side, 'foreignCard')?.number
  ]).filter(value => value.length >= 4)
}

function createExternalMovement (apiTransaction, type, mainMovement) {
  const externalSide = type === 'EXPENSE' ? apiTransaction.receiver : apiTransaction.sender
  const operationAmount = getAmountValue(apiTransaction.operationAmount, 'transaction.operationAmount')
  const instrument = getAmountCurrency(apiTransaction.operationAmount) || mainMovement.invoice?.instrument
  console.assert(operationAmount !== null && instrument, 'UKRSIB external transfer amount is incomplete', {
    transactionId: String(apiTransaction.id),
    hasAmount: operationAmount !== null,
    hasInstrument: Boolean(instrument)
  })
  const syncIds = getExternalIdentifiers(externalSide)
  const bankName = normalizeText(externalSide?.bankName)
  const accountData = bankName && /УКРСИББАНК|UKRSIBBANK/i.test(bankName)
    ? { type: null, company: { id: '15395' } }
    : parseOuterAccountData(bankName) || {}
  const hasCard = Boolean(externalSide?.cardNumber || externalSide?.card || externalSide?.foreignCard)
  return {
    id: null,
    account: {
      type: accountData.type || (hasCard ? 'ccard' : null),
      instrument,
      company: accountData.company || null,
      syncIds: syncIds.length > 0 ? syncIds : null
    },
    invoice: null,
    sum: (type === 'EXPENSE' ? 1 : -1) * Math.abs(operationAmount),
    fee: 0
  }
}

function createCashMovement (apiTransaction, type, mainMovement) {
  const operationAmount = getAmountValue(apiTransaction.operationAmount, 'transaction.operationAmount')
  const instrument = getAmountCurrency(apiTransaction.operationAmount) || mainMovement.invoice?.instrument
  console.assert(operationAmount !== null && instrument, 'UKRSIB cash operation amount is incomplete', {
    transactionId: String(apiTransaction.id)
  })
  return {
    id: null,
    account: { type: 'cash', instrument, company: null, syncIds: null },
    invoice: null,
    sum: (type === 'EXPENSE' ? 1 : -1) * Math.abs(operationAmount),
    fee: 0
  }
}

function getCounterpartyName (apiTransaction, type) {
  const side = type === 'EXPENSE' ? apiTransaction.receiver : apiTransaction.sender
  return normalizeText(side?.name) || normalizeText(getToolObject(side, 'account')?.name) ||
    normalizeText(getToolObject(side, 'card')?.name) || normalizeText(getToolObject(side, 'foreignCard')?.name)
}

function createMerchant (apiTransaction, type, isTransfer) {
  const merchantName = normalizeText(apiTransaction.merchantName)
  const counterpartyName = isTransfer ? getCounterpartyName(apiTransaction, type) : null
  const title = merchantName || counterpartyName
  if (title) {
    const mcc = Number(apiTransaction.mcc)
    return {
      country: null,
      city: null,
      title,
      mcc: Number.isInteger(mcc) && mcc >= 1000 && mcc <= 9999 ? mcc : null,
      location: null,
      ...apiTransaction.category?.id != null && { category: String(apiTransaction.category.id) }
    }
  }
  return parseDescription(apiTransaction.alias).merchant
}

function createComment (apiTransaction, merchant, isInternalTransfer) {
  if (isInternalTransfer) return null
  const clientDescription = normalizeText(apiTransaction.clientDescription)
  const value = clientDescription || (!merchant ? parseDescription(apiTransaction.alias).comment : null)
  if (!value || GENERIC_COMMENTS.has(value.toLocaleLowerCase('uk-UA'))) return null
  const merchantTitle = normalizeText(merchant?.title) || normalizeText(merchant?.fullTitle)
  return merchantTitle && value.toLocaleLowerCase('uk-UA') === merchantTitle.toLocaleLowerCase('uk-UA')
    ? null
    : value
}

function createTransferGroupKeys (apiTransaction) {
  const reference = normalizeText(apiTransaction.uetr) || normalizeText(apiTransaction.documentNumber)
  const date = toDate(apiTransaction.blockDate || apiTransaction.operationDate || apiTransaction.postDate, 'transaction.operationDate')
  const amount = getAmountValue(apiTransaction.operationAmount, 'transaction.operationAmount')
  const currency = getAmountCurrency(apiTransaction.operationAmount)
  return [
    reference ? `ukrsib:reference:${reference}` : null,
    `ukrsib:fallback:${date.toISOString().slice(0, 10)}:${currency}:${Math.abs(amount)}`
  ]
}

export function convertTransaction (apiTransaction, plans) {
  const type = enumValue(apiTransaction.type)
  const status = enumValue(apiTransaction.status)
  const operationType = enumValue(apiTransaction.operationType)
  console.assert(TRANSACTION_TYPES.has(type), 'UKRSIB transaction type is unsupported', {
    transactionId: String(apiTransaction.id),
    transactionType: type
  })
  console.assert(TRANSACTION_STATUSES.has(status), 'UKRSIB transaction status is unsupported', {
    transactionId: String(apiTransaction.id),
    transactionStatus: status
  })
  console.assert(OPERATION_TYPES.has(operationType), 'UKRSIB transaction operation type is unsupported', {
    transactionId: String(apiTransaction.id),
    operationType
  })
  if (status === 'REJECTED') return null

  const { mainAccount, counterpartyAccount } = getMainAndCounterparty(apiTransaction, plans)
  const sign = type === 'EXPENSE' ? -1 : 1
  const mainMovement = createMovement(apiTransaction, mainAccount, sign)
  const isInternalTransfer = INTERNAL_OPERATION_TYPES.has(operationType)
  const isExternalTransfer = EXTERNAL_TRANSFER_TYPES.has(operationType)
  const isCash = CASH_PATTERN.test(normalizeText(apiTransaction.alias) || '')
  const date = toDate(apiTransaction.blockDate || apiTransaction.operationDate || apiTransaction.postDate, 'transaction.operationDate')

  if (isInternalTransfer && counterpartyAccount?.id === mainAccount.id) return null

  const movements = [mainMovement]
  if (isInternalTransfer && counterpartyAccount) {
    movements.push(createCounterpartyMovement(apiTransaction, counterpartyAccount, -sign))
  } else if (isCash) {
    movements.push(createCashMovement(apiTransaction, type, mainMovement))
  } else if (isExternalTransfer || isInternalTransfer) {
    movements.push(createExternalMovement(apiTransaction, type, mainMovement))
  }

  const merchant = isInternalTransfer ? null : createMerchant(apiTransaction, type, isExternalTransfer)
  return {
    date,
    hold: status === 'PROCESSING',
    movements,
    merchant,
    comment: createComment(apiTransaction, merchant, isInternalTransfer),
    ...isInternalTransfer && !counterpartyAccount && { groupKeys: createTransferGroupKeys(apiTransaction) }
  }
}
