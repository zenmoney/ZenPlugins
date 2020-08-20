import _ from 'lodash'
import { isValidDate } from './dateUtils'

export function formatRate ({ invoiceSum, sum }) {
  const rate = invoiceSum / sum
  return rate < 1
    ? `1/${(1 / rate).toFixed(4)}`
    : rate.toFixed(4)
}

export function formatCommentFeeLine (fee, instrument) {
  return fee === 0 ? null : `${Math.abs(fee).toFixed(2)} ${instrument} ${fee > 0 ? 'cashback' : 'fee'}`
}

export function formatInvoiceLine (invoice) {
  return invoice === null ? null : `${Math.abs(invoice.sum).toFixed(2)} ${invoice.instrument}`
}

export function formatCalculatedRateLine (rate) {
  return rate === null ? null : `(rate=${rate})`
}

export function formatRateLine (sum, invoice) {
  return invoice === null ? null : formatCalculatedRateLine(formatRate({ invoiceSum: invoice.sum, sum }))
}

export function joinCommentLines (lines) {
  const filteredLines = lines.filter((x) => x !== null)
  return filteredLines.length === 0 ? null : filteredLines.join('\n')
}

function resolveAccountInstrument (accountRef, serializedAccountRef, accountsByIdLookup) {
  if (serializedAccountRef === accountRef.id) {
    const zenmoneyAccount = accountsByIdLookup[accountRef.id]
    console.assert(zenmoneyAccount, 'specific account ref', accountRef, 'cannot be resolved with provided accounts:', accountsByIdLookup)
    return zenmoneyAccount.instrument
  } else {
    console.assert(accountRef.instrument, 'accountRef instrument must be defined', accountRef)
    return accountRef.instrument
  }
}

const accountTypes = ['cash', 'ccard', 'checking', 'loan', 'deposit', 'investment']

function assertAccountCompanyIsValid (company) {
  if (company === null) {
    return
  }
  const docs = 'account.company must be defined Object with shape {id: String} or {title: String}'
  if (_.isPlainObject(company)) {
    const companyKeys = Object.keys(company)
    console.assert(
      (_.isEqual(companyKeys, ['id']) && _.isString(company.id)) ||
      (_.isEqual(companyKeys, ['title']) && _.isString(company.title)),
      docs
    )
  } else {
    console.assert(false, docs, company)
  }
}

function serializeZenmoneyAccountReference (account) {
  console.assert(_.isPlainObject(account), 'account must be Object:', account)
  if (account.id) {
    const propsThatMakeNoDifference = Object.keys(account).filter((x) => x !== 'id')
    console.assert(
      propsThatMakeNoDifference.length === 0,
      propsThatMakeNoDifference,
      'account props are unknown:',
      account,
      'Either provide specific account {id} alone, or provide account weak-ref in shape {type, instrument[, syncIds, company]}'
    )
    console.assert(_.isString(account.id), 'account.id must be String:', account)
    console.assert(
      accountTypes.every((type) => account.id !== type && !account.id.startsWith(`${type}#`)),
      'account.id must not be used to provide weak reference. Use account weak-referencing type, instrument[, syncID] props instead.'
    )
    return account.id
  }

  const { type: t, instrument, syncIds, company, ...rest } = account
  const propsThatMakeNoDifference = Object.keys(rest)
  console.assert(
    propsThatMakeNoDifference.length === 0,
    propsThatMakeNoDifference,
    'account props are unknown:',
    account,
    'Either provide specific account {id} alone, or provide account weak-ref in shape {type, instrument[, syncIds, company]}'
  )

  assertAccountCompanyIsValid(company)

  const type = t === null && (company || (_.isArray(syncIds) && syncIds.length > 0)) ? 'ccard' : t
  console.assert(type !== null, 'account.type can be null only when syncIds or company are present')
  console.assert(accountTypes.includes(type), `Unknown account.type "${type}". Supported values are`, accountTypes)
  console.assert(_.isString(instrument), 'instrument must be String currency code', account)
  if (type === 'cash') {
    console.assert(syncIds === null, 'cash account cannot have syncIds', account)
  } else {
    console.assert(syncIds === null || (_.isArray(syncIds) && syncIds.length > 0), 'syncIds must be defined non-empty Array', account)
  }
  return syncIds === null
    ? `${type}#${instrument}`
    : `${type}#${instrument}#${syncIds.join(',')}`
}

export function getSingleReadableTransactionMovement (readableTransaction) {
  if (readableTransaction.movements.length !== 1) {
    throw new Error(`Expected single readableTransaction.movement, but was ${readableTransaction.movements.length}`)
  }
  return readableTransaction.movements[0]
}

export function addMovement (readableTransaction, movement) {
  return _.defaults({
    movements: [
      movement,
      getSingleReadableTransactionMovement(readableTransaction)
    ]
  }, readableTransaction)
}

export function makeCashTransferMovement (readableTransaction, accountInstrument) {
  const movement = getSingleReadableTransactionMovement(readableTransaction)
  return {
    id: null,
    account: {
      type: 'cash',
      instrument: movement.invoice === null
        ? accountInstrument
        : movement.invoice.instrument,
      syncIds: null,
      company: null
    },
    invoice: null,
    sum: movement.invoice === null
      ? -movement.sum
      : -movement.invoice.sum,
    fee: 0
  }
}

function assertRestIsEmpty (rest, kind, kindInstance) {
  const propsThatMakeNoDifference = Object.keys(rest)
  console.assert(propsThatMakeNoDifference.length === 0, propsThatMakeNoDifference, kind, 'are unknown:', kindInstance)
}

function assertInvoiceIsNotRedundant (invoice, accountInstrument, context) {
  console.assert(
    invoice === null || invoice.instrument !== accountInstrument,
    'invoice:{sum,instrument} must be replaced with null when it\'s the same as {transaction.sum,account.instrument}:',
    context
  )
}

export function toZenmoneyTransaction (readableTransaction, accountsByIdLookup) {
  const {
    movements,
    date,
    hold,
    merchant,
    comment,
    ...rest
  } = readableTransaction

  const result = {}

  assertRestIsEmpty(rest, 'props', readableTransaction)

  console.assert(_.isArray(movements), 'movements must be Array:', readableTransaction)

  console.assert(isValidDate(date), 'date must be defined Date:', readableTransaction)
  result.date = date

  console.assert(hold === null || _.isBoolean(hold), 'hold must be defined Boolean:', readableTransaction)
  if (hold !== null) {
    result.hold = hold
  }
  console.assert(comment === null || _.isString(comment), 'comment must be defined String:', readableTransaction)
  result.comment = comment

  console.assert(merchant === null || _.isPlainObject(merchant), 'merchant must be defined Object:', readableTransaction)
  if (merchant !== null) {
    const { city, country, title, fullTitle, location, mcc, category, ...merchantRest } = merchant

    assertRestIsEmpty(merchantRest, 'merchant props', readableTransaction)
    console.assert(fullTitle === undefined || (title === undefined && city === undefined && country === undefined),
      'merchant must be either { fullTitle, mcc, location } or { title, city, country, mcc, location }', readableTransaction)

    if (fullTitle === undefined) {
      console.assert(title === null || _.isString(title), 'merchant.title must be defined String:', readableTransaction)
      console.assert(city === null || _.isString(city), 'merchant.city must be defined String:', readableTransaction)
      console.assert(country === null || _.isString(country), 'merchant.country must be defined String:', readableTransaction)
      result.payee = title
    } else {
      console.assert(fullTitle === null || _.isString(fullTitle), 'merchant.fullTitle must be defined String:', readableTransaction)
      result.payee = fullTitle
    }

    console.assert(mcc === null || (_.isNumber(mcc) && mcc > 0), 'merchant.mcc must be null or integer number > 0', readableTransaction)
    result.mcc = mcc

    console.assert(location === null || _.isPlainObject(location),
      'merchant.location must be defined Object:',
      readableTransaction
    )

    if (location !== null) {
      const { latitude, longitude, ...locationRest } = location
      assertRestIsEmpty(locationRest, 'merchant.location props', readableTransaction)

      console.assert(_.isNumber(latitude), 'merchant.location.latitude must be Number:', readableTransaction)
      result.latitude = latitude

      console.assert(_.isNumber(longitude), 'merchant.location.longitude must be Number:', readableTransaction)
      result.longitude = longitude
    }
  }

  if (movements.length === 1) {
    const movement = movements[0]
    console.assert(_.isPlainObject(movement), 'movement must be Object:', readableTransaction)

    const { id, account: accountRef, invoice, sum, fee, ...movementRest } = movement
    assertRestIsEmpty(movementRest, 'movement props', readableTransaction)

    console.assert(id === null || _.isString(id), 'movement.id must be defined String:', readableTransaction)
    result.id = id

    const serializedAccountRef = serializeZenmoneyAccountReference(accountRef)

    console.assert(invoice === null || _.isPlainObject(invoice), 'invoice must be defined Object:', readableTransaction)

    assertInvoiceIsNotRedundant(invoice, resolveAccountInstrument(accountRef, serializedAccountRef, accountsByIdLookup), readableTransaction)

    console.assert(_.isNumber(sum), 'movement.sum must be Number:', readableTransaction)

    console.assert(_.isNumber(fee), 'movement.fee must be Number:', readableTransaction)
    const sumWithFee = sum + fee

    if (sumWithFee >= 0) {
      result.income = Math.abs(sumWithFee)
      result.incomeAccount = serializedAccountRef
      result.outcome = 0
      result.outcomeAccount = serializedAccountRef
    } else {
      result.income = 0
      result.incomeAccount = serializedAccountRef
      result.outcome = Math.abs(sumWithFee)
      result.outcomeAccount = serializedAccountRef
    }

    if (invoice !== null) {
      const {
        instrument: invoiceInstrument,
        sum: invoiceSum,
        ...invoiceRest
      } = invoice
      console.assert(_.isNumber(invoiceSum), 'invoice.sum must be Number:', readableTransaction)
      console.assert(_.isString(invoiceInstrument), 'invoice.instrument must be String:', readableTransaction)
      assertRestIsEmpty(invoiceRest, 'invoice props', readableTransaction)

      console.assert(Math.sign(invoiceSum) === Math.sign(sumWithFee), 'invoice.sum and sumWithFee have contradictory signs:', readableTransaction)

      if (sumWithFee >= 0) {
        result.opIncome = Math.abs(invoiceSum)
        result.opIncomeInstrument = invoiceInstrument
      } else {
        result.opOutcome = Math.abs(invoiceSum)
        result.opOutcomeInstrument = invoiceInstrument
      }
    }
  } else if (movements.length === 2) {
    for (let movementIndex = 0; movementIndex < movements.length; movementIndex++) {
      const movement = movements[movementIndex]
      const context = { readableTransaction, movement, movementIndex }
      console.assert(_.isPlainObject(movement), 'movement must be Object:', context)

      const { id, account, invoice, sum, fee, ...movementRest } = movement
      assertRestIsEmpty(movementRest, 'movement props', context)

      console.assert(id === null || _.isString(id), 'movement.id must be defined String:', readableTransaction)

      console.assert(invoice === null || _.isPlainObject(invoice), 'invoice must be defined Object:', readableTransaction)

      console.assert(_.isNumber(sum), 'movement.sum must be Number:', readableTransaction)

      console.assert(_.isNumber(fee), 'movement.fee must be defined Number:', readableTransaction)
    }
    const [outcomeMovement, incomeMovement] = _.sortBy(movements, (x) => x.sum >= 0)
    const outcomeSumWithFee = outcomeMovement.sum + outcomeMovement.fee
    const incomeSumWithFee = incomeMovement.sum + incomeMovement.fee
    console.assert(
      outcomeSumWithFee < 0 && incomeSumWithFee >= 0,
      'movements array[2] must contain both income (sum >= 0) and outcome (sum < 0)',
      { readableTransaction, outcomeSumWithFee, incomeSumWithFee }
    )
    const serializedOutcomeAccountRef = serializeZenmoneyAccountReference(outcomeMovement.account)
    const serializedIncomeAccountRef = serializeZenmoneyAccountReference(incomeMovement.account)

    result.outcome = Math.abs(outcomeSumWithFee)

    result.outcomeAccount = serializedOutcomeAccountRef
    result.outcomeBankID = outcomeMovement.id

    result.income = Math.abs(incomeSumWithFee)

    result.incomeAccount = serializedIncomeAccountRef
    result.incomeBankID = incomeMovement.id

    assertInvoiceIsNotRedundant(outcomeMovement.invoice, resolveAccountInstrument(outcomeMovement.account, serializedOutcomeAccountRef, accountsByIdLookup), readableTransaction)
    if (outcomeMovement.invoice) {
      result.opOutcome = Math.abs(outcomeMovement.invoice.sum)
      result.opOutcomeInstrument = outcomeMovement.invoice.instrument
    }
    assertInvoiceIsNotRedundant(incomeMovement.invoice, resolveAccountInstrument(incomeMovement.account, serializedIncomeAccountRef, accountsByIdLookup), readableTransaction)
    if (incomeMovement.invoice) {
      result.opIncome = Math.abs(incomeMovement.invoice.sum)
      result.opIncomeInstrument = incomeMovement.invoice.instrument
    }
  } else {
    throw new Error('movements can be either array of [income,outcome] (order does not matter) or single-item array of [income] or [outcome]')
  }

  return result
}
