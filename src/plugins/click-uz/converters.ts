import { Account, AccountOrCard, AccountType, ExtendedTransaction } from '../../types/zenmoney'
import { getBoolean, getNumber, getOptString, getString } from '../../types/get'
import { FetchedAccounts } from './models'
import { find } from 'lodash'

function getBalance (apiAccount: unknown, balances: unknown[]): number | null {
  const id = getNumber(apiAccount, 'id')
  const result = find(balances, { account_id: id })
  if (!result && (getNumber(apiAccount, 'card_status') === -999 || getNumber(apiAccount, 'card_status') === -100 ||
    getOptString(apiAccount, 'card_expire_date') === '----' || getOptString(apiAccount, 'card_expire_date') === undefined)) { // getNumber(apiAccount, 'card_status') !== 1 ???
    return null
  }
  assert(result !== undefined, `cant find balance for id=${id}`, balances)
  return getNumber(result, 'balance')
}

export function convertAccounts (apiAccounts: FetchedAccounts): Account[] {
  return apiAccounts.cards.map(apiAccount => convertAccount(apiAccount, getBalance(apiAccount, apiAccounts.balances)))
}

function convertAccount (apiAccount: unknown, balance: number | null): AccountOrCard {
  return {
    id: getNumber(apiAccount, 'id').toString(),
    type: getString(apiAccount, 'card_type') === 'WALLET' ? AccountType.checking : AccountType.ccard,
    title: getString(apiAccount, 'card_name'),
    instrument: getString(apiAccount, 'currency_code'),
    syncIds: [getString(apiAccount, 'card_number').replace(/\s/g, '')],
    savings: false,
    balance,
    ...getNumber(apiAccount, 'card_status') !== 1 && { archived: true }
  }
}

export function convertTransaction (apiTransaction: unknown, account: Account): ExtendedTransaction | undefined {
  const state = getNumber(apiTransaction, 'state')
  if (state === -1) {
    return
  }
  const rawId = getNumber(apiTransaction, 'payment_id')
  const id = rawId === 0 ? null : rawId.toString()
  const sign = getBoolean(apiTransaction, 'credit') ? 1 : -1
  const fee = getNumber(apiTransaction, 'comission_amount')
  const amount = getNumber(apiTransaction, 'amount') - fee
  const currency = getString(apiTransaction, 'currency')
  assert(currency === account.instrument, 'invoice transaction found', apiTransaction)
  if (amount === 0) {
    return
  }

  const transaction: ExtendedTransaction = {
    hold: state === 0,
    date: new Date(getNumber(apiTransaction, 'datetime') * 1000),
    movements: [
      {
        id,
        account: { id: account.id },
        invoice: null,
        sum: sign * amount,
        fee
      }
    ],
    merchant: {
      fullTitle: getString(apiTransaction, 'service_name'),
      mcc: null,
      location: null
    },
    comment: null
  }
  if (id !== null) {
    transaction.groupKeys = [id]
  }

  [
    outerTransfer
  ].some(parser => parser(transaction, apiTransaction, account))
  return transaction
}

function outerTransfer (transaction: ExtendedTransaction, apiTransaction: unknown, account: Account): boolean {
  if (transaction.movements[0].id !== null) {
    return false
  }
  transaction.movements.push({
    fee: 0,
    invoice: null,
    sum: -transaction.movements[0].sum!,
    id: null,
    account: {
      syncIds: null,
      type: AccountType.ccard,
      company: null,
      instrument: account.instrument
    }
  })

  return true
}
