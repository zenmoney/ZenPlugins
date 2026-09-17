import { Account, AccountOrCard, AccountType, Merchant, Transaction } from '../../types/zenmoney'
import {
  QPayCard,
  QPayCardTransaction,
  QPayCardTransactions,
  QPayCardWithBalance,
  QPayWallet,
  QPayWalletTransaction
} from './models'

const USD_STABLECOINS = new Set(['USDT', 'USDC'])

const NETWORK_TITLES: Record<string, string> = {
  'evm:1': 'Ethereum',
  'evm:56': 'BNB Smart Chain',
  'tron:mainnet': 'TRON'
}

function finiteNumberOrNull (value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeInstrument (asset: string): string {
  const normalized = asset.trim().toUpperCase()
  return USD_STABLECOINS.has(normalized) ? 'USD' : normalized
}

export function walletAccountId (network: string, address: string, asset: string): string {
  return `q-pay:wallet:${network}:${address}:${asset}`
}

/** Convert every opened Q-Pay network/asset balance into a distinct ZenMoney account. */
export function convertWallets (wallets: QPayWallet[]): Account[] {
  const accounts = new Map<string, AccountOrCard>()

  for (const wallet of wallets) {
    const network = wallet.network?.trim().toLowerCase()
    const address = wallet.address?.trim()
    // A network can gain more than one wallet. Its address is therefore part of the
    // persistent identity; without it two genuine open wallets would overwrite each other.
    if (network == null || network === '' || address == null || address === '' || !Array.isArray(wallet.balances)) {
      continue
    }

    for (const walletBalance of wallet.balances) {
      const asset = walletBalance.asset?.trim().toUpperCase()
      if (asset == null || asset === '') {
        continue
      }
      const id = walletAccountId(network, address, asset)
      const networkTitle = NETWORK_TITLES[network] ?? network
      accounts.set(id, {
        id,
        type: AccountType.checking,
        title: `Q-Pay ${asset} · ${networkTitle}`,
        instrument: normalizeInstrument(asset),
        balance: finiteNumberOrNull(walletBalance.value),
        syncIds: [id],
        savings: false
      })
    }
  }

  return [...accounts.values()]
}

/** True only for cards that Q-Pay explicitly reports as currently active and not revoked. */
export function isOpenCard (card: QPayCard): card is QPayCard & { id: string } {
  return typeof card.id === 'string' && card.id.trim() !== '' &&
    card.status?.trim().toUpperCase() === 'ACTIVE' &&
    card.is_revoked === false
}

/** Convert an active Q-Pay card and its available balance into a ZenMoney card account. */
export function convertCard ({ card, balance }: QPayCardWithBalance): AccountOrCard | null {
  const cardId = card.id?.trim()
  if (cardId == null || cardId === '') {
    return null
  }
  const instrument = normalizeInstrument(balance.card_currency ?? 'USD')
  const available = finiteNumberOrNull(balance.available_balance)
  const id = `q-pay:card:${cardId}`

  return {
    id,
    type: AccountType.ccard,
    title: 'Q-Pay Card',
    instrument,
    balance: available,
    available,
    creditLimit: 0,
    syncIds: [id, cardId],
    savings: false
  }
}

/** Convert active Q-Pay cards, dropping malformed entries without a stable card id. */
export function convertCards (cards: QPayCardWithBalance[]): Account[] {
  return cards.map(convertCard).filter((account): account is AccountOrCard => account != null)
}

const WALLET_INCOME_TYPES = new Set([
  'DP_DEPOSIT',
  'AK_DEPOSIT',
  'ALTYN_DEPOSIT',
  'BLOCKCHAIN_DEPOSIT',
  'DEPOSIT',
  'BONUS_CARD_PURCHASE',
  'BONUS_CARD_DEPOSIT',
  'TIER_BONUS_CARD_PURCHASE',
  'TIER_BONUS_CARD_DEPOSIT',
  'PAYMENT_GATEWAY_DEPOSIT',
  'PAYMENT_SYSTEM_DEPOSIT',
  'QR_PAYMENT',
  'ADMIN_TOPUP',
  'TIER_BONUS_QR_PAYMENT',
  'EXCHANGE_ORDER_DEPOSIT'
])

const WALLET_OUTCOME_TYPES = new Set([
  'WITHDRAW',
  'CARD_PURCHASE',
  'CARD_DEPOSIT',
  'PHONE_NUMBER_PURCHASE',
  'PAYMENT_GATEWAY_WITHDRAW',
  'EXCHANGE_WITHDRAWAL',
  'STEAM_WITHDRAWAL',
  'PHONE_WITHDRAWAL',
  'CARD_WITHDRAWAL'
])

const CARD_INCOME_TYPES = new Set(['TOP_UP', 'REFUND', 'REVERSAL', 'CASHBACK', 'CREDIT'])
const CARD_OUTCOME_TYPES = new Set(['CHARGE', 'WITHDRAWAL', 'FEE'])
const CARD_TOP_UP_MATCH_WINDOW_MS = 10 * 60 * 1000

const WALLET_TYPE_TITLES: Record<string, string> = {
  CARD_PURCHASE: 'Покупка карты Q-Pay',
  CARD_DEPOSIT: 'Пополнение карты Q-Pay',
  PHONE_NUMBER_PURCHASE: 'Покупка номера Q-Pay',
  PAYMENT_GATEWAY_WITHDRAW: 'Вывод из Q-Pay',
  PAYMENT_GATEWAY_DEPOSIT: 'Пополнение Q-Pay',
  PAYMENT_SYSTEM_DEPOSIT: 'Пополнение Q-Pay',
  QR_PAYMENT: 'QR-платёж Q-Pay',
  EXCHANGE_WITHDRAWAL: 'Обмен Q-Pay',
  EXCHANGE_ORDER_DEPOSIT: 'Обмен Q-Pay',
  STEAM_WITHDRAWAL: 'Пополнение Steam',
  PHONE_WITHDRAWAL: 'Пополнение телефона',
  CARD_WITHDRAWAL: 'Вывод с карты Q-Pay'
}

function normalizedString (value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized == null || normalized === '' ? null : normalized
}

function epochDate (value: string | number | null | undefined): Date | null {
  if (typeof value === 'number') {
    const date = new Date(value * 1000)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof value === 'string' && value !== '') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }
  return null
}

function walletTransactionAccountId (
  transaction: QPayWalletTransaction,
  wallets: QPayWallet[]
): string | null {
  const network = transaction.network?.trim().toLowerCase()
  const asset = transaction.asset?.trim().toUpperCase()
  if (network == null || network === '' || asset == null || asset === '') {
    return null
  }

  const candidates = wallets.flatMap(wallet => {
    const address = normalizedString(wallet.address)
    const walletNetwork = wallet.network?.trim().toLowerCase()
    const hasAsset = wallet.balances?.some(balance => balance.asset?.trim().toUpperCase() === asset) === true
    return address != null && walletNetwork === network && hasAsset
      ? [{ address, id: walletAccountId(network, address, asset) }]
      : []
  })
  const transactionAddresses = [transaction.in_wallet_address, transaction.out_wallet_address]
    .map(normalizedString)
    .filter((value): value is string => value != null)
  const exact = candidates.filter(candidate => transactionAddresses.includes(candidate.address))
  if (exact.length === 1) {
    return exact[0].id
  }
  return candidates.length === 1 ? candidates[0].id : null
}

function walletMovementId (transaction: QPayWalletTransaction): string | null {
  const id = normalizedString(transaction.id)
  return id == null ? null : `q-pay:wallet-tx:${id}`
}

function cardMovementId (transaction: QPayCardTransaction): string | null {
  const id = normalizedString(transaction.x_id) ?? normalizedString(transaction.id)
  return id == null ? null : `q-pay:card-tx:${id}`
}

function isPostedCardTransaction (transaction: QPayCardTransaction): boolean {
  return ['POSTED', 'SUCCESS'].includes(transaction.status?.trim().toUpperCase() ?? '')
}

function cardTransactionSign (transaction: QPayCardTransaction): 1 | -1 | null {
  const type = transaction.type?.trim().toUpperCase() ?? ''
  if (CARD_INCOME_TYPES.has(type)) return 1
  if (CARD_OUTCOME_TYPES.has(type)) return -1
  return null
}

function cardMerchant (transaction: QPayCardTransaction): Merchant | null {
  const title = normalizedString(transaction.merchant?.name)
  if (title == null) return null
  const mcc = finiteNumberOrNull(transaction.merchant?.mcc)
  return {
    title,
    mcc: mcc == null ? null : Math.trunc(mcc),
    city: normalizedString(transaction.merchant?.city),
    country: normalizedString(transaction.merchant?.country),
    location: null
  }
}

function convertCardTransaction (
  transaction: QPayCardTransaction,
  cardId: string,
  cardInstrument: string
): Transaction | null {
  if (!isPostedCardTransaction(transaction)) return null
  const sign = cardTransactionSign(transaction)
  const amount = finiteNumberOrNull(transaction.amount)
  const date = epochDate(transaction.created_at)
  if (sign == null || amount == null || amount === 0 || date == null) return null

  const currency = normalizeInstrument(transaction.currency ?? cardInstrument)
  const originalAmount = finiteNumberOrNull(transaction.original_amount)
  const originalCurrency = normalizedString(transaction.original_currency)
  const signedAmount = sign * Math.abs(amount)
  const fee = finiteNumberOrNull(transaction.fee) ?? 0
  const description = normalizedString(transaction.description)
  const invoice = originalAmount != null && originalCurrency != null && normalizeInstrument(originalCurrency) !== cardInstrument
    ? { sum: sign * Math.abs(originalAmount), instrument: normalizeInstrument(originalCurrency) }
    : currency !== cardInstrument
      ? { sum: signedAmount, instrument: currency }
      : null

  return {
    hold: transaction.lifecycle_stage?.trim().toUpperCase() === 'AUTHORIZATION',
    date,
    movements: [{
      id: cardMovementId(transaction),
      account: { id: `q-pay:card:${cardId}` },
      sum: currency === cardInstrument ? signedAmount : null,
      fee: sign < 0 ? -Math.abs(fee) : 0,
      invoice
    }],
    merchant: cardMerchant(transaction),
    comment: description
  }
}

interface CardTransactionEntry {
  cardId: string
  transaction: QPayCardTransaction
}

function cardEntries (groups: QPayCardTransactions[]): CardTransactionEntry[] {
  return groups.flatMap(group => group.transactions.map(transaction => ({
    cardId: group.cardId,
    transaction
  })))
}

function matchCardTopUp (
  walletTransaction: QPayWalletTransaction,
  entries: CardTransactionEntry[],
  usedCardTransactions: Set<QPayCardTransaction>
): CardTransactionEntry | null {
  const walletAmount = finiteNumberOrNull(walletTransaction.amount)
  const walletDate = epochDate(walletTransaction.created_at)
  const walletInstrument = normalizedString(walletTransaction.asset)
  if (walletAmount == null || walletDate == null || walletInstrument == null) return null

  let closest: CardTransactionEntry | null = null
  let closestDistance = Number.POSITIVE_INFINITY
  for (const entry of entries) {
    const transaction = entry.transaction
    if (usedCardTransactions.has(transaction) || !isPostedCardTransaction(transaction) || transaction.type?.trim().toUpperCase() !== 'TOP_UP') {
      continue
    }
    const cardAmount = finiteNumberOrNull(transaction.amount)
    const cardDate = epochDate(transaction.created_at)
    const cardInstrument = normalizedString(transaction.currency)
    if (cardAmount == null || cardDate == null || cardInstrument == null ||
      normalizeInstrument(cardInstrument) !== normalizeInstrument(walletInstrument) ||
      Math.abs(cardAmount - walletAmount) > 0.000001) {
      continue
    }
    const distance = Math.abs(cardDate.getTime() - walletDate.getTime())
    if (distance <= CARD_TOP_UP_MATCH_WINDOW_MS && distance < closestDistance) {
      closest = entry
      closestDistance = distance
    }
  }
  return closest
}

function matchCardPurchaseTopUp (
  walletTransaction: QPayWalletTransaction,
  entries: CardTransactionEntry[],
  usedCardTransactions: Set<QPayCardTransaction>
): CardTransactionEntry | null {
  const purchasedCardId = normalizedString(walletTransaction.id)
  const walletCost = finiteNumberOrNull(walletTransaction.full_amount) ?? finiteNumberOrNull(walletTransaction.amount)
  const walletDate = epochDate(walletTransaction.created_at)
  const walletInstrument = normalizedString(walletTransaction.asset)
  if (purchasedCardId == null || walletCost == null || walletDate == null || walletInstrument == null) return null

  let closest: CardTransactionEntry | null = null
  let closestDistance = Number.POSITIVE_INFINITY
  for (const entry of entries) {
    const transaction = entry.transaction
    const cardAmount = finiteNumberOrNull(transaction.amount)
    const cardDate = epochDate(transaction.created_at)
    const cardInstrument = normalizedString(transaction.currency)
    if (entry.cardId !== purchasedCardId || usedCardTransactions.has(transaction) ||
      !isPostedCardTransaction(transaction) || transaction.type?.trim().toUpperCase() !== 'TOP_UP' ||
      cardAmount == null || cardAmount <= 0 || cardAmount > walletCost || cardDate == null || cardInstrument == null ||
      normalizeInstrument(cardInstrument) !== normalizeInstrument(walletInstrument)) {
      continue
    }
    const distance = Math.abs(cardDate.getTime() - walletDate.getTime())
    if (distance <= CARD_TOP_UP_MATCH_WINDOW_MS && distance < closestDistance) {
      closest = entry
      closestDistance = distance
    }
  }
  return closest
}

function convertWalletTransaction (
  transaction: QPayWalletTransaction,
  wallets: QPayWallet[]
): Transaction | null {
  if (transaction.status?.trim().toUpperCase() !== 'CONFIRMED') return null
  const type = transaction.type?.trim().toUpperCase() ?? ''
  const sign = WALLET_INCOME_TYPES.has(type) ? 1 : WALLET_OUTCOME_TYPES.has(type) ? -1 : null
  const amount = finiteNumberOrNull(transaction.amount)
  const fee = finiteNumberOrNull(transaction.system_fee) ?? 0
  const date = epochDate(transaction.created_at)
  const accountId = walletTransactionAccountId(transaction, wallets)
  if (sign == null || amount == null || amount === 0 || date == null || accountId == null) return null

  return {
    hold: false,
    date,
    movements: [{
      id: walletMovementId(transaction),
      account: { id: accountId },
      sum: sign * Math.abs(amount),
      fee: sign < 0 ? -Math.abs(fee) : 0,
      invoice: null
    }],
    merchant: null,
    comment: WALLET_TYPE_TITLES[type] ?? `Q-Pay: ${type}`
  }
}

function convertCardDepositTransfer (
  walletTransaction: QPayWalletTransaction,
  cardEntry: CardTransactionEntry,
  wallets: QPayWallet[]
): Transaction | null {
  const accountId = walletTransactionAccountId(walletTransaction, wallets)
  const amount = finiteNumberOrNull(walletTransaction.amount)
  const fee = finiteNumberOrNull(walletTransaction.system_fee) ?? 0
  const date = epochDate(walletTransaction.created_at)
  if (accountId == null || amount == null || amount === 0 || date == null) return null

  return {
    hold: false,
    date,
    movements: [
      {
        id: walletMovementId(walletTransaction),
        account: { id: accountId },
        sum: -Math.abs(amount),
        fee: -Math.abs(fee),
        invoice: null
      },
      {
        id: cardMovementId(cardEntry.transaction),
        account: { id: `q-pay:card:${cardEntry.cardId}` },
        sum: Math.abs(amount),
        fee: 0,
        invoice: null
      }
    ],
    merchant: null,
    comment: WALLET_TYPE_TITLES.CARD_DEPOSIT
  }
}

function convertCardPurchaseTransfer (
  walletTransaction: QPayWalletTransaction,
  cardEntry: CardTransactionEntry,
  wallets: QPayWallet[]
): Transaction | null {
  const accountId = walletTransactionAccountId(walletTransaction, wallets)
  const walletCost = finiteNumberOrNull(walletTransaction.full_amount) ?? finiteNumberOrNull(walletTransaction.amount)
  const cardAmount = finiteNumberOrNull(cardEntry.transaction.amount)
  const date = epochDate(walletTransaction.created_at)
  if (accountId == null || walletCost == null || cardAmount == null || cardAmount <= 0 || walletCost < cardAmount || date == null) {
    return null
  }

  return {
    hold: false,
    date,
    movements: [
      {
        id: walletMovementId(walletTransaction),
        account: { id: accountId },
        sum: -cardAmount,
        fee: -(walletCost - cardAmount),
        invoice: null
      },
      {
        id: cardMovementId(cardEntry.transaction),
        account: { id: `q-pay:card:${cardEntry.cardId}` },
        sum: cardAmount,
        fee: 0,
        invoice: null
      }
    ],
    merchant: null,
    comment: WALLET_TYPE_TITLES.CARD_PURCHASE
  }
}

/** Convert and reconcile wallet/card histories, merging duplicate card top-up records. */
export function convertTransactions (
  walletTransactions: QPayWalletTransaction[],
  cardTransactions: QPayCardTransactions[],
  wallets: QPayWallet[],
  cardAccounts: Account[]
): Transaction[] {
  const entries = cardEntries(cardTransactions)
  const usedCardTransactions = new Set<QPayCardTransaction>()
  const transactions: Transaction[] = []

  for (const walletTransaction of walletTransactions) {
    const walletType = walletTransaction.type?.trim().toUpperCase()
    if (walletTransaction.status?.trim().toUpperCase() === 'CONFIRMED' && walletType === 'CARD_DEPOSIT') {
      const match = matchCardTopUp(walletTransaction, entries, usedCardTransactions)
      if (match != null) {
        const transfer = convertCardDepositTransfer(walletTransaction, match, wallets)
        if (transfer != null) {
          transactions.push(transfer)
          usedCardTransactions.add(match.transaction)
          continue
        }
      }
    }
    if (walletTransaction.status?.trim().toUpperCase() === 'CONFIRMED' && walletType === 'CARD_PURCHASE') {
      const match = matchCardPurchaseTopUp(walletTransaction, entries, usedCardTransactions)
      if (match != null) {
        const transfer = convertCardPurchaseTransfer(walletTransaction, match, wallets)
        if (transfer != null) {
          transactions.push(transfer)
          usedCardTransactions.add(match.transaction)
          continue
        }
      }
    }
    const converted = convertWalletTransaction(walletTransaction, wallets)
    if (converted != null) transactions.push(converted)
  }

  const instruments = new Map(cardAccounts.map(account => [account.id, account.instrument]))
  for (const entry of entries) {
    if (usedCardTransactions.has(entry.transaction)) continue
    const accountId = `q-pay:card:${entry.cardId}`
    const instrument = instruments.get(accountId)
    if (instrument == null) continue
    const converted = convertCardTransaction(entry.transaction, entry.cardId, instrument)
    if (converted != null) transactions.push(converted)
  }

  return transactions.sort((left, right) => left.date.getTime() - right.date.getTime())
}
