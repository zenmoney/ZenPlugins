import { Account, AccountOrCard, AccountType, ExtendedTransaction, Merchant, NonParsedMerchant } from '../../types/zenmoney'
import { ConvertResult, OtpAccount, OtpCard, OtpTransaction, Product } from './models'

export function convertAccounts (apiAccounts: OtpAccount[]): ConvertResult[] {
  const accountsByCba: Record<string, ConvertResult | undefined> = {}
  const accounts: ConvertResult[] = []

  for (const apiAccount of apiAccounts) {
    const res = convertAccount(apiAccount, accountsByCba)
    if (res != null) {
      accounts.push(res)
    }
  }
  return accounts
}

function convertAccount (apiAccount: OtpAccount, accountsByCba: Record<string, ConvertResult | undefined>): ConvertResult | null {
  const cba = apiAccount.accountNumber
  const balance = apiAccount.balance
  let newAccount = false
  let account = accountsByCba[cba]
  if (account == null) {
    account = {
      products: [],
      account: {
        id: cba,
        type: AccountType.ccard,
        title: apiAccount.description ?? cba,
        instrument: apiAccount.currencyCode,
        balance,
        creditLimit: 0,
        ...(apiAccount.isDeposit ? { savings: true } : {}),
        syncIds: [cba]
      }
    }
    accountsByCba[cba] = account
    newAccount = true
  }
  account.products.push({
    id: apiAccount.accountNumber,
    source: apiAccount.isDeposit ? 'depositTurnover' : 'accountTurnover',
    accountNumber: apiAccount.accountNumber,
    productCodeCore: apiAccount.productCodeCore,
    currencyCodeNumeric: apiAccount.currencyCodeNumeric
  })

  return newAccount ? account : null
}

function virtualCardGroupKey (card: OtpCard): string {
  return `${card.accountNumber}\t${card.currencyCode}`
}

function dedupeCardsByPrimaryId (cards: OtpCard[]): OtpCard[] {
  const byId = new Map<string, OtpCard>()
  for (const card of cards) {
    if (!byId.has(card.primaryCardId)) {
      byId.set(card.primaryCardId, card)
    }
  }
  return Array.from(byId.values())
}

function virtualCardGroupTitle (cards: OtpCard[], currencyCode: string): string {
  const titles = [...new Set(cards.map(c => c.cardTitle))]
  if (titles.length === 1) {
    return `${titles[0]} ${currencyCode}`
  }
  return `${titles.join(' / ')} ${currencyCode}`
}

export function convertCards (apiCards: OtpCard[]): ConvertResult[] {
  const groups = new Map<string, OtpCard[]>()
  for (const card of apiCards) {
    const key = virtualCardGroupKey(card)
    const bucket = groups.get(key)
    if (bucket == null) {
      groups.set(key, [card])
    } else {
      bucket.push(card)
    }
  }

  return Array.from(groups.values()).map(cardsInGroup => convertVirtualCardGroup(cardsInGroup))
}

function convertVirtualCardGroup (cards: OtpCard[]): ConvertResult {
  const uniqueCards = dedupeCardsByPrimaryId(cards)
  const first = uniqueCards[0]
  const accountNumber = first.accountNumber
  const currencyCode = first.currencyCode
  const accountId = `virtual_${accountNumber}_${currencyCode}`

  const products: Product[] = uniqueCards.map(card => ({
    id: `virtual_${accountNumber}_${currencyCode}_${card.primaryCardId}`,
    source: 'cardTurnover',
    accountNumber,
    primaryCardId: card.primaryCardId,
    productCodeCore: card.productCodeCore,
    currencyCodeNumeric: card.currencyCodeNumeric,
    accountType: card.currencyCodeNumeric === '941' ? 'DIN' : 'DEV'
  }))

  const syncIds: string[] = [accountId, accountNumber]
  for (const card of uniqueCards) {
    syncIds.push(card.primaryCardId, card.maskedPan)
  }

  return {
    products,
    account: {
      id: accountId,
      type: AccountType.ccard,
      title: virtualCardGroupTitle(uniqueCards, currencyCode),
      instrument: currencyCode,
      balance: first.balance,
      creditLimit: 0,
      syncIds
    }
  }
}

function parseMerchant (title: string, merchantTitle: unknown = null): Merchant | NonParsedMerchant | null {
  if (merchantTitle !== '') {
    return {
      fullTitle: String(merchantTitle).trim(),
      mcc: null,
      location: null
    }
  }

  if (title.includes(':')) {
    const [, rest] = title.split(':')
    if (rest?.includes('>')) {
      const [merchantName, location] = rest.split('>')
      if (location === '') {
        return {
          title: merchantName.trim(),
          country: null,
          city: null,
          mcc: null,
          location: null
        }
      }

      const locationParts = location.trim().split(/\s+/)
      const country = locationParts.length >= 2 && locationParts[locationParts.length - 1].length === 2
        ? locationParts[locationParts.length - 1]
        : null
      const city = (country != null)
        ? locationParts.slice(0, -1).join(' ').trim()
        : location.trim()

      return {
        title: merchantName.trim(),
        city: city !== '' ? city : null,
        country,
        mcc: null,
        location: null
      }
    }
  }

  if (title.includes(' - ')) {
    const [, merchantName] = title.split(' - ')
    return {
      title: merchantName.trim(),
      country: null,
      city: null,
      mcc: null,
      location: null
    }
  }

  const [merchantName, location] = title.split('/')
  if (location != null && location !== '') {
    return {
      title: merchantName.trim(),
      city: location.trim(),
      country: null,
      mcc: null,
      location: null
    }
  }

  return {
    title: title.trim(),
    country: null,
    city: null,
    mcc: null,
    location: null
  }
}

// Stable movement id so pending and completed with same bank tx id merge in ZenMoney
function movementId (accountId: string, bankTransactionId: string, date: Date): string {
  if (bankTransactionId !== '') {
    return `${accountId}_${bankTransactionId}`
  }
  return `${accountId}_${date.getTime()}`
}

function isPlaceholderBookingDate (bookingDate: string): boolean {
  return bookingDate.startsWith('01.01.1900')
}

export function convertTransaction (apiTransaction: OtpTransaction, account: Account, accounts: AccountOrCard[] = []): ExtendedTransaction {
  const isDeposit = apiTransaction.source === 'depositTurnover'
  const depositNumber = apiTransaction.title.match(/^Prenos na partiju oročenog depozita (\d+)$/)?.[1]
  const depositAccount = isDeposit && apiTransaction.amount > 0
    ? account
    : apiTransaction.amount < 0 && depositNumber != null
      ? accounts.find(candidate => candidate.savings === true && candidate.id.slice(3, -2) === depositNumber && candidate.instrument === account.instrument)
      : undefined
  const merchant = isDeposit || depositAccount != null ? null : parseMerchant(apiTransaction.title, apiTransaction.merchant)
  const bookingDate = apiTransaction.bookingDate ?? ''
  const hasMeaningfulBookingDate = bookingDate !== '' && !isPlaceholderBookingDate(bookingDate)
  const completed = Boolean(
    hasMeaningfulBookingDate ||
    (apiTransaction.status != null && apiTransaction.status !== '') ||
    apiTransaction.finalFlag === '0'
  )

  const transaction: ExtendedTransaction = {
    date: apiTransaction.date,
    hold: isDeposit ? (hasMeaningfulBookingDate ? false : null) : !completed,
    movements: [
      {
        id: movementId(account.id, apiTransaction.id, apiTransaction.date),
        account: { id: account.id },
        sum: apiTransaction.amount,
        fee: 0,
        invoice: null
      }
    ],
    merchant,
    comment: merchant === null ? apiTransaction.title : null
  }

  if (depositAccount != null) {
    // The two bank references differ. Match only observed sides for this deposit/date/currency/amount.
    transaction.groupKeys = [`deposit|${depositAccount.id}|${account.instrument}|${apiTransaction.date.getTime()}|${Math.abs(apiTransaction.amount)}`]
  }

  return transaction
}

/**
 * Merges transactions by movement.id: when both pending and completed exist for the same id,
 * keeps only the completed one (hold: false) with final sum so ZenMoney sees one updated record.
 */
export function mergeTransactionsByMovementId (transactions: ExtendedTransaction[]): ExtendedTransaction[] {
  const byId = new Map<string, ExtendedTransaction>()
  for (const tx of transactions) {
    const id = tx.movements[0]?.id
    if (id == null) continue
    const existing = byId.get(id)
    if (existing == null) {
      byId.set(id, tx)
      continue
    }
    const preferCompleted = tx.hold === false
    const existingCompleted = existing.hold === false
    if (preferCompleted && !existingCompleted) {
      byId.set(id, tx)
    }
    // else keep existing (either both completed or existing is completed)
  }
  return Array.from(byId.values())
}
