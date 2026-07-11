import { Account, AccountType, Amount, Merchant, NonParsedMerchant, Transaction } from '../../types/zenmoney'
import { JupiterBalance, JupiterCard, JupiterTransaction } from './models'

function num (value: string | number | null | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// ZenMoney identifies an account by this id forever, so it must be derived from the
// one stable key. Falling back to another field would change the account's identity
// and leave a duplicate in the ledger permanently.
export function accountIdFor (card: JupiterCard): string | null {
  const id = card.cardAccountId
  return id != null && id !== '' ? id : null
}

// One account per distinct card account. Jupiter exposes only one today (the balance
// endpoint takes no account parameter), but grouping keeps a second one's transactions
// from silently landing on the first.
export function convertAccounts (cards: JupiterCard[], balance: JupiterBalance): Account[] {
  const groups = new Map<string, JupiterCard[]>()
  for (const card of cards) {
    const id = accountIdFor(card)
    if (id == null) {
      continue
    }
    const group = groups.get(id)
    if (group != null) {
      group.push(card)
    } else {
      groups.set(id, [card])
    }
  }
  // No cards: report nothing. A synthetic account would carry a different id from the
  // real one and appear alongside it as a phantom duplicate.
  if (groups.size === 0) {
    return []
  }

  const instrument = balance.currency != null && balance.currency !== '' ? balance.currency : 'USD'
  const spendable = typeof balance.spendableBalance === 'number' && Number.isFinite(balance.spendableBalance)
    ? balance.spendableBalance
    : null

  return [...groups.entries()].map(([id, groupCards], index) => {
    const last4s = groupCards.map((c) => c.last4).filter((x): x is string => x != null && x !== '')
    return {
      id,
      type: AccountType.ccard,
      title: last4s.length > 0 ? `Jupiter •${last4s.join('/')}` : 'Jupiter Card',
      instrument,
      // The balance endpoint is global, so it can only belong to the primary account;
      // null means "not determinable", which ZenMoney accepts.
      balance: index === 0 ? spendable : null,
      syncIds: last4s,
      savings: false
    }
  })
}

function commentFor (tx: JupiterTransaction): string | null {
  const type = typeof tx.type === 'string' ? tx.type : ''
  if (type === 'CARD') {
    return null
  }
  const parts: string[] = []
  if (type !== '') {
    parts.push(type.toLowerCase())
  }
  if (tx.onchainSignature != null && tx.onchainSignature !== '') {
    parts.push(`sig:${tx.onchainSignature}`)
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

// Returns null for a record we cannot represent honestly. Emitting one anyway would put
// a corrupt entry in the ledger: a malformed amount silently becomes 0 and misstates the
// balance, and a malformed timestamp becomes an Invalid Date.
export function convertTransaction (tx: JupiterTransaction, accountId: string): Transaction | null {
  const date = new Date(tx.transactionTimestamp ?? '') // missing → Invalid Date → skipped below
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const settlement = Number(tx.settlementAmount)
  if (!Number.isFinite(settlement)) {
    return null
  }
  // Never guess the direction of money: treating anything-not-CREDIT as a debit would
  // book income as an expense if the field were missing or gained a new value.
  if (tx.direction !== 'DEBIT' && tx.direction !== 'CREDIT') {
    return null
  }

  const sign = tx.direction === 'CREDIT' ? 1 : -1
  const sum = sign * settlement

  const original = Number(tx.transactionAmount)
  const originalCurrency = tx.transactionCurrency
  const invoice: Amount | null =
    typeof originalCurrency === 'string' &&
    originalCurrency !== '' &&
    originalCurrency !== tx.settlementCurrency &&
    Number.isFinite(original)
      ? { sum: sign * original, instrument: originalCurrency }
      : null

  let merchant: NonParsedMerchant | Merchant | null = null
  const merchantName = tx.card?.merchantName
  if (merchantName != null && merchantName !== '') {
    const mcc = num(tx.card?.merchantCategoryCode)
    merchant = { fullTitle: merchantName, mcc: mcc !== 0 ? mcc : null, location: null }
  }

  // A card authorisation that has not settled is a hold; non-card movements are not.
  const hold = tx.card != null ? tx.card.settlementTimestamp == null : false

  return {
    hold,
    date,
    movements: [
      {
        // ZenMoney's dedup key; null is valid (it then matches on the other fields).
        id: tx.id ?? null,
        account: { id: accountId },
        invoice,
        sum,
        fee: 0
      }
    ],
    merchant,
    comment: commentFor(tx)
  }
}
