import get, { getOptArray, getOptBoolean, getOptNumber, getOptString } from '../../types/get'
import { Account, AccountType, ExtendedTransaction } from '../../types/zenmoney'
import { AccountPlan } from './models'

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

export function convertAccounts (items: unknown[]): AccountPlan[] {
  const seen = new Set<string>()
  return items.flatMap(item => {
    const id = identifier(item, 'id')
    console.assert(!seen.has(id), 'Duplicate bank account')
    seen.add(id)
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
}

export function operationDate (operation: unknown): Date {
  const time = getOptString(operation, 'operDateTime')
  const dated = time == null ? null : /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?(?: мск)?$/.exec(time)
  const day = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text(operation, 'operDate'))
  // Tagged times are Moscow time. For untagged card times, comparison of 16
  // source/PDF pairs established the same UTC+03 instant (PDF uses UTC+07).
  // Never use the device zone or replace the supplied time with midnight.
  console.assert(time == null || dated != null, 'Unsupported operation time format')
  console.assert(day != null, 'Unsupported operation date format')
  const parts = dated ?? day
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

export function convertTransactions (items: unknown[], account: Account, fromDate: Date, toDate?: Date, accounts: Account[] = [account]): ExtendedTransaction[] {
  return items.map((item): ExtendedTransaction => {
    console.assert(identifier(item, 'accountId') === account.id, 'History belongs to a different account')
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
    const key = ownTransferKey(item, account, accounts, amount, date)
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
