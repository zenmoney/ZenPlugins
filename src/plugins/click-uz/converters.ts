import { Account, AccountOrCard, AccountType, ExtendedTransaction } from '../../types/zenmoney'
import { getBoolean, getOptArray, getOptBoolean, getNumber, getOptString, getString, getOptNumber } from '../../types/get'
import { ConvertResult, FetchedAccounts } from './models'
import { find } from 'lodash'
import { toISODateString } from '../../common/dateUtils'

function getBalance (apiAccount: unknown, balances: unknown[]): number | null {
  const id = getNumber(apiAccount, 'id')
  const result = find(balances, { account_id: id })
  if (result === null || result === undefined) {
    return null
  }
  return getOptNumber(result, 'balance') ?? null
}

export function convertAccounts (apiAccounts: FetchedAccounts): ConvertResult[] {
  return apiAccounts.cards.map(apiAccount => ({
    account: convertAccount(apiAccount, getBalance(apiAccount, apiAccounts.balances)),
    products: [{
      id: getNumber(apiAccount, 'id').toString(),
      cardType: getString(apiAccount, 'card_type')
    }]
  }))
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

export function deduplicateTransactions (transactions: ExtendedTransaction[]): ExtendedTransaction[] {
  const keys = new Set<string>()
  return transactions.filter(transaction => {
    const key = JSON.stringify({
      date: transaction.date.toISOString(),
      movements: transaction.movements,
      merchant: transaction.merchant,
      comment: transaction.comment
    })
    if (keys.has(key)) {
      return false
    }
    keys.add(key)
    return true
  })
}

export function convertTransaction (apiTransaction: unknown, account: Account): ExtendedTransaction | undefined {
  const state = getOptNumber(apiTransaction, 'state')
  if (state === -1) {
    return
  }
  let sign = 0
  const credit = getOptBoolean(apiTransaction, 'credit')
  const image = getOptString(apiTransaction, 'image') ?? ''
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
  const paymentId = getOptNumber(apiTransaction, 'payment_id')
  const id = paymentId !== undefined
    ? paymentId === 0 ? null : paymentId.toString()
    : getOptString(apiTransaction, 'id') ?? getOptNumber(apiTransaction, 'id')?.toString() ?? null
  const fee = getOptNumber(apiTransaction, 'comission_amount') ?? 0
  const amount = getNumber(apiTransaction, 'amount') - fee
  const currency = getOptString(apiTransaction, 'currency') ?? 'UZS'
  if (amount === 0) {
    return
  }

  const sameCurrency = currency === account.instrument
  const serviceName = getOptString(apiTransaction, 'service_name')
  const shortDescription = getOptString(apiTransaction, 'short_desc')
  const rawDate = getNumber(apiTransaction, 'datetime')

  const transaction: ExtendedTransaction = {
    hold: state === undefined ? null : state === 0,
    date: new Date(rawDate > 100000000000 ? rawDate : rawDate * 1000),
    movements: [
      {
        id,
        account: { id: account.id },
        invoice: sameCurrency ? null : { sum: sign * amount, instrument: currency },
        sum: sameCurrency ? sign * amount : null,
        fee: sameCurrency && fee !== 0 ? sign * fee : 0
      }
    ],
    merchant: serviceName === undefined
      ? null
      : {
          fullTitle: serviceName,
          mcc: null,
          location: null
        },
    comment: shortDescription !== undefined && shortDescription !== serviceName ? shortDescription : null
  }
  transaction.groupKeys = [getGroupKey(transaction, currency)]
  ;[
    parseInnerAndOuterTransfer,
    outerTransfer
  ].some(parser => Boolean(parser(transaction, apiTransaction, account)))
  return transaction
}

function outerTransfer (transaction: ExtendedTransaction, apiTransaction: unknown, account: Account): boolean {
  const serviceName = getOptString(apiTransaction, 'service_name') ?? ''
  const image = getOptString(apiTransaction, 'image') ?? ''
  if (transaction.movements[0].id !== null || !(
    /(?:SBOL|TRANSGRANICH|SIFROVOY BANK|CLICK .+ (?:2|TO) .+|PEREVOD|ПЕРЕВОД)/i.test(serviceName) ||
    /transType_(?:228|683|712|785)\.png/i.test(image)
  )) {
    return false
  }
  addCounterMovement(transaction, account, null)
  return true
}

function parseInnerAndOuterTransfer (transaction: ExtendedTransaction, apiTransaction: unknown, account: Account): boolean {
  if ([
    /Perevod s karti na kartu/i,
    /Перевод с карты на карту/i,
    /Perevod P2P/i,
    /Перевод P2P/i
  ].some(regexp => regexp.test(getOptString(apiTransaction, 'service_name') ?? ''))) {
    const data = getOptArray(apiTransaction, 'data') ?? []
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
    addCounterMovement(transaction, account, syncIds)
    return true
  }
  return false
}

function addCounterMovement (transaction: ExtendedTransaction, account: Account, syncId: string | null): void {
  const movement = transaction.movements[0]
  const instrument = movement.invoice?.instrument ?? account.instrument
  const sum = movement.sum ?? movement.invoice?.sum ?? 0
  transaction.movements.push({
    fee: 0,
    invoice: null,
    sum: -sum,
    id: null,
    account: {
      syncIds: syncId === null ? null : [syncId],
      type: AccountType.ccard,
      company: null,
      instrument
    }
  })
}

function getGroupKey (transaction: ExtendedTransaction, currency: string): string {
  const date = toISODateString(transaction.date).slice(0, 10)
  const movement = transaction.movements[0]
  const sum = Math.abs(movement.sum ?? movement.invoice?.sum ?? 0)
  return `${date}_${currency}_${sum}`
}
