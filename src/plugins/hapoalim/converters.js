import { flatten, isEqual } from 'lodash'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { trimSyncId } from '../../common/accounts'
import { SHA256 } from 'jshashes'

export function convertAccounts (apiAccounts) {
  ensure(Array.isArray(apiAccounts), 'unexpected accounts graph')
  const accounts = []
  for (const apiAccount of apiAccounts) {
    ensure(apiAccount && typeof apiAccount === 'object' && !Array.isArray(apiAccount), 'unexpected account record')
    let account
    switch (apiAccount.structType) {
      case 'checking':
        account = convertCurrentAccount(apiAccount)
        break
      case 'deposit':
      case 'saving':
        account = convertDeposit(apiAccount)
        break
      case 'foreignCurrencyAccount':
        account = convertForeignCurrencyAccount(apiAccount)
        break
      case 'loan':
        account = convertLoan(apiAccount)
        break
      case 'mortgage':
        account = convertMortgage(apiAccount)
        break
      default:
        throw new Error('unexpected account type')
    }
    if (account) {
      accounts.push(...flatten([account]).map((plan, index) => ({
        plan,
        record: apiAccount.structType === 'foreignCurrencyAccount' ? apiAccount.balancesAndLimitsDataList[index] : apiAccount,
        sourceAccountId: apiAccount.sourceAccountId ?? apiAccount.mainProductId ?? null,
        ...['deposit', 'saving'].includes(apiAccount.structType) && apiAccount.sourceAccountId !== undefined
          ? { depositLegacyId: plan.account.syncID[0] }
          : {},
        structType: apiAccount.structType
      })))
    }
  }
  const deposits = accounts.filter(source => ['deposit', 'saving'].includes(source.structType))
  ensure(deposits.every(source => source.depositLegacyId === undefined) || deposits.every(source => source.depositLegacyId !== undefined),
    'unexpected account identity', { field: 'sourceAccountId' })
  const unique = new Map()
  for (const source of accounts) {
    const previous = unique.get(source.plan.account.id)
    ensure(!previous || isEqual(previous, source), 'conflicting account identity', { structType: source.structType, field: 'id', sources: 2 })
    if (!previous) unique.set(source.plan.account.id, source)
  }
  const sources = [...unique.values()]
  const suffixCounts = new Map()
  for (const source of sources) {
    const ids = source.plan.account.syncID ?? source.plan.account.syncIds
    const legacyIds = source.depositLegacyId === undefined ? ids : [source.depositLegacyId]
    for (const suffix of new Set(legacyIds.map(id => id.length < 4 ? id : trimSyncId(id)))) {
      const key = `${source.plan.account.instrument}:${suffix}`
      suffixCounts.set(key, (suffixCounts.get(key) || 0) + 1)
    }
  }
  return sources.map(source => {
    if (source.depositLegacyId !== undefined) {
      const suffix = source.depositLegacyId.slice(-4)
      // Preserve previously trimmed matching keys only when the full legacy
      // graph proves they cannot identify another balance.
      if (suffixCounts.get(`${source.plan.account.instrument}:${suffix}`) === 1) {
        source.plan.account.syncID = [...new Set([...source.plan.account.syncID, suffix])]
      }
    }
    return source.plan
  })
}

function ensure (condition, message, context) {
  if (!condition) {
    const error = new Error(message)
    if (context) error.context = context
    throw error
  }
}

function requireIdentity (value, field) {
  ensure((Number.isSafeInteger(value) && value > 0) || (typeof value === 'string' && /^\d+$/.test(value) && !/^0+$/.test(value)),
    'unexpected account identity', { field })
  return String(value)
}

function requireAmount (amount, field = 'amount', structType) {
  ensure(Number.isFinite(amount), 'unexpected account amount', { field, ...structType ? { structType } : {} })
  return amount
}

function nullableAmount (amount, field, structType) {
  return amount === null ? null : requireAmount(amount, field, structType)
}

function requirePrincipal (amount, field, structType) {
  requireAmount(amount, field, structType)
  ensure(amount > 0, 'unexpected account principal', { field, structType })
  return amount
}

function requireDebtBalance (amount, field, structType) {
  requireNonnegativeBalance(amount, field, structType)
  return amount === 0 ? 0 : -amount
}

function requireNonnegativeBalance (amount, field, structType) {
  requireAmount(amount, field, structType)
  ensure(amount >= 0, 'unexpected account balance', { field, structType })
  return amount
}

function getAccountTitle (values, fallback) {
  return values.find(value => typeof value === 'string' && value.trim().length > 0)?.trim() || fallback
}

function convertMortgage (apiAccount) {
  ensure(Array.isArray(apiAccount.subLoanData) && apiAccount.subLoanData.length > 0 && apiAccount.subLoanData.length === apiAccount.subLoansCounter,
    'unexpected mortgage parts')
  const partIds = new Set()
  const plans = apiAccount.subLoanData.map(subLoan => {
    ensure(subLoan && typeof subLoan === 'object' && !Array.isArray(subLoan), 'unexpected mortgage part')
    const id = `${requireIdentity(apiAccount.mortgageLoanSerialId, 'mortgageLoanSerialId')}-${requireIdentity(subLoan.subLoansSerialId, 'subLoansSerialId')}`
    ensure(!partIds.has(id), 'conflicting mortgage part identity', { structType: 'mortgage', field: 'subLoanData.subLoansSerialId' })
    partIds.add(id)
    const startDate = parseDateTime(subLoan.formattedStartDate, 'formattedStartDate', 'mortgage')
    const endDate = parseDateTime(subLoan.formattedEndDate, 'formattedEndDate', 'mortgage')
    const { interval, count } = getIntervalBetweenDates(startDate, endDate)
    return {
      mainProduct: null,
      account: {
        id,
        type: 'loan',
        title: getAccountTitle([apiAccount.productLabel], 'משכנתא'),
        instrument: 'ILS',
        syncIds: [id],
        balance: requireDebtBalance(subLoan.revaluedBalance, 'revaluedBalance', 'mortgage'),
        startDate,
        startBalance: requirePrincipal(subLoan.subLoansPrincipalAmount, 'subLoansPrincipalAmount', 'mortgage'),
        capitalization: true,
        percent: nullableAmount(subLoan.validityInterestRate, 'validityInterestRate', 'mortgage'),
        endDateOffsetInterval: interval,
        endDateOffset: count,
        payoffInterval: 'month',
        payoffStep: 1
      }
    }
  })
  if (apiAccount.revaluedBalance != null) {
    const parent = requireNonnegativeBalance(apiAccount.revaluedBalance, 'revaluedBalance', 'mortgage')
    const total = plans.reduce((sum, plan) => sum - plan.account.balance, 0)
    ensure(Math.abs(total - parent) < 0.005, 'unexpected mortgage parts', { structType: 'mortgage', field: 'revaluedBalance' })
  }
  return plans
}

function convertLoan (apiAccount) {
  ensure(apiAccount.creditCurrencyCode === 1, 'unexpected loan currency')
  ensure(apiAccount.details && typeof apiAccount.details === 'object' && !Array.isArray(apiAccount.details), 'unexpected loan details', { structType: 'loan', field: 'details' })
  const id = getLoanId(apiAccount)
  const startDate = parseDateTime(apiAccount.details.formattedValueDate, 'formattedValueDate', 'loan')
  const endDate = parseDateTime(apiAccount.details.formattedLoanEndDate, 'formattedLoanEndDate', 'loan')
  const { interval, count } = getIntervalBetweenDates(startDate, endDate)

  return {
    mainProduct: null,
    account: {
      id,
      type: 'loan',
      title: getAccountTitle([apiAccount.productNickName], 'אַשׁרַאי'),
      instrument: 'ILS',
      syncIds: [id],
      balance: requireDebtBalance(apiAccount.debtAmount, 'debtAmount', 'loan'),
      startDate,
      startBalance: requirePrincipal(apiAccount.originalLoanPrincipalAmount, 'originalLoanPrincipalAmount', 'loan'),
      capitalization: true,
      percent: nullableAmount(apiAccount.interestRate, 'interestRate', 'loan'),
      endDateOffsetInterval: interval,
      endDateOffset: count,
      payoffInterval: 'month',
      payoffStep: 1
    }
  }
}

function getLoanId (apiAccount) {
  return `${requireIdentity(apiAccount.creditSerialNumber, 'creditSerialNumber')}-${requireIdentity(apiAccount.unitedCreditTypeCode, 'unitedCreditTypeCode')}`
}

function convertCurrentAccount (apiAccount) {
  const id = `${requireIdentity(apiAccount.bankNumber, 'bankNumber')}-${requireIdentity(apiAccount.branchNumber, 'branchNumber')}-${requireIdentity(apiAccount.accountNumber, 'accountNumber')}`
  return {
    mainProduct: {
      id,
      type: 'account'
    },
    account: {
      id,
      type: 'checking',
      title: `*${apiAccount.accountNumber.toString().slice(-4)} חשבון נוכחי`,
      instrument: 'ILS',
      syncID: [
        id
      ],
      balance: nullableAmount(apiAccount.details?.currentBalance, 'currentBalance', 'checking'),
      creditLimit: nullableAmount(apiAccount.details?.currentAccountCreditFrame, 'currentAccountCreditFrame', 'checking')
    }
  }
}

function isDepositInterestPaidAtEnd (description) {
  if (typeof description !== 'string') return false
  const normalized = description.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '').trim().replace(/\s+/g, ' ')
  return normalized === '\u05e1\u05d5\u05e3 \u05e4\u05d9\u05e7\u05d3\u05d5\u05df' || normalized === '1 \u05e1\u05d5\u05e3 \u05e4\u05d9\u05e7\u05d3\u05d5\u05df'
}

function convertDeposit (apiAccount) {
  const legacyId = requireIdentity(apiAccount.depositSerialId ?? apiAccount.agreementOpeningDate, 'depositSerialId/agreementOpeningDate')
  const parent = apiAccount.sourceAccountId
  if (parent !== undefined) {
    ensure(typeof parent === 'string' && /^\d+-\d+-\d+$/.test(parent), 'unexpected account identity', { field: 'sourceAccountId' })
    parent.split('-').forEach(part => requireIdentity(part, 'sourceAccountId'))
  }
  const id = parent === undefined ? legacyId : `hapoalim-deposit:${new SHA256().hex(parent)}:${legacyId}`
  // Keep the legacy alias for matching when unambiguous. The adapter removes
  // shared aliases; pairing equal suffixes also prevents trimming the scoped ID.
  const syncID = parent === undefined ? [legacyId] : [legacyId, id]
  const isContinuous = apiAccount.depositingMethodDescription === 'הפקדה רציפה'
  ensure(isContinuous
    ? apiAccount.detailedAccountTypeCode === 54 && apiAccount.linkageTypeCode === 1
    : apiAccount.detailedAccountTypeCode === 26 && (apiAccount.linkageTypeCode === undefined || apiAccount.linkageTypeCode === 1),
  'unexpected deposit currency', { structType: apiAccount.structType, field: 'detailedAccountTypeCode/linkageTypeCode' })
  const title = getAccountTitle([apiAccount.shortProductName, apiAccount.shortSavingDepositName], isContinuous ? 'חיסכון' : 'פיקדון')
  if (isContinuous) {
    // Cumulative contributions are not an original term-deposit principal.
    return {
      mainProduct: null,
      account: {
        id,
        type: 'checking',
        savings: true,
        title,
        instrument: 'ILS',
        syncID,
        balance: requireNonnegativeBalance(apiAccount.revaluedTotalAmount ?? apiAccount.revaluedBalance, 'revaluedTotalAmount/revaluedBalance', 'saving')
      }
    }
  }
  const startDate = parseDateTime(apiAccount.formattedAgreementOpeningDate, 'formattedAgreementOpeningDate', 'deposit')
  const endDate = parseDateTime(apiAccount.formattedPaymentDate, 'formattedPaymentDate', 'deposit')
  const { interval, count } = getIntervalBetweenDates(startDate, endDate)
  ensure(count > 0, 'unexpected deposit term', { structType: apiAccount.structType, field: 'formattedAgreementOpeningDate/formattedPaymentDate' })
  const balance = requireNonnegativeBalance(apiAccount.revaluedTotalAmount ?? apiAccount.revaluedBalance, 'revaluedTotalAmount/revaluedBalance', 'deposit')
  const paysToChecking = apiAccount.interestCreditingMethodDescription === 'לעו"ש'
  const paysAtEnd = isDepositInterestPaidAtEnd(apiAccount.interestPaymentDescription)
  ensure(paysToChecking && paysAtEnd, 'unexpected deposit interest conditions', { structType: apiAccount.structType, field: 'interestCreditingMethodDescription/interestPaymentDescription' })
  return {
    mainProduct: null,
    account: {
      id,
      type: 'deposit',
      title,
      instrument: 'ILS',
      syncID,
      balance,
      startBalance: requirePrincipal(apiAccount.principalAmount, 'principalAmount', 'deposit'),
      startDate,
      percent: nullableAmount(apiAccount.adjustedInterest, 'adjustedInterest', 'deposit'),
      capitalization: false,
      endDateOffsetInterval: interval,
      endDateOffset: count,
      payoffInterval: null,
      payoffStep: 0
    }
  }
}

function convertForeignCurrencyAccount (apiAccount) {
  ensure(Array.isArray(apiAccount.balancesAndLimitsDataList), 'unexpected foreign currency balances')
  ensure(typeof apiAccount.mainProductId === 'string' && apiAccount.mainProductId.trim().length > 0, 'unexpected account identity', { field: 'mainProductId' })
  const ids = new Set()
  return apiAccount.balancesAndLimitsDataList.map(balancesAndLimits => {
    requireIdentity(balancesAndLimits?.detailedAccountTypeCode, 'detailedAccountTypeCode')
    requireIdentity(balancesAndLimits?.currencyCode, 'currencyCode')
    ensure(typeof balancesAndLimits?.currencySwiftCode === 'string' && balancesAndLimits.currencySwiftCode.trim().length > 0 &&
      typeof balancesAndLimits.currencyLongDescription === 'string' && balancesAndLimits.currencyLongDescription.trim().length > 0, 'unexpected foreign currency account')
    const id = apiAccount.mainProductId + balancesAndLimits.detailedAccountTypeCode.toString()
    ensure(!ids.has(id), 'conflicting foreign currency identity', { structType: 'foreignCurrencyAccount', field: 'balancesAndLimitsDataList.detailedAccountTypeCode' })
    ids.add(id)
    return {
      mainProduct: {
        id: apiAccount.mainProductId,
        type: 'foreignCurrencyAccount',
        currencyCode: balancesAndLimits.currencyCode,
        detailedAccountTypeCode: balancesAndLimits.detailedAccountTypeCode
      },
      account: {
        id,
        type: 'checking',
        title: balancesAndLimits.currencyLongDescription,
        instrument: balancesAndLimits.currencySwiftCode,
        syncID: [
          id
        ],
        balance: requireAmount(balancesAndLimits.currentBalance, 'currentBalance', 'foreignCurrencyAccount')
      }
    }
  })
}

export function convertTransaction (apiTransaction, account, sourceType = 'account') {
  ensure(sourceType === 'account' || sourceType === 'foreignCurrencyAccount', 'unexpected transaction source', { field: 'sourceType' })
  ensure(apiTransaction && typeof apiTransaction === 'object' && !Array.isArray(apiTransaction), 'unexpected transaction record', { sourceType })
  ensure(Number.isFinite(apiTransaction.eventAmount) && apiTransaction.eventAmount >= 0, 'unexpected transaction amount', { sourceType, field: 'eventAmount' })
  ensure(apiTransaction.eventActivityTypeCode === 1 || apiTransaction.eventActivityTypeCode === 2, 'unexpected transaction direction', { sourceType, field: 'eventActivityTypeCode' })
  const date = parseDateTime(apiTransaction.formattedEventDate || apiTransaction.formattedExecutingDate || apiTransaction.formattedValueDate,
    'formattedEventDate/formattedExecutingDate/formattedValueDate', sourceType)
  const isFx = sourceType === 'foreignCurrencyAccount'
  ensure(!isFx || apiTransaction.currencySwiftCode === account.instrument, 'unexpected foreign currency transaction instrument', { sourceType, field: 'currencySwiftCode' })
  // The captured intraday bucket does not establish pending or settled status.
  const isToday = !isFx && apiTransaction.transactionType === 'TODAY' && apiTransaction.serialNumber === 0 && apiTransaction.rejectedDataEventPertainingIndication === ''
  // The observed FX record has no rejection flag; checking records do.
  ensure(isToday || (apiTransaction.transactionType === 'REGULAR' && (apiTransaction.rejectedDataEventPertainingIndication === 'N' || (isFx && apiTransaction.rejectedDataEventPertainingIndication === undefined))),
    'unexpected transaction status', { sourceType, field: 'transactionType/rejectedDataEventPertainingIndication' })
  if (apiTransaction.eventAmount === 0) {
    return null
  }
  const merchantTitle = typeof apiTransaction.activityDescription === 'string' ? apiTransaction.activityDescription.trim() : ''
  const transaction = {
    hold: isToday ? null : false,
    date,
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: apiTransaction.eventActivityTypeCode !== 1 ? -apiTransaction.eventAmount : apiTransaction.eventAmount,
        fee: 0
      }
    ],
    merchant: merchantTitle
      ? {
          country: null,
          city: null,
          title: merchantTitle,
          mcc: null,
          location: null
        }
      : null,
    comment: null
  }
  return transaction
}

function parseDateTime (input, field = 'date', structType) {
  const context = { field, ...structType ? { structType } : {} }
  ensure(typeof input === 'string', 'unexpected bank date', context)
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(input)
  ensure(match, 'unexpected bank date', context)
  const [, year, month, day] = match.map(Number)
  ensure(month >= 1 && month <= 12 && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate(), 'unexpected bank date', context)
  const date = new Date(input.replace(/Z$/, '') + '+02:00')
  ensure(Number.isFinite(date.getTime()), 'unexpected bank date', context)
  return date
}
