import get from '../../../types/get'
import { Account, AccountOrCard, AccountType } from '../../../types/zenmoney'
import { array, text, number } from '../parse'
import { AccountPlan } from '../models'

/** Convert the full product graph using verified account numbers and available balances (ACCOUNT-001). */
export function convertAccounts (graph: unknown, products: readonly unknown[]): AccountPlan {
  const savings = array(graph, 'savings')
  const savingsAccounts = savings
    .filter(item => get(item, 'accountNumber') !== undefined)
    .map(item => ({ productType: 'ACCOUNT', id: text(item, 'id') }))
  const deposits = savings.filter(item => get(item, 'accountNumber') === undefined)
  const listed = [...array(graph, 'accountsAndCards'), ...savingsAccounts]
  console.assert(listed.length > 0 && listed.length === products.length, 'Incomplete MyAmeria product graph')
  const accounts = new Map<string, AccountOrCard>()
  for (let i = 0; i < listed.length; i++) {
    const account = convertAccount(listed[i], products[i])
    const existing = accounts.get(account.id)
    accounts.set(account.id, existing === undefined ? account : mergedAccount(existing, account))
  }
  const result = [...accounts.values(), ...deposits.map(convertDeposit)]
  return {
    accounts: [...result].sort((a, b) => a.id.localeCompare(b.id)),
    fetchParams: {
      source: 'history',
      deposits: deposits.map(item => ({
        accountId: `deposit:${text(item, 'id')}`,
        productId: text(item, 'id')
      }))
    }
  }
}

/** Match a product detail to its listing and convert a debit card or account. */
function convertAccount (item: unknown, detail: unknown): AccountOrCard {
  const kind = text(item, 'productType')
  console.assert(kind === 'CARD' || kind === 'ACCOUNT', 'Unsupported MyAmeria product type')
  const product = get(detail, kind === 'CARD' ? 'card' : 'account')
  console.assert(text(product, 'id') === text(item, 'id'), 'MyAmeria product detail mismatch')
  console.assert(get(product, 'overdraft') === null, 'MyAmeria overdraft requires verified credit conversion')
  if (kind === 'CARD') console.assert(text(product, 'cardCategory') === 'DEBIT', 'Unsupported MyAmeria credit card')
  const id = text(product, 'accountNumber')
  const instrument = text(product, 'currency')
  const card = kind === 'CARD' ? text(product, 'displayCardNumber') : null
  return {
    id,
    type: card === null ? AccountType.checking : AccountType.ccard,
    title: `${text(product, 'name')} ${instrument}`,
    instrument,
    syncIds: card === null ? [id] : [id, card],
    balance: availableBalance(product),
    ...(get(product, 'accountType') === 'SAVING' ? { savings: true } : {})
  }
}

/** Use the lower available balance when the bank also supplies an offline limit. */
function availableBalance (product: unknown): number {
  const available = number(product, 'availableBalance.availableBalance')
  const offline = get(product, 'availableBalance.offlineAvailable')
  console.assert(offline === null || (typeof offline === 'number' && Number.isFinite(offline)), 'Invalid MyAmeria offline balance')
  return typeof offline === 'number' ? Math.min(available, offline) : available
}

/** Combine verified representations of one account, preferring its card title and type. */
function mergedAccount (existing: AccountOrCard, account: AccountOrCard): AccountOrCard {
  console.assert(existing.instrument === account.instrument && existing.balance === account.balance, 'Conflicting MyAmeria account representations')
  const card = account.type === AccountType.ccard
  return {
    ...existing,
    syncIds: [...new Set([...existing.syncIds, ...account.syncIds])].sort(),
    type: card ? account.type : existing.type,
    title: card ? account.title : existing.title
  }
}

/** Convert a capitalizing term deposit with verified dates and payment frequency. */
function convertDeposit (saving: unknown): Account {
  console.assert(text(saving, 'targetType') === 'DEPOSIT', 'Unsupported MyAmeria savings product')
  const startDate = new Date(text(saving, 'startDate'))
  const endDate = new Date(text(saving, 'endDate'))
  const days = (endDate.getTime() - startDate.getTime()) / 86400000
  console.assert(Number.isInteger(days) && days > 0, 'Invalid MyAmeria deposit dates')
  const capitalization = get(saving, 'additionalInfo.capitalization')
  const paymentFrequency = text(saving, 'depositInterestInfo.interestPaymentFrequency')
  console.assert(capitalization === true && paymentFrequency === 'TERM_ENDING', 'Unsupported MyAmeria deposit terms')
  return {
    id: `deposit:${text(saving, 'id')}`,
    type: AccountType.deposit,
    title: `${text(saving, 'name')} ${text(saving, 'currency')}`,
    instrument: text(saving, 'currency'),
    syncIds: [text(saving, 'contractNumber')],
    balance: number(saving, 'totalAmount'),
    startDate,
    startBalance: number(saving, 'initialAmount'),
    capitalization: true,
    percent: number(saving, 'depositInterestInfo.actualInterestRate'),
    endDateOffsetInterval: 'day',
    endDateOffset: days,
    payoffInterval: null,
    payoffStep: 0
  }
}
