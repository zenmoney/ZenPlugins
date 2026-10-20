import get from '../../../types/get'
import { Account, Movement, Transaction } from '../../../types/zenmoney'
import { text, number } from '../parse'
import { ExchangeDetails, FlowDirection } from '../models'

/** Convert settled history with stable movement IDs and verified transfer amounts. */
export function convertTransactions (
  records: readonly unknown[],
  accounts: readonly Account[],
  details: ExchangeDetails,
  fromDate: Date,
  toDate?: Date,
  depositMovements: Readonly<Record<string, string>> = {}
): Transaction[] {
  const byId = new Map(accounts.map(account => [account.id, account]))
  const seen = new Map<string, string>()
  const result: Transaction[] = []
  for (const record of records) {
    const id = text(record, 'transactionId')
    const date = new Date(number(record, 'transactionDate'))
    console.assert(Number.isFinite(date.getTime()), 'Invalid MyAmeria transaction date')
    if (date < fromDate || (toDate != null && date > toDate)) continue
    const transaction = convertTransaction(record, id, date, byId, details, depositMovements[id])
    const signature = JSON.stringify(transaction)
    const previous = seen.get(id)
    console.assert(previous === undefined || previous === signature, 'Conflicting MyAmeria history identifier')
    if (previous === undefined) {
      seen.set(id, signature)
      result.push(transaction)
    }
  }
  return result
}

/** Card descriptors identify merchants more accurately than processor beneficiary names. */
function transactionMerchant (record: unknown, internal: boolean, type: string, direction: FlowDirection, descriptor: string): Transaction['merchant'] {
  if (internal) return null
  if (type === 'card' && direction === 'EXPENSE') {
    return { fullTitle: descriptor.replace(/^Ք: /, ''), mcc: null, location: null }
  }
  const beneficiary = get(record, 'beneficiaryName')
  if (typeof beneficiary !== 'string' || beneficiary.trim() === '') return null
  return { title: beneficiary.trim(), city: null, country: null, mcc: null, location: null }
}

/** Validated bank fields and account relationships used to build one transaction. */
interface TransactionContext {
  readonly id: string
  readonly record: unknown
  readonly direction: FlowDirection
  readonly debit: Account | undefined
  readonly credit: Account | undefined
  readonly own: Account
  readonly value: number
  readonly sign: number
  readonly invoiceCurrency: string
  readonly invoiceValue: number
  readonly movement: Movement
  readonly type: string
  readonly internal: boolean
  readonly descriptor: string
}

/** Validate settled amounts and resolve the transaction accounts before classification. */
function transactionContext (record: unknown, id: string, byId: ReadonlyMap<string, Account>, depositAccountId?: string): TransactionContext {
  console.assert(text(record, 'status') === 'APPROVED', 'Unsupported MyAmeria transaction status')
  const direction = flowDirection(record)
  const debit = byId.get(text(record, 'debitAccountNumber'))
  const originalCredit = byId.get(text(record, 'creditAccountNumber'))
  console.assert(depositAccountId === undefined || originalCredit === undefined || originalCredit.id === depositAccountId, 'MyAmeria deposit transfer contradicts a known credit account')
  const credit = depositAccountId === undefined ? originalCredit : byId.get(depositAccountId)
  const own = direction === 'EXPENSE' ? debit : credit
  console.assert(own !== undefined, 'MyAmeria movement account is missing')
  console.assert(depositAccountId === undefined || credit?.type === 'deposit', 'MyAmeria deposit movement account is missing')
  if (own === undefined) throw new Error('MyAmeria movement account is missing')
  const value = number(record, 'settledAmount.value')
  const currency = text(record, 'settledAmount.currency')
  console.assert(value >= 0 && currency === own.instrument, 'MyAmeria settled amount does not match account currency')
  const sign = direction === 'EXPENSE' ? -1 : 1
  const invoiceCurrency = text(record, 'transactionAmount.currency')
  const invoiceValue = number(record, 'transactionAmount.value')
  console.assert(invoiceValue >= 0, 'Negative MyAmeria original amount')
  const movement = ownMovement(id, own, sign, value, invoiceCurrency, invoiceValue)
  const type = text(record, 'transactionType')
  const internal = debit !== undefined && credit !== undefined && debit.id !== credit.id
  const descriptor = text(record, 'details').trim()
  return {
    id,
    record,
    direction,
    debit,
    credit,
    own,
    value,
    sign,
    invoiceCurrency,
    invoiceValue,
    movement,
    type,
    internal,
    descriptor
  }
}

/** Build one transaction with its movements, merchant and supported purpose. */
function convertTransaction (
  record: unknown,
  id: string,
  date: Date,
  byId: ReadonlyMap<string, Account>,
  details: ExchangeDetails,
  depositAccountId?: string
): Transaction {
  const context = transactionContext(record, id, byId, depositAccountId)
  const { internal, type, direction, descriptor } = context
  const preserveComment = internal || type !== 'card' || direction === 'INCOME'
  return {
    date,
    hold: false,
    movements: transactionMovements(context, details),
    merchant: transactionMerchant(record, internal, type, direction, descriptor),
    comment: preserveComment ? descriptor : null
  }
}

/** Select ordinary, internal transfer or external card transfer movements. */
function transactionMovements (context: TransactionContext, details: ExchangeDetails): Transaction['movements'] {
  if (context.internal) return internalTransferMovements(context, details)
  const { record, type, movement } = context
  const cardTransfer = type === 'card' && text(record, 'details').startsWith('Ք: Քարտից քարտ փոխանցում')
  if (type === 'transfer:to-card' || cardTransfer) return externalTransferMovements(context)
  return [movement]
}

/** Build both own-account movements using verified exchange amounts when currencies differ. */
function internalTransferMovements (context: TransactionContext, details: ExchangeDetails): [Movement, Movement] {
  const { id, type, debit, credit, direction, value, sign, movement } = context
  const depositTransfer = credit?.type === 'deposit' && (type === 'deposit:replenishment' || type === 'deposit:capitalization')
  console.assert(type === 'exchange' || type === 'transfer:between-own-accounts' || depositTransfer, 'Unverified MyAmeria internal transfer type')
  if (debit === undefined || credit === undefined) throw new Error('MyAmeria internal transfer account is missing')
  const other = direction === 'EXPENSE' ? credit : debit
  const otherValue = debit.instrument === credit.instrument
    ? value
    : exchangeCounterpartValue(details[id], context, other)
  const counterpart: Movement = {
    id: `${id}:${other.id}`,
    account: { id: other.id },
    sum: -sign * otherValue,
    fee: 0,
    invoice: null
  }
  return (movement.sum ?? 0) <= (counterpart.sum ?? 0)
    ? [movement, counterpart]
    : [counterpart, movement]
}

/** Pair an own-account movement with the identified external card or account. */
function externalTransferMovements (context: TransactionContext): [Movement, Movement] {
  const { record, direction, credit, debit, movement, invoiceCurrency, invoiceValue, sign } = context
  const counterpart = direction === 'EXPENSE' ? credit : debit
  console.assert(counterpart === undefined, 'MyAmeria transfer counterpart requires confirmed internal movements')
  const maskedCard = get(record, 'cardMaskedNumber')
  const counterpartNumber = text(record, direction === 'EXPENSE' ? 'creditAccountNumber' : 'debitAccountNumber')
  return [movement, {
    id: null,
    account: {
      type: null,
      instrument: invoiceCurrency,
      company: null,
      syncIds: [typeof maskedCard === 'string' ? maskedCard : counterpartNumber]
    },
    sum: -sign * invoiceValue,
    fee: 0,
    invoice: null
  }]
}

/** Build a stable own-account movement and retain an original-currency invoice when needed. */
function ownMovement (
  id: string,
  own: Account,
  sign: number,
  value: number,
  invoiceCurrency: string,
  invoiceValue: number
): Movement {
  return {
    id: `${id}:${own.id}`,
    account: { id: own.id },
    sum: sign * value,
    fee: 0,
    invoice: invoiceCurrency === own.instrument ? null : { sum: sign * invoiceValue, instrument: invoiceCurrency }
  }
}

/** Read the settled counterpart amount after verifying exchange identity, accounts and currencies. */
function exchangeCounterpartValue (detail: unknown, context: TransactionContext, other: Account): number {
  const { id, debit, credit, own, direction, value } = context
  if (debit === undefined || credit === undefined) throw new Error('MyAmeria exchange account is missing')
  console.assert(text(detail, 'id') === id && text(detail, 'state') === 'APPROVED', 'Invalid MyAmeria exchange detail')
  const debitId = text(detail, 'debitAccountNumber')
  const creditId = text(detail, 'creditAccountNumber')
  console.assert(debitId === debit.id && creditId === credit.id, 'MyAmeria exchange accounts mismatch')
  const path = direction === 'EXPENSE' ? 'document.data.creditAmount' : 'document.data.debitAmount'
  console.assert(text(detail, `${path}.currency`) === other.instrument, 'MyAmeria exchange currency mismatch')
  const counterpartValue = number(detail, `${path}.value`)
  const detailValue = number(detail, 'amount.amount')
  const detailCurrency = text(detail, 'amount.currency')
  console.assert(counterpartValue >= 0 && detailValue === value && detailCurrency === own.instrument, 'MyAmeria exchange amount mismatch')
  return counterpartValue
}

/** Narrow the observed flow direction before choosing signs and account sides. */
function flowDirection (record: unknown): FlowDirection {
  const direction = text(record, 'flowDirection')
  console.assert(direction === 'EXPENSE' || direction === 'INCOME', 'Unknown MyAmeria flow direction')
  if (direction !== 'EXPENSE' && direction !== 'INCOME') throw new Error('Unknown MyAmeria flow direction')
  return direction
}
