import _ from 'lodash'
import { isValidDate } from './dateUtils'

export function formatRate ({ invoiceSum, sum }) {
  const rate = invoiceSum / sum
  return rate < 1
    ? `1/${(1 / rate).toFixed(4)}`
    : rate.toFixed(4)
}

export function formatComment ({ invoice, sum, fee, accountInstrument }) {
  const feeLine = fee === null ? null : `${Math.abs(fee).toFixed(2)} ${accountInstrument} ${fee > 0 ? 'cashback' : 'fee'}`
  const invoiceLine = invoice === null ? null : `${Math.abs(invoice.sum).toFixed(2)} ${invoice.instrument}\n(rate=${formatRate({
    invoiceSum: invoice.sum,
    sum
  })})`
  const lines = [feeLine, invoiceLine].filter((x) => x !== null)
  return lines.length === 0 ? null : lines.join('\n')
}

const accountTypes = ['cash', 'ccard', 'checking', 'loan', 'deposit']

function makeZenmoneyAccountReference (account) {
  console.assert(_.isPlainObject(account), 'account must be Object:', account)
  if (account.id) {
    const { id, ...rest } = account
    const propsThatMakeNoDifference = Object.keys(rest)
    console.assert(
      propsThatMakeNoDifference.length === 0,
      propsThatMakeNoDifference,
      'account props are unknown:',
      account,
      `Either provide specific account {id} alone, or provide account weak-ref in shape {type, instrument[, syncIds, company]}`
    )
    console.assert(_.isString(account.id), 'account.id must be String:', account)
    console.assert(
      accountTypes.every((x) => account.id !== x && !account.id.includes(x + '#')),
      'account.id must not be used to provide weak reference. Use account weak-referencing type, instrument[, syncID] props instead.'
    )
    return account.id
  }

  const { type: t, instrument, syncIds, company, ...rest } = account
  const type = t === null ? 'ccard' : t
  const propsThatMakeNoDifference = Object.keys(rest)
  console.assert(
    propsThatMakeNoDifference.length === 0,
    propsThatMakeNoDifference,
    'account props are unknown:',
    account,
    `Either provide specific account {id} alone, or provide account weak-ref in shape {type, instrument[, syncIds, company]}`
  )

  console.assert(company === null || _.isObject(company), `account.company must be defined Object`, account)
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
    fee: null
  }
}

function assertRestIsEmpty (rest, kind, kindInstance) {
  const propsThatMakeNoDifference = Object.keys(rest)
  console.assert(propsThatMakeNoDifference.length === 0, propsThatMakeNoDifference, kind, 'are unknown:', kindInstance)
}

export function toZenmoneyTransaction (readableTransaction) {
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
    console.assert(merchant.title === null || _.isString(merchant.title), 'merchant.payee must be defined String:', readableTransaction)
    result.payee = merchant.title

    console.assert(merchant.mcc === null || _.isNumber(merchant.mcc), 'merchant.mcc must be defined Number:', readableTransaction)
    result.mcc = merchant.mcc

    console.assert(
      merchant.location === null || _.isPlainObject(merchant.location),
      'merchant.location must be defined Object:',
      readableTransaction
    )

    if (merchant.location !== null) {
      const { latitude, longitude, locationRest } = merchant.location
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

    const { id, account, invoice, sum, fee, ...movementRest } = movement
    assertRestIsEmpty(movementRest, 'movement props', readableTransaction)

    console.assert(id === null || _.isString(id), 'movement.id must be defined String:', readableTransaction)
    result.id = id

    const zenmoneyAccountReference = makeZenmoneyAccountReference(account)

    console.assert(invoice === null || _.isPlainObject(invoice), 'invoice must be defined Object:', readableTransaction)
    // console.assert(
    //   invoice === null || invoice.sum !== sum /* TODO use invoice.instrument !== account.instrument instead of checking sum */,
    //   `invoice:{sum,instrument} must be replaced with null when it's the same as {sum,account.instrument}:`,
    //   readableTransaction
    // )

    console.assert(_.isNumber(sum), 'movement.sum must be Number:', readableTransaction)

    console.assert(fee === null || _.isNumber(fee), 'movement.fee must be defined Number:', readableTransaction)
    const sumWithFee = fee === null ? sum : sum + fee

    if (sumWithFee >= 0) {
      result.income = Math.abs(sumWithFee)
      result.incomeAccount = zenmoneyAccountReference
      result.outcome = 0
      result.outcomeAccount = zenmoneyAccountReference
    } else {
      result.income = 0
      result.incomeAccount = zenmoneyAccountReference
      result.outcome = Math.abs(sumWithFee)
      result.outcomeAccount = zenmoneyAccountReference
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
    movements.forEach((movement, movementIndex) => {
      const context = { readableTransaction, movement, movementIndex }
      console.assert(_.isPlainObject(movement), 'movement must be Object:', context)

      const { id, account, invoice, sum, fee, ...movementRest } = movement
      assertRestIsEmpty(movementRest, 'movement props', context)

      console.assert(id === null || _.isString(id), 'movement.id must be defined String:', readableTransaction)

      console.assert(invoice === null || _.isPlainObject(invoice), 'invoice must be defined Object:', readableTransaction)
      if (invoice !== null && invoice.sum === sum /* TODO use invoice.instrument === account.instrument instead */) {
        throw new Error('invoice must be null when {sum,instrument} are the same as sum and account instrument')
      }

      console.assert(_.isNumber(sum), 'movement.sum must be Number:', readableTransaction)

      console.assert(fee === null || _.isNumber(fee), 'movement.fee must be defined Number:', readableTransaction)
    })
    const [outcomeMovement, incomeMovement] = _.sortBy(movements, (x) => x.sum >= 0)
    const outcomeSumWithFee = outcomeMovement.fee === null ? outcomeMovement.sum : outcomeMovement.sum + outcomeMovement.fee
    const incomeSumWithFee = incomeMovement.fee === null ? incomeMovement.sum : incomeMovement.sum + incomeMovement.fee
    console.assert(
      outcomeSumWithFee < 0 && incomeSumWithFee >= 0,
      'movements array[2] must contain both income (sum >= 0) and outcome (sum < 0)',
      { readableTransaction, outcomeSumWithFee, incomeSumWithFee }
    )

    result.outcome = Math.abs(outcomeSumWithFee)
    result.outcomeAccount = makeZenmoneyAccountReference(outcomeMovement.account)
    result.outcomeBankID = outcomeMovement.id

    result.income = Math.abs(incomeSumWithFee)
    result.incomeAccount = makeZenmoneyAccountReference(incomeMovement.account)
    result.incomeBankID = incomeMovement.id

    if (outcomeMovement.invoice) {
      result.opOutcome = Math.abs(outcomeMovement.invoice.sum)
      result.opOutcomeInstrument = outcomeMovement.invoice.instrument
    }
    if (incomeMovement.invoice) {
      result.opIncome = Math.abs(incomeMovement.invoice.sum)
      result.opIncomeInstrument = incomeMovement.invoice.instrument
    }
  } else {
    throw new Error('movements can be either array of [income,outcome] (order does not matter) or single-item array of [income] or [outcome]')
  }

  return result
}
