import get, { getOptArray, getOptBoolean, getOptNumber, getOptString } from '../../types/get'
import { Account, AccountType, DepositOrLoan, ExtendedTransaction } from '../../types/zenmoney'
import { AccountPlan, BankProducts } from './models'

function text (value: unknown, path: string): string {
  const result = getOptString(value, path)
  console.assert(result != null && result.trim() !== '', 'Missing bank text field', { path })
  return result ?? ''
}

function identifier (value: unknown, path: string): string {
  const id = get(value, path)
  console.assert(typeof id === 'string' || (typeof id === 'number' && Number.isSafeInteger(id)), 'Invalid bank identifier', { path })
  return String(id)
}

function depositTerms (deposit: unknown, contract: unknown): Omit<DepositOrLoan, 'id' | 'title' | 'instrument' | 'syncIds' | 'balance' | 'archived'> | null {
  if (getOptString(deposit, 'term.typeCode') !== 'time') return null
  const period = getOptString(deposit, 'term.capitalizationPeriod')
  const product = getOptString(deposit, 'productName')
  let payoffInterval: 'month' | null = 'month'
  let payoffStep: number
  if (period === 'В последний день месяца') {
    // Accepted approximation: month-end anchoring and the first short period are lost.
    payoffStep = 1
  } else if (product === 'Снежинка' && period === 'В конце договора') {
    payoffInterval = null
    payoffStep = 0
  } else if (product === 'Копилка' && period === 'Каждые 90 дн.') {
    // Accepted approximation of 90 days as three calendar months, not a term conversion.
    payoffStep = 3
  } else {
    // Kapital has stepped rates and changing periods; keep its savings representation.
    return null
  }
  const opening = getOptNumber(deposit, 'openDate')
  const days = getOptNumber(deposit, 'term.contractPeriod')
  const principal = getOptNumber(contract, 'amount')
  const rate = getOptNumber(contract, 'interestRate')
  console.assert(opening != null && Number.isFinite(opening), 'Missing deposit opening date')
  console.assert(days != null && Number.isInteger(days) && days > 0, 'Invalid deposit contract period')
  console.assert(principal != null && Number.isFinite(principal) && principal > 0, 'Missing deposit original principal')
  console.assert(rate == null || (Number.isFinite(rate) && rate >= 0), 'Invalid deposit rate')
  const interestAccount = text(contract, 'interestAccountNumber').replace(/\s/g, '')
  return {
    type: AccountType.deposit,
    startDate: new Date(opening ?? NaN),
    startBalance: principal ?? NaN,
    // This is the bank's quoted rate, not a calculated yield or an assumed bonus.
    percent: rate ?? null,
    capitalization: interestAccount === text(contract, 'account.number').replace(/\s/g, ''),
    endDateOffsetInterval: 'day',
    endDateOffset: days ?? NaN,
    // Actual interest transactions come only from bank history.
    payoffInterval,
    payoffStep
  }
}

export function convertAccounts (source: unknown[] | BankProducts, syncedDepositIds: string[] = []): AccountPlan[] {
  const items = Array.isArray(source) ? source : source.accounts
  const deposits = Array.isArray(source) ? [] : source.deposits
  const depositPlans: AccountPlan[] = []
  const depositIds = new Set<string>()
  for (const deposit of deposits) {
    const contracts = getOptArray(deposit, 'contractAccounts')
    console.assert(contracts != null && contracts.length > 0, 'Missing deposit accounts')
    for (const contract of contracts ?? []) {
      const id = identifier(contract, 'account.id')
      console.assert(!depositIds.has(id), 'Duplicate deposit account')
      depositIds.add(id)
      const number = text(contract, 'account.number').replace(/\s/g, '')
      const currency = text(contract, 'account.currency.code')
      const linked = items.filter(item => identifier(item, 'id') === id)
      console.assert(linked.length <= 1, 'Duplicate linked deposit account')
      if (linked.length === 1) {
        console.assert(text(linked[0], 'number').replace(/\s/g, '') === number && text(linked[0], 'currency.code') === currency, 'Conflicting deposit account identity')
      }
      const archived = (getOptString(deposit, 'closeDateS') ?? '') !== '' || getOptBoolean(deposit, 'archive') === true
      // Never introduce an already closed deposit, even when history is available.
      // Keep known IDs so a deposit first seen open can finish its lifecycle.
      if (archived && !syncedDepositIds.includes(id)) continue
      const current = getOptNumber(contract, 'currentAmount')
      const balance = current ?? getOptNumber(linked[0], 'availableWhenPay') ?? null
      console.assert(balance == null || Number.isFinite(balance), 'Invalid deposit balance')
      // The observed old closed contracts are absent from accounts.accounts and
      // explicitly have no history in the web client. Known ones still return
      // their metadata. Never query their AC filter:
      // the server returns unrelated accounts instead of a missing-account error.
      const historyAvailable = !(archived && linked.length === 0 && getOptBoolean(contract, 'actions.canDoStatement') === false)
      const terms = depositTerms(deposit, contract)
      depositPlans.push({
        account: { id, ...(terms ?? { type: AccountType.checking, savings: true }), title: text(deposit, 'productName'), instrument: currency, syncIds: [number], balance, archived },
        fetchParams: { accountId: id, historyAvailable }
      })
    }
  }
  const seen = new Set<string>()
  const regularPlans: AccountPlan[] = items.flatMap(item => {
    const id = identifier(item, 'id')
    console.assert(!seen.has(id), 'Duplicate bank account')
    seen.add(id)
    if (depositIds.has(id)) return []
    const limits = getOptArray(item, 'limits')
    console.assert(limits != null, 'Missing account card relationships')
    const bankCards = (limits ?? [])
      .flatMap(limit => getOptArray(limit, 'cards') ?? [])
    const cards = bankCards.filter(card => text(card, 'status') !== 'CLOSE')
    const archived = (getOptString(item, 'closeDateS') ?? '') !== '' || getOptBoolean(item, 'archive') === true
    // Open accounts from accounts.accounts also represent current accounts without cards.
    // Keep closed noncard products out until their contracts can be classified.
    const currentWithoutCards = bankCards.length === 0 && !archived
    if (cards.length === 0 && !currentWithoutCards) return []
    const balance = getOptNumber(item, 'availableWhenPay')
    console.assert(balance != null && Number.isFinite(balance), 'Missing or invalid availableWhenPay')
    const syncIds = Array.from(new Set([
      text(item, 'number'),
      ...cards.map(card => text(card, 'num'))
    ].map(value => value.replace(/\s/g, '')))).sort()
    return [{
      account: {
        id,
        type: currentWithoutCards ? AccountType.checking : AccountType.ccard,
        title: text(item, 'name'),
        instrument: text(item, 'currency.code'),
        syncIds,
        // availableWhenPay already includes holds for the supported debit scope.
        balance,
        archived
      },
      fetchParams: { accountId: id }
    }]
  })
  return [...regularPlans, ...depositPlans]
}

export function operationDate (operation: unknown): Date {
  const time = getOptString(operation, 'operDateTime')
  const dated = time == null ? null : /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?(?: мск)?$/.exec(time)
  const day = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text(operation, 'operDate'))
  const dateOnly = time == null ? null : /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(time)
  // Tagged times are Moscow time. For untagged card times, comparison of 16
  // source/PDF pairs established the same UTC+03 instant (PDF uses UTC+07).
  // Never use the device zone or replace the supplied time with midnight.
  console.assert(time == null || dated != null || dateOnly != null, 'Unsupported operation time format')
  console.assert(day != null, 'Unsupported operation date format')
  const parts = dated ?? dateOnly ?? day
  const date = new Date(`${parts?.[3] ?? ''}-${parts?.[2] ?? ''}-${parts?.[1] ?? ''}T${dated?.[4] ?? '00'}:${dated?.[5] ?? '00'}:${dated?.[6] ?? '00'}+03:00`)
  console.assert(Number.isFinite(date.getTime()), 'Invalid operation date')
  return date
}

function ownTransferKey (item: unknown, account: Account, accounts: Account[], amount: number, date: Date): string | undefined {
  const category = getOptString(item, 'categoryCode')
  const isOutgoing = amount < 0 && category === 'BETWEEN.MY.ACC' && getOptString(item, 'orderFormType') === 'TRANSFER_OWN_INSIDE_BANK'
  const isIncoming = amount > 0 && category === 'OTHER.INCOME'
  if (!isOutgoing && !isIncoming) return undefined
  const payerNumber = getOptString(item, 'payerAccount')?.replace(/\s/g, '')
  const payeeNumber = getOptString(item, 'payeeAccountNumber')?.replace(/\s/g, '')
  if (payerNumber == null || payeeNumber == null) return undefined
  const payers = accounts.filter(item => item.syncIds.includes(payerNumber))
  const payees = accounts.filter(item => item.syncIds.includes(payeeNumber))
  if (payers.length !== 1 || payees.length !== 1) return undefined
  const payer = payers[0]
  const payee = payees[0]
  if (payer.id === payee.id || payer.instrument !== account.instrument || payee.instrument !== account.instrument) return undefined
  if (account.id !== (isOutgoing ? payer.id : payee.id)) return undefined
  // No shared bank transfer ID was observed. This is a constrained fallback:
  // exact full account pair, currency, amount and normalized bank timestamp.
  return JSON.stringify(['own', payer.id, payee.id, account.instrument, Math.abs(amount), date.toISOString()])
}

function depositTransferKey (item: unknown, accounts: Account[], history: unknown[]): string | undefined {
  const amount = getOptNumber(item, 'amount')
  if (amount == null || amount === 0) return undefined
  const account = accounts.find(account => account.id === String(get(item, 'accountId')))
  if (account == null) return undefined
  const number = (record: unknown, path: string): string | undefined => getOptString(record, path)?.replace(/\s/g, '')
  const outgoing = (record: unknown): boolean => {
    const form = getOptString(record, 'orderFormType')
    return getOptString(record, 'categoryCode') === 'BETWEEN.MY.ACC' && (form == null || form === 'DEPOSIT_WITHDRAWAL' || form === 'TRANSFER_OWN_INSIDE_BANK')
  }
  if (amount < 0 ? !outgoing(item) : getOptString(item, 'categoryCode') !== 'OTHER.INCOME') return undefined
  const matches: string[] = []
  for (const other of history) {
    if (getOptNumber(other, 'amount') !== -amount) continue
    const debit = amount < 0 ? item : other
    const credit = amount > 0 ? item : other
    if (!outgoing(debit) || getOptString(credit, 'categoryCode') !== 'OTHER.INCOME') continue
    const payer = accounts.find(account => account.id === String(get(debit, 'accountId')))
    const payee = accounts.find(account => account.id === String(get(credit, 'accountId')))
    const depositAccount = (account: Account): boolean => account.type === AccountType.deposit || ('savings' in account && account.savings === true)
    if (payer == null || payee == null || payer.id === payee.id || (!depositAccount(payer) && !depositAccount(payee))) continue
    if (payer.instrument !== payee.instrument || getOptString(debit, 'currency.code') !== payer.instrument || getOptString(credit, 'currency.code') !== payee.instrument) continue
    const payerNumber = number(credit, 'payerAccount')
    const payeeNumber = number(credit, 'payeeAccountNumber')
    if (payerNumber == null || payeeNumber == null || !payer.syncIds.includes(payerNumber) || !payee.syncIds.includes(payeeNumber)) continue
    if (number(debit, 'payerAccount') !== payerNumber) continue
    const debitPayee = number(debit, 'payeeAccountNumber')
    if (debitPayee != null && debitPayee !== payeeNumber) continue
    const debitDate = operationDate(debit)
    const creditDate = operationDate(credit)
    const precise = [debit, credit].every(record => (getOptString(record, 'operDateTime') ?? '').includes(':'))
    const bankDate = (date: Date): string => new Date(date.getTime() + 3 * 3600000).toISOString().slice(0, 10)
    if (precise ? debitDate.getTime() !== creditDate.getTime() : bankDate(debitDate) !== bankDate(creditDate)) continue
    // Both movements are real. The bank supplies the full pair on the credit;
    // use a day fallback only when one source record has no time precision.
    matches.push(JSON.stringify(['deposit-own', payer.id, payee.id, payer.instrument, Math.abs(amount), precise ? debitDate.toISOString() : bankDate(debitDate)]))
  }
  const keys = Array.from(new Set(matches))
  return keys.length === 1 ? keys[0] : undefined
}

export function convertTransactions (items: unknown[], account: Account, fromDate: Date, toDate?: Date, accounts: Account[] = [account], history: unknown[] = items): ExtendedTransaction[] {
  return items.filter(item => {
    console.assert(identifier(item, 'accountId') === account.id, 'History belongs to a different account')
    // Observed bank-declined phone transfer (daily limit): no posted movement.
    // Other failed/unknown states remain reportable, not successful omissions.
    return !(getOptString(item, 'state.code') === 'failed' && getOptString(item, 'state.name') === 'Отклонён' && getOptString(item, 'orderFormType') === 'TRANSFER_OTHER_OTHER_BANK_PHONE' && getOptBoolean(item, 'hold') === false)
  }).map((item): ExtendedTransaction => {
    console.assert(text(item, 'currency.code') === account.instrument, 'Unsupported operation currency')
    const state = getOptString(item, 'state.code')
    console.assert(state == null || state === 'successes', 'Unsupported operation state', { state })
    const sum = getOptNumber(item, 'amount')
    console.assert(sum != null && Number.isFinite(sum), 'Invalid operation amount')
    const amount = sum ?? 0
    let title = getOptString(item, amount < 0 ? 'payeeName' : 'payerName')?.trim()
    let details = getOptString(item, 'details')?.replace(/\s+/g, ' ').trim() ?? ''
    const purpose = getOptString(item, 'purpose')?.replace(/\s+/g, ' ').trim() ?? ''
    const bank = getOptString(item, 'payerBankName')
    if (getOptString(item, 'categoryCode') === 'OTHERS' && bank != null && details.startsWith(bank + '//')) {
      title = bank
      details = details.slice(bank.length + 2)
    }
    const words = title?.split(' ') ?? []
    const abbreviated = words.length === 3 ? `${words[0]} ${words[1]} ${words[2][0]}` : ''
    if (details === title || (abbreviated !== '' && details === abbreviated)) details = ''
    const merchantDescription = getOptString(item, 'merchantDescription')
    const cardParts = (merchantDescription ?? '').split('\\')
    const mcc = /^MCC (\d{4})$/.exec(getOptString(item, 'mccCodeAndCategory') ?? '')
    let merchant: ExtendedTransaction['merchant'] = title == null || title === '' ? null : { title, country: null, city: null, mcc: null, location: null }
    if (merchantDescription != null && merchantDescription.trim() !== '') {
      merchant = cardParts.length === 3 && /^[A-Z]{2}$/.test(cardParts[2])
        ? { title: cardParts[0].trim(), city: cardParts[1].trim(), country: cardParts[2], mcc: mcc == null ? null : Number(mcc[1]), location: null }
        : { fullTitle: merchantDescription, mcc: mcc == null ? null : Number(mcc[1]), location: null }
      if (details.toLowerCase() === merchantDescription.toLowerCase()) details = ''
    }
    const comment = Array.from(new Set([details, purpose].filter(value => value !== ''))).join('\n')
    const date = operationDate(item)
    const key = depositTransferKey(item, accounts, history) ?? ownTransferKey(item, account, accounts, amount, date)
    return {
      ...(key == null ? {} : { groupKeys: [key] }),
      date,
      hold: getOptBoolean(item, 'hold') ?? null,
      movements: [{
        id: identifier(item, 'id'),
        account: { id: account.id },
        sum: amount,
        fee: 0,
        invoice: null
      }],
      merchant,
      comment: comment === '' ? null : comment
    }
  }).filter(transaction => transaction.date >= fromDate && (toDate == null || transaction.date <= toDate))
}
