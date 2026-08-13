import { uniqBy } from 'lodash'

const REAL_MONEY_MULTIPLIER = 0.01
const KYIV_STANDARD_OFFSET_MINUTES = 2 * 60
const KYIV_DAYLIGHT_OFFSET_MINUTES = 3 * 60
const CURRENT_INCOMING_TYPES = new Set(['IN'])
const CURRENT_OUTGOING_TYPES = new Set(['OUT', 'OUT_CASH'])
const CURRENT_UNSUCCESSFUL_TYPES = new Set(['UNIN', 'UNOUT'])
const LEGACY_TRANSACTION_TYPES = new Set(['TRANSACTIONS', 'HOLDS'])
const NON_FINANCIAL_DEPOSIT_OPERATION_TYPES = new Set([
  'DEPOSIT_PAYMENT_CHANGE_ACCOUNT',
  'INTEREST_PAYMENT',
  'INTEREST_PAYMENT_CHANGE_ACCOUNT',
  'LONGATION',
  'LONGATION_STATUS_CHANGE'
])

function getField (value, camelCaseName, snakeCaseName) {
  return value?.[camelCaseName] ?? value?.[snakeCaseName]
}

function toNonEmptyString (value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function uniqueStrings (values) {
  return [...new Set(values.map(toNonEmptyString).filter(Boolean))]
}

function getMoneyAmount (amount, fieldName, required = true) {
  if (amount == null && !required) {
    return null
  }
  const value = Number(amount)
  console.assert(Number.isFinite(value), 'PUMB money amount is invalid', {
    fieldName,
    actualType: amount == null ? String(amount) : typeof amount
  })
  return +(value * REAL_MONEY_MULTIPLIER).toFixed(2)
}

function getLastSundayOfMonth (year, month) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  return lastDay.getUTCDate() - lastDay.getUTCDay()
}

function getKyivOffsetMinutes ({ year, month, day, hour }) {
  const localTimestamp = Date.UTC(year, month - 1, day, hour)
  const daylightStart = Date.UTC(year, 2, getLastSundayOfMonth(year, 2), 3)
  const daylightEnd = Date.UTC(year, 9, getLastSundayOfMonth(year, 9), 4)
  return localTimestamp >= daylightStart && localTimestamp < daylightEnd
    ? KYIV_DAYLIGHT_OFFSET_MINUTES
    : KYIV_STANDARD_OFFSET_MINUTES
}

function parseDateInKyiv (dateParts) {
  const localTimestamp = Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    dateParts.hour,
    dateParts.minute,
    dateParts.second
  )
  return new Date(localTimestamp - getKyivOffsetMinutes(dateParts) * 60000 + dateParts.millisecond)
}

function parseDateParts (value) {
  if (typeof value !== 'string') {
    return null
  }
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(value)
  const legacyMatch = /^(\d{2})\.(\d{2})\.(\d{4})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/.exec(value)
  const match = isoMatch || legacyMatch
  if (!match) {
    return null
  }
  return {
    year: Number(isoMatch ? match[1] : match[3]),
    month: Number(match[2]),
    day: Number(isoMatch ? match[3] : match[1]),
    hour: Number(match[4] || 0),
    minute: Number(match[5] || 0),
    second: Number(match[6] || 0),
    millisecond: Number((match[7] || '').slice(0, 3).padEnd(3, '0')),
    timezone: match[8] || null
  }
}

function isValidDateParts (dateParts) {
  const date = new Date(Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    dateParts.hour,
    dateParts.minute,
    dateParts.second,
    dateParts.millisecond
  ))
  return date.getUTCFullYear() === dateParts.year &&
    date.getUTCMonth() === dateParts.month - 1 &&
    date.getUTCDate() === dateParts.day &&
    date.getUTCHours() === dateParts.hour &&
    date.getUTCMinutes() === dateParts.minute &&
    date.getUTCSeconds() === dateParts.second
}

function getTimezoneOffsetMinutes (timezone) {
  if (timezone === 'Z') {
    return 0
  }
  const match = /^([+-])(\d{2}):?(\d{2})$/.exec(timezone)
  console.assert(match, 'PUMB date timezone offset is invalid', { timezone })
  const offset = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '+' ? offset : -offset
}

export function parseBankDate (value) {
  const dateParts = parseDateParts(value)
  if (!dateParts || !isValidDateParts(dateParts)) {
    return null
  }
  if (!dateParts.timezone) {
    return parseDateInKyiv(dateParts)
  }
  return new Date(Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    dateParts.hour,
    dateParts.minute,
    dateParts.second,
    dateParts.millisecond
  ) - getTimezoneOffsetMinutes(dateParts.timezone) * 60000)
}

function assertBankDate (value, fieldName, context) {
  const date = parseBankDate(value)
  console.assert(date != null && !Number.isNaN(date.getTime()), 'PUMB date is invalid', {
    fieldName,
    value: typeof value === 'string' ? value : String(value),
    ...context
  })
  return date
}

function getDateInterval (startValue, endValue) {
  const start = parseDateParts(startValue)
  const end = parseDateParts(endValue)
  console.assert(start && end && isValidDateParts(start) && isValidDateParts(end), 'PUMB account interval dates are invalid', {
    startValue: typeof startValue === 'string' ? startValue : String(startValue),
    endValue: typeof endValue === 'string' ? endValue : String(endValue)
  })
  const monthCount = (end.year - start.year) * 12 + end.month - start.month
  if (start.day === end.day && monthCount > 0) {
    return monthCount % 12 === 0
      ? { interval: 'year', count: monthCount / 12 }
      : { interval: 'month', count: monthCount }
  }
  const startDay = Date.UTC(start.year, start.month - 1, start.day)
  const endDay = Date.UTC(end.year, end.month - 1, end.day)
  return { interval: 'day', count: Math.max(1, Math.round((endDay - startDay) / 86400000)) }
}

function subtractCalendarMonths (value, monthCount) {
  const end = parseDateParts(value)
  console.assert(end && isValidDateParts(end), 'PUMB deposit maturity date is invalid', {
    maturityDate: typeof value === 'string' ? value : String(value)
  })
  console.assert(Number.isInteger(monthCount) && monthCount > 0, 'PUMB deposit term is invalid', { monthCount })
  const targetMonthIndex = end.year * 12 + end.month - 1 - monthCount
  const year = Math.floor(targetMonthIndex / 12)
  const month = targetMonthIndex - year * 12 + 1
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const parts = { ...end, year, month, day: Math.min(end.day, lastDay), timezone: null }
  const serialized = `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
  return { date: parseDateInKyiv(parts), serialized }
}

function getCards (apiAccount) {
  return uniqBy(Array.isArray(apiAccount.cards) ? apiAccount.cards : [], card => getField(card, 'number', 'number'))
}

function getAccountNaturalSyncIds (apiAccount, cards) {
  return uniqueStrings([
    apiAccount.iban,
    apiAccount.number,
    ...cards.map(card => card.number)
  ])
}

function getAccountTitle (apiAccount, cards) {
  const cardNumber = cards.map(card => toNonEmptyString(card.number)).find(Boolean)
  const naturalNumber = cardNumber || toNonEmptyString(apiAccount.iban) || toNonEmptyString(apiAccount.number)
  if (naturalNumber) {
    return `*${naturalNumber.slice(-4)}`
  }
  return 'Рахунок ПУМБ'
}

function getAccountType (apiAccount, cards) {
  const bankType = String(apiAccount.type || '').toUpperCase()
  return cards.length > 0 || bankType.includes('CARD_ACCOUNT') ? 'ccard' : 'checking'
}

function convertBankAccount (apiAccount) {
  console.assert(apiAccount?.id != null, 'PUMB account ID is missing', {
    hasIban: Boolean(apiAccount?.iban),
    type: apiAccount?.type || null
  })
  const cards = getCards(apiAccount)
  const creditInfo = getField(apiAccount, 'creditInfo', 'credit_info')
  const overdraftInfo = getField(apiAccount, 'overdraftInfo', 'overdraft_info')
  const currencyCode = getField(apiAccount, 'currencyCode', 'currency_code')
  console.assert(typeof currencyCode === 'string' && currencyCode, 'PUMB account currency is missing', {
    accountId: String(apiAccount.id),
    accountType: apiAccount.type || null
  })
  const overdraftFlag = getField(apiAccount, 'overdraftFlag', 'overdraft_flag')
  const paymentDueDate = getField(creditInfo, 'paymentDueDate', 'payment_due_date')
  const dueDate = paymentDueDate == null ? null : assertBankDate(paymentDueDate, 'paymentDueDate', { accountId: String(apiAccount.id) })
  const account = {
    id: `account:${apiAccount.id}`,
    type: getAccountType(apiAccount, cards),
    title: getAccountTitle(apiAccount, cards),
    instrument: currencyCode,
    syncIds: [],
    balance: getMoneyAmount(apiAccount.balance, 'account.balance'),
    ...creditInfo && {
      balance: getMoneyAmount(getField(creditInfo, 'ownMoney', 'own_money'), 'creditInfo.ownMoney') -
        getMoneyAmount(getField(creditInfo, 'useAmount', 'use_amount'), 'creditInfo.useAmount'),
      creditLimit: getMoneyAmount(getField(creditInfo, 'totalCreditLimit', 'total_credit_limit'), 'creditInfo.totalCreditLimit')
    },
    ...overdraftFlag && {
      balance: getMoneyAmount(getField(overdraftInfo, 'ownMoney', 'own_money'), 'overdraftInfo.ownMoney') -
        getMoneyAmount(getField(overdraftInfo, 'useAmount', 'use_amount'), 'overdraftInfo.useAmount'),
      creditLimit: getMoneyAmount(overdraftInfo?.amount, 'overdraftInfo.amount')
    },
    ...dueDate && creditInfo && {
      totalAmountDue: getMoneyAmount(getField(creditInfo, 'useAmount', 'use_amount'), 'creditInfo.useAmount'),
      gracePeriodEndDate: dueDate
    }
  }
  return {
    account,
    naturalSyncIds: getAccountNaturalSyncIds(apiAccount, cards),
    fallbackSyncId: `pumb-account:${apiAccount.id}`,
    fetchParams: {
      sources: [{ type: 'account', accountIds: [apiAccount.id] }]
    }
  }
}

function getDepositIdentity (apiDeposit) {
  const id = getField(apiDeposit, 'id', 'deposit_id') ?? apiDeposit.depositId
  console.assert(id != null, 'PUMB deposit ID is missing', {
    archived: apiDeposit?.archived === true,
    typename: apiDeposit?.__typename || null
  })
  return id
}

function getDepositStart (apiDeposit, maturityValue) {
  const openDate = getField(apiDeposit, 'openDate', 'open_date')
  if (openDate) {
    return { date: assertBankDate(openDate, 'deposit.openDate', { depositId: String(getDepositIdentity(apiDeposit)) }), serialized: openDate }
  }
  const termMonths = Number(getField(apiDeposit, 'termMonths', 'term_months'))
  return subtractCalendarMonths(maturityValue, termMonths)
}

function getDepositPayoffInterval (apiDeposit) {
  const period = getField(apiDeposit, 'interestPaymentPeriod', 'interest_payment_period')
  if (period == null || apiDeposit.archived === true) {
    return null
  }
  const normalized = String(period).toUpperCase()
  if (['M', 'MONTH', 'MONTHLY'].includes(normalized)) {
    return 'month'
  }
  if (['AT_END', 'END', 'MATURITY'].includes(normalized)) {
    return null
  }
  console.assert(false, 'PUMB deposit interest payment period is unsupported', {
    depositId: String(getDepositIdentity(apiDeposit)),
    period: normalized
  })
}

function convertDeposit (apiDeposit) {
  const id = getDepositIdentity(apiDeposit)
  const maturityValue = getField(apiDeposit, 'maturityDate', 'maturity_date')
  assertBankDate(maturityValue, 'deposit.maturityDate', { depositId: String(id) })
  const start = getDepositStart(apiDeposit, maturityValue)
  const interval = getDateInterval(start.serialized, maturityValue)
  const balanceValue = apiDeposit.archived === true
    ? getField(apiDeposit, 'lastBalance', 'last_balance')
    : apiDeposit.balance
  const balance = getMoneyAmount(balanceValue, 'deposit.balance')
  const title = getField(apiDeposit, 'displayName', 'display_name') ||
    getField(apiDeposit, 'programName', 'program_name') ||
    getField(apiDeposit, 'productName', 'product_name')
  const currency = getField(apiDeposit, 'currencyCode', 'currency_code')
  console.assert(typeof title === 'string' && title, 'PUMB deposit title is missing', { depositId: String(id) })
  console.assert(typeof currency === 'string' && currency, 'PUMB deposit currency is missing', { depositId: String(id) })
  const interestRate = getField(apiDeposit, 'interestRate', 'interest_rate')
  return {
    account: {
      id: `deposit:${id}`,
      type: 'deposit',
      title,
      instrument: currency,
      syncIds: [],
      balance,
      startBalance: balance,
      capitalization: getField(apiDeposit, 'capitalizationFlag', 'capitalization_flag') !== false,
      percent: interestRate == null ? null : getMoneyAmount(interestRate, 'deposit.interestRate'),
      startDate: start.date,
      endDateOffsetInterval: interval.interval,
      endDateOffset: interval.count,
      payoffInterval: getDepositPayoffInterval(apiDeposit),
      payoffStep: 1,
      ...apiDeposit.archived === true && { archived: true }
    },
    naturalSyncIds: uniqueStrings([
      getField(apiDeposit, 'agreementNumber', 'agreement_number'),
      getField(apiDeposit, 'interestIban', 'interest_iban'),
      getField(apiDeposit, 'returnIban', 'return_iban')
    ]),
    // The previous plugin version used the active deposit ID as its only sync ID.
    compatibilitySyncIds: apiDeposit.archived === true ? [] : [String(id)],
    fallbackSyncId: `pumb-deposit:${id}`,
    fetchParams: { sources: [{ type: 'deposit', depositId: id }] }
  }
}

function convertLoan (apiLoan) {
  const id = getField(apiLoan, 'loanId', 'id') ?? getField(apiLoan, 'writtenOffLoanId', 'written_off_loan_id')
  console.assert(id != null, 'PUMB loan ID is missing', {
    typename: apiLoan?.__typename || null,
    loanStatus: apiLoan?.loanStatus || null
  })
  const startValue = getField(apiLoan, 'openDate', 'open_date')
  const actualCloseValue = getField(apiLoan, 'actualCloseDate', 'actual_close_date')
  const contractualCloseValue = getField(apiLoan, 'closeDate', 'close_date')
  const endValue = actualCloseValue || contractualCloseValue
  const startDate = assertBankDate(startValue, 'loan.openDate', { loanId: String(id) })
  assertBankDate(endValue, 'loan.closeDate', { loanId: String(id) })
  const interval = getDateInterval(startValue, endValue)
  const interestRate = getField(apiLoan, 'interestRate', 'interest_rate')
  const nextPaymentDate = getField(apiLoan, 'nextPaymentDate', 'next_payment_date')
  const archived = apiLoan.__typename === 'WrittenOffLoanInfo' ||
    apiLoan.isRefunded === true ||
    String(apiLoan.loanStatus || '').toUpperCase() === 'CLOSED' ||
    Boolean(actualCloseValue)
  const linkedAccount = getField(apiLoan, 'linkedAccountInfo', 'linked_account_info')
  const title = getField(apiLoan, 'productName', 'program_name')
  const currency = getField(apiLoan, 'currencyCode', 'currency_code')
  console.assert(typeof title === 'string' && title, 'PUMB loan title is missing', { loanId: String(id) })
  console.assert(typeof currency === 'string' && currency, 'PUMB loan currency is missing', { loanId: String(id) })
  const outstandingAmount = Math.abs(getMoneyAmount(
    getField(apiLoan, 'totalPaymentAmount', 'total_payment_amount'),
    'loan.totalPaymentAmount'
  ))
  return {
    account: {
      id: `loan:${id}`,
      type: 'loan',
      startBalance: getMoneyAmount(getField(apiLoan, 'agreementAmount', 'agreement_amount'), 'loan.agreementAmount'),
      title,
      instrument: currency,
      syncIds: [],
      balance: outstandingAmount === 0 ? 0 : -outstandingAmount,
      capitalization: true,
      startDate,
      percent: interestRate == null ? null : getMoneyAmount(interestRate, 'loan.interestRate'),
      endDateOffsetInterval: interval.interval,
      endDateOffset: interval.count,
      payoffInterval: nextPaymentDate && !archived ? 'month' : null,
      payoffStep: 1,
      ...archived && { archived: true }
    },
    naturalSyncIds: uniqueStrings([
      getField(apiLoan, 'agreementNumber', 'agreement_number'),
      getField(apiLoan, 'transitIban', 'transit_iban'),
      linkedAccount?.iban,
      linkedAccount?.number
    ]),
    // Refunded and written-off loans were omitted by the previous plugin version.
    compatibilitySyncIds: apiLoan.__typename === 'WrittenOffLoanInfo' || apiLoan.isRefunded === true
      ? []
      : [String(id)],
    fallbackSyncId: `pumb-loan:${id}`,
    fetchParams: { sources: [{ type: 'loan', loanId: id }] }
  }
}

function getRawAccountKey (apiAccount, index) {
  if (apiAccount.id != null) return `id:${apiAccount.id}`
  if (apiAccount.iban) return `iban:${apiAccount.iban}`
  if (apiAccount.number) return `number:${apiAccount.number}`
  console.assert(false, 'PUMB account has no stable identity', { index, type: apiAccount?.type || null })
}

function mergeApiAccounts (apiAccounts) {
  const merged = new Map()
  apiAccounts.forEach((apiAccount, index) => {
    const key = getRawAccountKey(apiAccount, index)
    const previous = merged.get(key)
    if (!previous) {
      merged.set(key, { ...apiAccount, cards: [...(Array.isArray(apiAccount.cards) ? apiAccount.cards : [])] })
      return
    }
    merged.set(key, {
      ...previous,
      ...apiAccount,
      cards: uniqBy([
        ...(Array.isArray(previous.cards) ? previous.cards : []),
        ...(Array.isArray(apiAccount.cards) ? apiAccount.cards : [])
      ], card => card.id ?? card.number)
    })
  })
  return [...merged.values()]
}

function assignSyncIds (links) {
  const identifierCounts = new Map()
  for (const link of links) {
    for (const syncId of [...link.naturalSyncIds, ...(link.compatibilitySyncIds || [])]) {
      identifierCounts.set(syncId, (identifierCounts.get(syncId) || 0) + 1)
    }
  }
  for (const link of links) {
    const uniqueNaturalIds = link.naturalSyncIds.filter(syncId => identifierCounts.get(syncId) === 1)
    const compatibilityIds = (link.compatibilitySyncIds || [])
      .filter(syncId => identifierCounts.get(syncId) === 1 && !uniqueNaturalIds.includes(syncId))
    link.account.syncIds = uniqueNaturalIds.length > 0
      ? [...uniqueNaturalIds, ...compatibilityIds]
      : compatibilityIds.length > 0
        ? compatibilityIds
        : [link.fallbackSyncId]
    delete link.naturalSyncIds
    delete link.compatibilitySyncIds
    delete link.fallbackSyncId
  }
  return links
}

function groupBankAccountLinks (bankAccountLinks) {
  if (bankAccountLinks.length <= 1) {
    return bankAccountLinks
  }
  return [{
    accounts: bankAccountLinks.map(link => link.account),
    fetchParams: {
      sources: [{
        type: 'account',
        accountIds: bankAccountLinks.flatMap(link => link.fetchParams.sources[0].accountIds)
      }]
    }
  }]
}

export function convertAccounts (apiProducts) {
  console.assert(Array.isArray(apiProducts?.accounts), 'PUMB account graph is missing accounts', {
    accountsType: apiProducts?.accounts == null ? String(apiProducts?.accounts) : typeof apiProducts.accounts
  })
  console.assert(Array.isArray(apiProducts?.deposits), 'PUMB account graph is missing deposits', {
    depositsType: apiProducts?.deposits == null ? String(apiProducts?.deposits) : typeof apiProducts.deposits
  })
  console.assert(Array.isArray(apiProducts?.loans), 'PUMB account graph is missing loans', {
    loansType: apiProducts?.loans == null ? String(apiProducts?.loans) : typeof apiProducts.loans
  })
  const bankAccountLinks = mergeApiAccounts(apiProducts.accounts).map(convertBankAccount)
  const otherLinks = [
    ...apiProducts.deposits.map(convertDeposit),
    ...apiProducts.loans.map(convertLoan)
  ]
  assignSyncIds([...bankAccountLinks, ...otherLinks])
  return [...groupBankAccountLinks(bankAccountLinks), ...otherLinks]
}

function getLinkedAccounts (link) {
  return Array.isArray(link.accounts) ? link.accounts : [link.account]
}

function getTransactionAccount (apiTransaction, link) {
  const accounts = getLinkedAccounts(link)
  if (accounts.length === 1) {
    return accounts[0]
  }
  const bankAccountId = apiTransaction.account_id?.toString()
  const direct = accounts.find(account => account.id === `account:${bankAccountId}`)
  const currency = apiTransaction.transaction_details?.account_amount?.currency_code
  return direct || accounts.find(account => account.instrument === currency) || null
}

function getCommission (apiTransaction) {
  const value = apiTransaction.transaction_details?.commission_amount?.value
  if (value == null) {
    return 0
  }
  const amount = getMoneyAmount(value, 'transaction.commissionAmount')
  return amount === 0 ? 0 : -Math.abs(amount)
}

function normalizeText (value) {
  return typeof value === 'string' ? value.replace(/^\. \./, '').replace(/\s+/g, ' ').trim() : ''
}

function getTransactionText (apiTransaction) {
  return [apiTransaction.title, apiTransaction.description, apiTransaction.transaction_details?.comment]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ')
}

function parseMcc (apiTransaction) {
  const code = toNonEmptyString(apiTransaction.merchant_category_data?.code)
  return code && /^\d{4}$/.test(code) ? Number(code) : null
}

function setMerchantAndComment (transaction, apiTransaction) {
  const title = normalizeText(apiTransaction.title)
  const detailsComment = normalizeText(apiTransaction.transaction_details?.comment)
  const description = normalizeText(apiTransaction.description)
  const mcc = parseMcc(apiTransaction)
  const categoryCode = toNonEmptyString(apiTransaction.merchant_category_data?.code)
  const slashParts = title.split(/\s*\/{1,2}\s*/).filter(Boolean)
  const country = slashParts.length >= 3 && /^[A-Z]{2}$/.test(slashParts[slashParts.length - 1])
    ? slashParts[slashParts.length - 1]
    : null
  transaction.merchant = title
    ? country
      ? {
          title: slashParts.slice(0, -2).join(' / '),
          city: slashParts[slashParts.length - 2],
          country,
          mcc,
          location: null,
          ...(mcc == null && categoryCode ? { category: categoryCode } : {})
        }
      : {
          fullTitle: title,
          mcc,
          location: null,
          ...(mcc == null && categoryCode ? { category: categoryCode } : {})
        }
    : null
  const comment = detailsComment || (description && description !== title ? description : '')
  transaction.comment = comment || null
}

function getTransferReference (apiTransaction) {
  const details = apiTransaction.transaction_details || {}
  const reference = details.source_system_transaction_ref ??
    details.operation_id ??
    details.operationId ??
    details.transaction_ref ??
    details.transactionRef ??
    apiTransaction.source_system_ref ??
    apiTransaction.external_transaction_id ??
    apiTransaction.externalTransactionId
  return reference == null ? null : String(reference)
}

function getDateKey (date) {
  const standardLocal = new Date(date.getTime() + KYIV_STANDARD_OFFSET_MINUTES * 60000)
  const localDateParts = {
    year: standardLocal.getUTCFullYear(),
    month: standardLocal.getUTCMonth() + 1,
    day: standardLocal.getUTCDate(),
    hour: standardLocal.getUTCHours()
  }
  const offset = getKyivOffsetMinutes(localDateParts)
  const local = new Date(date.getTime() + offset * 60000)
  return `${local.getUTCFullYear()}-${String(local.getUTCMonth() + 1).padStart(2, '0')}-${String(local.getUTCDate()).padStart(2, '0')}`
}

function getTransferFallbackKey (date, invoice) {
  return `${getDateKey(date)}_${invoice.instrument}_${Math.abs(invoice.sum)}`
}

function parseInnerTransfer (transaction, apiTransaction, invoice) {
  if (!/(?:Переказ між своїми|Перевод между своими|Погашення.*кредит|Погашение.*кредит|Сплата.*кредит)/i.test(getTransactionText(apiTransaction))) {
    return false
  }
  transaction.comment = null
  transaction.merchant = null
  transaction.groupKeys = [
    getTransferReference(apiTransaction),
    getTransferFallbackKey(transaction.date, invoice)
  ]
  return true
}

function parseCashTransfer (transaction, apiTransaction, invoice) {
  if (String(apiTransaction.transaction_type).toUpperCase() !== 'OUT_CASH' && ![
    /сервис cash to card/i,
    /Выдача наличности/i,
    /Внесення готівки/i,
    /Внесение наличных денежных/i
  ].some(regexp => regexp.test(getTransactionText(apiTransaction)))) {
    return false
  }
  transaction.merchant = null
  transaction.movements.push({
    id: null,
    account: { type: 'cash', instrument: invoice.instrument, company: null, syncIds: null },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseOuterTransfer (transaction, apiTransaction, invoice) {
  const text = getTransactionText(apiTransaction)
  if (![
    /(?:Перевод|Переказ)/i,
    /Money Transfer/i,
    /TFR DEBIT/i,
    /ACCOUNT.*TO/i,
    /Master Card Money Send/i
  ].some(regexp => regexp.test(text))) {
    return false
  }
  transaction.merchant = null
  const cardMatch = /CARD\*(\d{4})/i.exec(text)
  transaction.movements.push({
    id: null,
    account: {
      type: /(?:по карте|card)/i.test(text) ? 'ccard' : null,
      instrument: invoice.instrument,
      company: null,
      syncIds: cardMatch ? [cardMatch[1]] : null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function applyDirection (value, transactionType) {
  const normalizedType = String(transactionType).toUpperCase()
  if (CURRENT_INCOMING_TYPES.has(normalizedType)) {
    return Math.abs(value)
  }
  if (CURRENT_OUTGOING_TYPES.has(normalizedType)) {
    return -Math.abs(value)
  }
  if (LEGACY_TRANSACTION_TYPES.has(normalizedType)) {
    return value
  }
  console.assert(false, 'PUMB transaction type is unsupported', { transactionType: normalizedType })
}

function convertAccountTransaction (apiTransaction, link) {
  const transactionType = String(apiTransaction.transaction_type).toUpperCase()
  if (CURRENT_UNSUCCESSFUL_TYPES.has(transactionType)) {
    console.info('Skipping a PUMB transaction explicitly marked as unsuccessful', {
      transactionType,
      sourceSystemId: apiTransaction.source_system_id == null ? null : String(apiTransaction.source_system_id),
      accountId: apiTransaction.account_id == null ? null : String(apiTransaction.account_id)
    })
    return null
  }
  console.assert(
    CURRENT_INCOMING_TYPES.has(transactionType) || CURRENT_OUTGOING_TYPES.has(transactionType) || LEGACY_TRANSACTION_TYPES.has(transactionType),
    'PUMB transaction type is unsupported',
    { transactionType }
  )
  const amount = apiTransaction.transaction_amount
  const accountAmount = apiTransaction.transaction_details?.account_amount || amount
  console.assert(amount?.value != null && accountAmount?.value != null, 'PUMB transaction amount is missing', {
    transactionType,
    sourceSystemId: apiTransaction.source_system_id == null ? null : String(apiTransaction.source_system_id),
    hasTransactionAmount: amount?.value != null,
    hasAccountAmount: accountAmount?.value != null
  })
  const account = getTransactionAccount(apiTransaction, link)
  console.assert(account != null, 'PUMB transaction account could not be resolved', {
    bankAccountId: apiTransaction.account_id == null ? null : String(apiTransaction.account_id),
    linkedAccountIds: getLinkedAccounts(link).map(item => item.id)
  })
  const invoiceInstrument = amount.currency_code
  const accountInstrument = accountAmount.currency_code
  console.assert(typeof invoiceInstrument === 'string' && invoiceInstrument, 'PUMB transaction currency is missing', {
    amountType: 'transactionAmount',
    transactionType
  })
  console.assert(typeof accountInstrument === 'string' && accountInstrument, 'PUMB account transaction currency is missing', {
    amountType: 'accountAmount',
    transactionType
  })
  const invoice = {
    sum: applyDirection(getMoneyAmount(amount.value, 'transaction.transactionAmount'), transactionType),
    instrument: invoiceInstrument
  }
  const accountSum = applyDirection(getMoneyAmount(accountAmount.value, 'transaction.accountAmount'), transactionType)
  console.assert(invoice.sum !== 0 || accountSum !== 0, 'PUMB returned a zero-value booked transaction', {
    transactionType,
    sourceSystemId: apiTransaction.source_system_id == null ? null : String(apiTransaction.source_system_id)
  })
  const date = parseTransactionDate(apiTransaction)
  console.assert(date != null, 'PUMB transaction date is invalid', {
    orderDate: getField(apiTransaction, 'orderDate', 'order_date') || null,
    transactionDate: getField(apiTransaction.transaction_details, 'transactionDate', 'transaction_date') || null,
    transactionType
  })
  const movementId = apiTransaction.source_system_ref ?? apiTransaction.source_system_id
  const transaction = {
    hold: transactionType === 'HOLDS' || (!LEGACY_TRANSACTION_TYPES.has(transactionType) && apiTransaction.transaction_details == null),
    date,
    movements: [{
      id: movementId == null ? null : String(movementId),
      account: { id: account.id },
      invoice: invoice.instrument === account.instrument ? null : invoice,
      sum: accountSum,
      fee: getCommission(apiTransaction)
    }],
    merchant: null,
    comment: null
  }
  setMerchantAndComment(transaction, apiTransaction)
  ;[
    parseInnerTransfer,
    parseCashTransfer,
    parseOuterTransfer
  ].some(parser => parser(transaction, apiTransaction, invoice))
  return transaction
}

function getDepositTransactionDate (apiOperation) {
  return assertBankDate(apiOperation.processedDate || apiOperation.operationDate, 'depositOperation.date', {
    operationId: apiOperation.operationId == null ? null : String(apiOperation.operationId),
    operationType: apiOperation.operationType || null
  })
}

function convertDepositTransaction (apiOperation, link) {
  const operationType = String(apiOperation.operationType || '').toUpperCase()
  const balanceBefore = getMoneyAmount(apiOperation.balanceBefore, 'depositOperation.balanceBefore')
  const balanceAfter = getMoneyAmount(apiOperation.balanceAfter, 'depositOperation.balanceAfter')
  const sum = +(balanceAfter - balanceBefore).toFixed(2)
  if (sum === 0 && NON_FINANCIAL_DEPOSIT_OPERATION_TYPES.has(operationType)) {
    console.info('Skipping a non-financial PUMB deposit operation', {
      operationType,
      operationId: apiOperation.operationId == null ? null : String(apiOperation.operationId)
    })
    return null
  }
  console.assert(sum !== 0, 'PUMB deposit operation did not change the deposit balance', {
    operationType,
    operationId: apiOperation.operationId == null ? null : String(apiOperation.operationId),
    amount: apiOperation.amount
  })
  const account = getLinkedAccounts(link)[0]
  console.assert(account?.type === 'deposit', 'PUMB deposit operation is linked to a non-deposit account', {
    accountId: account?.id || null,
    accountType: account?.type || null
  })
  const date = getDepositTransactionDate(apiOperation)
  const operationId = apiOperation.operationId == null ? null : String(apiOperation.operationId)
  const transaction = {
    hold: false,
    date,
    movements: [{
      id: operationId,
      account: { id: account.id },
      invoice: null,
      sum,
      fee: 0
    }],
    merchant: null,
    comment: normalizeText(apiOperation.description) || null
  }
  if (apiOperation.debetIban || apiOperation.creditIban) {
    transaction.groupKeys = [
      operationId,
      getTransferFallbackKey(date, { instrument: account.instrument, sum })
    ]
  }
  return transaction
}

function convertLoanTransaction (apiOperation, loanId, link) {
  console.assert(typeof apiOperation.isRepaid === 'boolean', 'PUMB loan operation repayment status is missing', {
    loanId: String(loanId),
    operationDate: apiOperation.operationDate || null
  })
  if (!apiOperation.isRepaid) {
    console.info('Skipping a future PUMB loan schedule item', {
      loanId: String(loanId),
      operationDate: apiOperation.operationDate || null
    })
    return null
  }
  const account = getLinkedAccounts(link)[0]
  console.assert(account?.type === 'loan', 'PUMB loan operation is linked to a non-loan account', {
    accountId: account?.id || null,
    accountType: account?.type || null
  })
  const paymentAmount = getMoneyAmount(apiOperation.paymentAmount, 'loanOperation.paymentAmount')
  console.assert(paymentAmount > 0, 'PUMB repaid loan operation amount is invalid', {
    loanId: String(loanId),
    operationDate: apiOperation.operationDate || null,
    paymentAmount
  })
  const date = assertBankDate(apiOperation.operationDate, 'loanOperation.operationDate', {
    loanId: String(loanId)
  })
  const movementId = [
    loanId,
    apiOperation.operationDate,
    apiOperation.termPeriodFrom || '',
    apiOperation.termPeriodTo || '',
    apiOperation.paymentAmount
  ].join(':')
  return {
    hold: false,
    date,
    movements: [{
      id: movementId,
      account: { id: account.id },
      invoice: null,
      sum: paymentAmount,
      fee: 0
    }],
    merchant: null,
    comment: null,
    groupKeys: [
      null,
      getTransferFallbackKey(date, { instrument: account.instrument, sum: paymentAmount })
    ]
  }
}

export function convertTransaction (apiTransaction, link) {
  if (apiTransaction?.type === 'account') {
    return convertAccountTransaction(apiTransaction.data, link)
  }
  if (apiTransaction?.type === 'deposit') {
    return convertDepositTransaction(apiTransaction.data, link)
  }
  if (apiTransaction?.type === 'loan') {
    return convertLoanTransaction(apiTransaction.data, apiTransaction.loanId, link)
  }
  return convertAccountTransaction(apiTransaction, link?.fetchParams ? link : { account: link, fetchParams: { sources: [] } })
}

export function parseTransactionDate (apiTransaction) {
  return parseBankDate(getField(apiTransaction, 'orderDate', 'order_date')) ||
    parseBankDate(getField(apiTransaction.transaction_details, 'transactionDate', 'transaction_date'))
}
