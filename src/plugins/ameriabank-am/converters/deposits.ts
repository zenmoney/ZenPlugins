import get from '../../../types/get'
import { Account, AccountType } from '../../../types/zenmoney'
import { number, text } from '../parse'

/** Resolve date-only ledger entries to the bank-ID transfers already present in shared history. */
export function verifyDepositHistory (
  records: readonly unknown[],
  history: readonly unknown[],
  account: Account,
  fromDate: Date,
  toDate?: Date
): Readonly<Record<string, string>> {
  console.assert(account.type === AccountType.deposit, 'MyAmeria deposit history account has an invalid type')
  const result: Record<string, string> = {}
  const unique = uniqueHistory(history)
  const days = [...new Set(records.map(depositDay))]
  const creditAccounts = new Set<string>()
  for (const day of days) {
    if (day < armenianDay(fromDate) || (toDate != null && day > armenianDay(toDate))) continue
    const entries = records.filter(record => depositDay(record) === day)
    for (const entry of entries) {
      console.assert(text(entry, 'status') === 'COMPLETED' && get(entry, 'currency') === null && text(entry, 'amount.currency') === 'AMD', 'Unsupported MyAmeria deposit ledger format', { day, type: text(entry, 'type') })
      console.assert(text(entry, 'type') === text(entry, 'transactionType') && number(entry, 'amount.amount') >= 0, 'Invalid MyAmeria deposit ledger entry', { day })
    }
    const opening = entries.filter(entry => text(entry, 'type') === 'deposit:opening')
    const capitalization = entries.filter(entry => text(entry, 'type') === 'deposit:capitalization')
    console.assert(opening.length + capitalization.length === 1, 'Ambiguous MyAmeria deposit lifecycle', { day })
    const entry = opening[0] ?? capitalization[0]
    const transfer = depositTransfer(entry, unique, account, day, opening.length === 1)
    creditAccounts.add(text(transfer, 'creditAccountNumber'))
    console.assert(creditAccounts.size === 1, 'MyAmeria deposit transfers disagree on the deposit account')
    result[text(transfer, 'transactionId')] = account.id
    if (opening.length === 1) {
      console.assert(entries.length === 1 && account.type === AccountType.deposit && number(entry, 'amount.amount') === account.startBalance, 'Invalid MyAmeria deposit opening', { day })
    } else {
      verifyCapitalization(entries, records, unique, transfer, account, day)
    }
  }
  for (const record of unique) {
    const date = new Date(number(record, 'transactionDate'))
    const type = text(record, 'transactionType')
    const depositTransfer = (type === 'deposit:replenishment' || type === 'deposit:capitalization') && text(record, 'details').startsWith(`N ${account.syncIds[0]} `)
    if (date < fromDate || (toDate != null && date > toDate) || !depositTransfer) continue
    console.assert(result[text(record, 'transactionId')] === account.id, 'MyAmeria shared deposit transfer has no verified ledger entry')
  }
  return result
}

/** Preserve distinct bank identities while allowing exact repeated history pages. */
function uniqueHistory (history: readonly unknown[]): readonly unknown[] {
  const records = new Map<string, unknown>()
  for (const record of history) {
    const id = text(record, 'transactionId')
    const previous = records.get(id)
    console.assert(previous === undefined || JSON.stringify(previous) === JSON.stringify(record), 'Conflicting MyAmeria deposit history identifier')
    records.set(id, record)
  }
  return [...records.values()]
}

/** Read the bank's date-only deposit event independently of the developer machine timezone. */
function depositDay (record: unknown): string {
  const date = text(record, 'operationDate')
  console.assert(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(date) && Number.isFinite(new Date(date).getTime()), 'Invalid MyAmeria deposit operation date')
  return date.slice(0, 10)
}

/** Express a timestamp in the Armenian calendar day used by bank operation labels. */
function armenianDay (date: Date): string {
  return new Date(date.getTime() + 4 * 3600000).toISOString().slice(0, 10)
}

/** Verify currency, contract, date and amount against a unique approved outgoing bank transfer. */
function depositTransfer (entry: unknown, history: readonly unknown[], account: Account, day: string, opening: boolean): unknown {
  const matches = history.filter(record =>
    text(record, 'transactionType') === (opening ? 'deposit:replenishment' : 'deposit:capitalization') &&
    text(record, 'details') === `N ${account.syncIds[0]} ${text(entry, 'details')}` &&
    armenianDay(new Date(number(record, 'transactionDate'))) === day &&
    number(record, 'settledAmount.value') === number(entry, 'amount.amount')
  )
  console.assert(matches.length === 1, 'MyAmeria deposit movement requires a unique shared history counterpart', { day, type: text(entry, 'type'), matches: matches.length })
  const record = matches[0]
  console.assert(text(record, 'status') === 'APPROVED' && text(record, 'flowDirection') === 'EXPENSE', 'Unverified MyAmeria deposit transfer direction', { day })
  console.assert(text(record, 'settledAmount.currency') === account.instrument && text(record, 'transactionAmount.currency') === account.instrument && number(record, 'transactionAmount.value') === number(entry, 'amount.amount'), 'MyAmeria deposit transfer currency mismatch', { day })
  return record
}

/** Verify the technical renewal pair and the tax already booked on the funding account. */
function verifyCapitalization (entries: readonly unknown[], records: readonly unknown[], history: readonly unknown[], transfer: unknown, account: Account, day: string): void {
  const tax = entries.filter(entry => text(entry, 'type') === 'charge:tax:interest:capitalization')
  const creation = entries.filter(entry => text(entry, 'type') === 'deposit:overdue:creation')
  const extension = entries.filter(entry => text(entry, 'type') === 'deposit:overdue:extension')
  console.assert(entries.length === 4 && tax.length === 1 && creation.length === 1 && extension.length === 1, 'Unsupported MyAmeria deposit capitalization lifecycle', { day })
  console.assert(account.type === AccountType.deposit, 'Invalid MyAmeria deposit account')
  if (account.type !== AccountType.deposit) throw new Error('Invalid MyAmeria deposit account')
  const previous = records.filter(entry => text(entry, 'type') === 'deposit:capitalization' && depositDay(entry) < day)
  const principal = account.startBalance + previous.reduce<number>((sum, entry) => sum + number(entry, 'amount.amount'), 0)
  console.assert(Math.abs(number(creation[0], 'amount.amount') - principal) < 0.005 && number(creation[0], 'amount.amount') === number(extension[0], 'amount.amount'), 'Unverified MyAmeria technical deposit renewal', { day })
  const taxes = history.filter(record => text(record, 'transactionType') === 'charge:tax' && text(record, 'debitAccountNumber') === text(transfer, 'debitAccountNumber') && number(record, 'transactionDate') === number(transfer, 'transactionDate') && number(record, 'settledAmount.value') === number(tax[0], 'amount.amount'))
  console.assert(taxes.length === 1, 'MyAmeria deposit tax requires a unique shared history counterpart', { day, matches: taxes.length })
  console.assert(text(taxes[0], 'status') === 'APPROVED' && text(taxes[0], 'flowDirection') === 'EXPENSE' && text(taxes[0], 'settledAmount.currency') === account.instrument, 'Unverified MyAmeria deposit tax movement', { day })
  verifyInterest(history, transfer, taxes[0], account, day)
}

/** Confirm the net funding flow without inventing gross interest or omitting the observed tax-sized credit. */
function verifyInterest (history: readonly unknown[], transfer: unknown, tax: unknown, account: Account, day: string): void {
  const sameFundingEvent = (record: unknown): boolean => text(record, 'creditAccountNumber') === text(transfer, 'debitAccountNumber') && number(record, 'transactionDate') === number(transfer, 'transactionDate')
  const interest = history.filter(record => sameFundingEvent(record) && text(record, 'transactionType') === 'interest:capitalization' && text(record, 'details').startsWith(`N ${account.syncIds[0]} `))
  console.assert(interest.length === 1, 'MyAmeria deposit capitalization requires a unique interest credit', { day, matches: interest.length })
  const taxCredits = history.filter(record => sameFundingEvent(record) && text(record, 'transactionType') === 'debt-repayment:interest' && text(record, 'details') === text(tax, 'details') && text(record, 'debitAccountNumber') === text(interest[0], 'debitAccountNumber'))
  console.assert(taxCredits.length <= 1, 'Ambiguous MyAmeria deposit tax credit', { day })
  const credits = [...interest, ...taxCredits]
  for (const credit of credits) {
    console.assert(text(credit, 'status') === 'APPROVED' && text(credit, 'flowDirection') === 'INCOME' && text(credit, 'settledAmount.currency') === account.instrument && number(credit, 'settledAmount.value') >= 0, 'Unverified MyAmeria deposit interest credit', { day })
  }
  if (taxCredits.length > 0) console.assert(number(taxCredits[0], 'settledAmount.value') === number(tax, 'settledAmount.value'), 'MyAmeria deposit tax credit amount mismatch', { day })
  const net = credits.reduce<number>((sum, credit) => sum + number(credit, 'settledAmount.value'), 0) - number(tax, 'settledAmount.value')
  console.assert(Math.abs(net - number(transfer, 'settledAmount.value')) < 0.005, 'MyAmeria deposit interest and tax do not reconcile with capitalization', { day })
}
