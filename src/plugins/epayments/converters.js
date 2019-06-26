import * as tools from './tools'
import { mergeTransfers as commonMergeTransfers } from '../../common/mergeTransfers'

export function convertCards (cards) {
  return cards.map(card => {
    const instrument = resolveInstrument(card.cardCurrency)

    const syncID = [card.id.substr(-4)]

    if (card.hasOwnProperty('prevCardId') && card.prevCardId !== null) {
      syncID.push(card.prevCardId.substr(-4))
    } // Скопировано из старого плагина, похоже для перевыпущеных карт

    return {
      id: card.id,
      title: 'Карта ' + instrument,
      type: 'ccard',
      instrument: instrument,
      balance: card.balance,
      startBalance: 0,
      creditLimit: 0,
      savings: false,
      syncID: syncID
    }
  })
}

export function convertWallets (wallets) {
  var zenWallets = []

  wallets.forEach(wallet => {
    wallet.balances.forEach(balanceItem => {
      const accountId = uniqueWalletId(balanceItem.accountNumber, balanceItem.currency)

      zenWallets.push({
        id: accountId,
        title: `${balanceItem.accountType} ${balanceItem.accountNumber} (${resolveInstrument(balanceItem.currency)})`,
        type: 'checking',
        instrument: resolveInstrument(balanceItem.currency),
        balance: balanceItem.currentBalance,
        startBalance: 0,
        creditLimit: 0,
        syncID: accountId
      })
    })
  })

  return zenWallets
}

export function extractAccounts (userInfo) {
  const cards = convertCards(userInfo.cards)
  const wallets = convertWallets(userInfo.ewallets)

  return (cards || []).concat(wallets || [])
}

export function convertTransactions (data) {
  var zenTransactions = []

  data.forEach(transaction => zenTransactions.push(convertTransaction(transaction)))

  return zenTransactions
}

export function convertTransaction (apiTransaction) {
  function getAccountId (apiTransaction) {
    if (apiTransaction.source.type === 'card') {
      return uniqueCardId(apiTransaction.source.identity)
    } else if (apiTransaction.source.type === 'ewallet') {
      return uniqueWalletId(apiTransaction.source.identity, apiTransaction.currency)
    }
  }
  const accountId = getAccountId(apiTransaction)

  const zenTransaction = {
    movements: [ getMovement(apiTransaction, accountId) ],
    hold: apiTransaction.state === 'WaitConfirmation',
    merchant: null, // Нет такой информации в ответе
    date: new Date(Date.parse(apiTransaction.operation.date)),
    comment: tools.cleanUpText(apiTransaction.details)
  };

  [ parseCashWithdrawal ].some(parser => parser(apiTransaction, zenTransaction, accountId))

  return zenTransaction
}

function parseCashWithdrawal (apiTransaction, zenTransaction, accountId) {
  if (apiTransaction.operation.typeCode !== 'Atm') {
    return false
  }

  const sum = apiTransaction.total || apiTransaction.amount

  const movement = {
    id: null,
    account: {
      type: 'cash',
      instrument: resolveInstrument(apiTransaction.txnCurrency),
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: -sum,
    fee: apiTransaction.fee || 0
  }

  zenTransaction.movements.push(movement)

  return true
}

function getMovement (apiTransaction, accountId) {
  const isOutcome = apiTransaction.direction === 'Out'
  const sum = apiTransaction.total || apiTransaction.amount
  const movement = {
    id: apiTransaction.transactionId,
    account: { id: accountId },
    invoice: null,
    sum: isOutcome ? -sum : sum,
    fee: apiTransaction.fee || 0
  }

  if (apiTransaction.txnCurrency && apiTransaction.currency !== apiTransaction.txnCurrency) {
    var amount = apiTransaction.txnAmount
    if ((movement.sum > 0 && amount < 0) || (movement.sum < 0 && amount > 0)) {
      amount *= -1
    }
    movement.invoice = {
      sum: amount,
      instrument: resolveInstrument(apiTransaction.txnCurrency)
    }
  }

  return movement
}

export function mergeTransactions (transactions) {
  function absAmount (income, outcome) { return Math.max(Math.abs(income), Math.abs(outcome)) }
  function isLoad (data) { return data.comment.toLowerCase().includes('load') }
  return commonMergeTransfers({
    items: transactions,
    makeGroupKey: data => isLoad(data) ? `${absAmount(data.income, data.outcome)}-${data.date.setSeconds(0, 0)}` : null
  })
}

function resolveInstrument (code) { return code.toUpperCase() }

function uniqueCardId (id) { return id }

function uniqueWalletId (id, currency) { return id + '-' + resolveInstrument(currency) }
