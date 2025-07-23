import { Account, AccountOrCard, AccountType, ExtendedTransaction, Transaction } from '../../types/zenmoney'
import { getArray, getBoolean, getOptBoolean, getNumber, getOptString, getString, getOptNumber } from '../../types/get'
import { FetchedAccounts } from './models'
import { find } from 'lodash'
import { toISODateString } from '../../common/dateUtils'

function getBalance (apiAccount: unknown, balances: unknown[]): number | null {
  const id = getNumber(apiAccount, 'id')
  const result = find(balances, { account_id: id })
  if ((result === null || result === undefined) && (getNumber(apiAccount, 'card_status') === -999 || getNumber(apiAccount, 'card_status') === -100 ||
    getNumber(apiAccount, 'card_status') === -99 ||
    getOptString(apiAccount, 'card_expire_date') === '----' || getOptString(apiAccount, 'card_expire_date') === undefined)) {
    return null
  }
  assert(result !== undefined, `cant find balance for id=${id}`, balances)
  return getOptNumber(result, 'balance') ?? null
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

export function convertTransactions (apiTransactions: unknown[], account: Account): ExtendedTransaction[] {
  const transactions: Transaction[] = []
  for (const apiTransaction of apiTransactions) {
    const transaction = convertTransaction(apiTransaction, account)
    if (transaction != null) {
      transactions.push(transaction)
    }
  }

  return filterDuplicates(transactions)
}

function filterDuplicates (transactions: Transaction[]): Transaction[] {
  const a = transactions.concat()
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i].date.getDate() === a[j].date.getDate() &&
        a[i].date.getFullYear() === a[j].date.getFullYear() &&
        a[i].date.getMonth() === a[j].date.getMonth() &&
        a[i].date.getHours() === a[j].date.getHours() &&
        a[i].movements.length === a[j].movements.length &&
        getString(a[i].movements[0].account, 'id') === getString(a[j].movements[0].account, 'id') &&
        getNumber(a[i].movements[0], 'sum') === getNumber(a[j].movements[0], 'sum')) {
        a.splice(j--, 1)
      }
    }
  }
  return a
}

export function convertTransaction (apiTransaction: unknown, account: Account): ExtendedTransaction | undefined {
  const state = getNumber(apiTransaction, 'state')
  if (state === -1) {
    return
  }
  let sign = 0
  const credit = getOptBoolean(apiTransaction, 'credit')
  const image = getString(apiTransaction, 'image')
  if (credit === undefined) {
    if ([
      /transType_228.png/
    ].some(regexp => regexp.test(image))) {
      sign = 1
    } else {
      sign = -1
    }
  } else {
    sign = getBoolean(apiTransaction, 'credit') ? 1 : -1
  }
  const rawId = getNumber(apiTransaction, 'payment_id')
  const id = rawId === 0 ? null : rawId.toString()
  const fee = getNumber(apiTransaction, 'comission_amount')
  const amount = getNumber(apiTransaction, 'amount') - fee
  const currency = getOptString(apiTransaction, 'currency') ?? 'UZS'
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
        fee: fee === 0 ? 0 : sign * fee
      }
    ],
    merchant: {
      fullTitle: getString(apiTransaction, 'service_name'),
      mcc: null,
      location: null
    },
    comment: null
  }
  const date = toISODateString(transaction.date).slice(0, 10)
  const sum = String(Math.abs(transaction.movements[0].sum ?? 0))
  transaction.groupKeys = [date + '_' + currency + '_' + sum]
  ;[
    parseInnerAndOuterTransfer,
    outerTransfer
  ].some(parser => Boolean(parser(transaction, apiTransaction, account)))
  return transaction
}

function outerTransfer (transaction: ExtendedTransaction, apiTransaction: unknown, account: Account): boolean {
  if (transaction.movements[0].id !== null) {
    return false
  }
  transaction.movements.push({
    fee: 0,
    invoice: null,
    sum: -(transaction.movements[0].sum ?? 0),
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

function parseInnerAndOuterTransfer (transaction: ExtendedTransaction, apiTransaction: unknown, account: Account): boolean {
  if ([
    /Perevod s karti na kartu/i,
    /Перевод с карты на карту/i
  ].some(regexp => regexp.test(getString(apiTransaction, 'service_name')))) {
    const data: unknown[] = getArray(apiTransaction, 'data')
    const syncIdData = find(data, { key: 'Номер карты получателя' }) ?? find(data, { key: 'Карта получателя' })
    const syncIds = syncIdData !== undefined ? getString(syncIdData, 'value') : null
    const merchant = find(data, { key: 'ФИО получателя' })
    if (merchant !== undefined) {
      transaction.merchant = {
        fullTitle: getString(merchant, 'value'),
        mcc: null,
        location: null
      }
    } else {
      transaction.merchant = null
    }
    transaction.movements.push({
      fee: 0,
      invoice: null,
      sum: -(transaction.movements[0].sum ?? 0),
      id: null,
      account: {
        syncIds: syncIds !== null ? [syncIds] : null,
        type: AccountType.ccard,
        company: null,
        instrument: account.instrument
      }
    })
    const date = toISODateString(transaction.date).slice(0, 10)
    const currency = getOptString(apiTransaction, 'currency') ?? 'UZS'
    const sum = String(Math.abs(transaction.movements[0].sum ?? 0))
    transaction.groupKeys = [date + '_' + currency + '_' + sum]
    return true
  }
  return false
}
