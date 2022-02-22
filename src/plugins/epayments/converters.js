import _ from 'lodash'
import { getSingleReadableTransactionMovement } from '../../common/converters'
import { mergeTransfers as commonMergeTransfers } from '../../common/mergeTransfers'
import { cleanUpText } from './tools'

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
      instrument,
      balance: card.balance,
      startBalance: 0,
      creditLimit: 0,
      savings: false,
      syncID
    }
  })
}

export function convertWallets (wallets) {
  return _.flatMap(wallets, wallet => {
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
        syncID: [accountId],
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

export function convertTransactions (apiTransactions) {
  return apiTransactions
    .filter(apiTransaction => apiTransaction.state !== 'AuthDecline')
    .map(apiTransaction => convertTransaction(apiTransaction))
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
    // TODO: в v3 появилось поле "status", замеченные значения: [Completed, Rejected], нужно проверить какие еще статусы есть
    movements: [getMovement(apiTransaction, accountId)],
    hold: apiTransaction.state === 'WaitConfirmation',
    merchant: null, // Такая информация есть только в комментарии в неудобном для парсинга виде
    date: new Date(Date.parse(apiTransaction.operation.date)),
    comment: cleanUpText(apiTransaction.details || '')
  };

  // TODO: добавить больше операций?
  [parseCashWithdrawal].some(parser => parser(apiTransaction, zenTransaction, accountId))

  return zenTransaction
}

function getMovement (apiTransaction, accountId) {
  const type = (function () {
    const operation = apiTransaction.operation
    if (operation.type === 'CardLoad' || operation.type === '5' || operation.typeCode === 'Load') {
      return 'load'
    }
    if (operation.type === 'CardUnload' || operation.type === '6' || operation.typeCode === 'Unload') {
      return 'unload'
    }
    if (operation.type === '10' || getRegexForWord('exchange').test(operation.details)) {
      return 'exchange'
    }
    if (operation.type === 'CardPostOperation' || operation.typeCode === 'Pos') {
      return 'pos' //  Пока это никак не используется
    }

    return null
  }())

  const fee = apiTransaction.fee ? -apiTransaction.fee : 0
  const sum = apiTransaction.amount && apiTransaction.fee ? apiTransaction.amount : apiTransaction.total

  const movement = {
    id: apiTransaction.transactionId,
    account: { id: accountId },
    invoice: null,
    sum: apiTransaction.direction === 'Out' ? -sum : sum,
    fee,
    _type: type
  }

  if (apiTransaction.txnCurrency && (apiTransaction.currency !== apiTransaction.txnCurrency)) {
    let amount = apiTransaction.txnAmount
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
    mergeComments: (outcome, income) => {
      return outcome.transaction.comment.length >= income.transaction.comment.length
        ? outcome.transaction.comment
        : income.transaction.comment
    },
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

function getRegexForWord (word) {
  return new RegExp(`\\b${word}\\b`, 'i')
}
