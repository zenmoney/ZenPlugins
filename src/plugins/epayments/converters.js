import * as _ from 'lodash'
import * as tools from './tools'
import { mergeTransfers as commonMergeTransfers } from '../../common/mergeTransfers'
import { getSingleReadableTransactionMovement } from '../../common/converters'

export function convertCards (cards) {
  return cards.map(card => {
    const instrument = resolveInstrument(card.cardCurrency)

    const syncID = [card.id.substr(-4)]

    if (card.prevCardId) {
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
  return wallets.flatMap(wallet => {
    return wallet.balances.map(balanceItem => {
      const accountId = uniqueWalletId(balanceItem.accountNumber, balanceItem.currency)

      return {
        id: accountId,
        title: `${balanceItem.accountType} ${balanceItem.accountNumber} (${resolveInstrument(balanceItem.currency)})`,
        type: 'checking',
        instrument: resolveInstrument(balanceItem.currency),
        balance: balanceItem.currentBalance,
        startBalance: 0,
        creditLimit: 0,
        syncID: accountId,
        company: null
      }
    })
  })
}

export function extractAccounts (userInfo) {
  const cards = convertCards(userInfo.cards)
  const wallets = convertWallets(userInfo.wallets)

  return cards.concat(wallets)
}

export function convertTransactions (apiTransactions, accounts) {
  return apiTransactions.map(apiTransaction => convertTransaction(apiTransaction, accounts))
}

export function convertTransaction (apiTransaction) {
  const accountId = (function () {
    if (apiTransaction.source.type === 'card') {
      return uniqueCardId(apiTransaction.source.identity)
    } else if (apiTransaction.source.type === 'ewallet') {
      return uniqueWalletId(apiTransaction.source.identity, apiTransaction.currency)
    }
  }())

  const zenTransaction = {
    movements: [ getMovement(apiTransaction, accountId) ],
    hold: apiTransaction.state === 'WaitConfirmation',
    merchant: null, // Нет такой информации в ответе
    date: new Date(Date.parse(apiTransaction.operation.date)),
    comment: tools.cleanUpText(apiTransaction.details)
  };

  // TODO: добавить больше операций?
  [ parseCashWithdrawal ].some(parser => parser(apiTransaction, zenTransaction, accountId))

  return zenTransaction
}

function getMovement (apiTransaction, accountId) {
  const isLoad = apiTransaction.operation.type === 'CardLoad' ||
  apiTransaction.operation.typeCode === 'Load' ||
  apiTransaction.operation.displayName.toLowerCase().includes('load')

  const fee = apiTransaction.fee || 0
  const sum = apiTransaction.total || (apiTransaction.amount + fee)

  const movement = {
    id: apiTransaction.transactionId,
    account: { id: accountId },
    invoice: null,
    sum: apiTransaction.direction === 'Out' ? -sum : sum,
    fee: fee,
    _load: isLoad
  }

  if (apiTransaction.txnCurrency && (apiTransaction.currency !== apiTransaction.txnCurrency)) {
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

function parseCashWithdrawal (apiTransaction, zenTransaction, accountId) {
  if (apiTransaction.operation.typeCode !== 'Atm') {
    return false
  }

  const movement = {
    id: null,
    account: {
      type: 'cash',
      instrument: resolveInstrument(apiTransaction.txnCurrency),
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: apiTransaction.txnAmount,
    fee: 0
  }

  zenTransaction.movements.push(movement)

  return true
}

export function mergeTransactions (transactions, accounts) {
  return commonMergeTransfers({
    items: transactions,
    makeGroupKey: transaction => {
      if (transaction.movements.length !== 1) {
        return null
      }
      const movement = getSingleReadableTransactionMovement(transaction)
      if (movement._load || false) {
        const account = accounts.find(account => account.id === movement.account.id)
        return [
          movement.invoice ? Math.abs(movement.invoice.sum) : Math.abs(movement.sum),
          movement.invoice ? movement.invoice.instrument : account.instrument,
          transaction.date.setSeconds(0, 0)
        ].join('-')
      } else {
        return null
      }
    }
  }).map(transaction => {
    transaction.movements = transaction.movements.map(movement => _.omit(movement, ['_load']))
    return transaction
  })
}

function resolveInstrument (code) {
  return code.toUpperCase()
}

function uniqueCardId (id) {
  return id
}

function uniqueWalletId (id, currency) {
  return id + '-' + resolveInstrument(currency)
}
