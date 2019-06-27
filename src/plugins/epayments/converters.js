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
    } // Скопировано из старого плагина, похоже нужно для перевыпущеных карт

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
    merchant: null, // Такая информация есть только в комментарии в неудобном для парсинга виде
    date: new Date(Date.parse(apiTransaction.operation.date)),
    comment: tools.cleanUpText(apiTransaction.details)
  };

  // TODO: добавить больше операций?
  [ parseCashWithdrawal ].some(parser => parser(apiTransaction, zenTransaction, accountId))

  return zenTransaction
}

function getMovement (apiTransaction, accountId) {
  const type = (function () {
    const operation = apiTransaction.operation
    if (operation.type === 'CardLoad' || operation.type === '5' ||
        operation.typeCode === 'Load' || /load/i.test(operation.displayName) || /load/i.test(apiTransaction.details)) {
      return 'load'
    }
    if (operation.type === 'CardUnload' || operation.type === '6' ||
        operation.typeCode === 'Unload' || /unload/i.test(apiTransaction.details)) {
      return 'unload'
    }
    if (operation.type === '10' || /exchange/i.test(operation.details)) {
      return 'exchange'
    }

    return null
  }())

  const fee = apiTransaction.fee || 0
  const sum = apiTransaction.total || (apiTransaction.amount + fee)

  const movement = {
    id: apiTransaction.transactionId,
    account: { id: accountId },
    invoice: null,
    sum: apiTransaction.direction === 'Out' ? -sum : sum,
    fee: fee,
    _type: type
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
  if (apiTransaction.operation.typeCode !== 'Atm' || apiTransaction.operation.type !== 'CardAtmOperation') {
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
      if (movement._type === 'load' || movement._type === 'unload') {
        const account = accounts.find(account => account.id === movement.account.id)
        return [
          'internal',
          movement.invoice ? Math.abs(movement.invoice.sum) : Math.abs(movement.sum),
          movement.invoice ? movement.invoice.instrument : account.instrument,
          truncateSeconds(transaction.date) // Переводы внутри системы обычно происходят в пределах минуты
        ].join('-')
      } else if (movement._type === 'exchange') {
        return ['exchange', truncateSeconds(transaction.date)].join('-')
      } else {
        return null
      }
    }
  }).map(transaction => {
    transaction.movements = transaction.movements.map(movement => _.omit(movement, ['_type']))
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

function truncateSeconds (date) {
  return date.setSeconds(0, 0)
}
