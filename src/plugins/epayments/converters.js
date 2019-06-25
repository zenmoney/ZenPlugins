import * as tools from './tools'

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

export function convertTransaction (transaction) {
  const zenTransaction = {
    id: transaction.transactionId.toString(),
    date: tools.getTimestamp(new Date(Date.parse(transaction.operation.date)).setSeconds(0, 0)),
    comment: tools.cleanUpText(transaction.details)
  }

  function getAccountId (transaction) {
    if (transaction.source.type === 'card') {
      return uniqueCardId(transaction.source.identity)
    } else if (transaction.source.type === 'ewallet') {
      return uniqueWalletId(transaction.source.identity, transaction.currency)
    }
  }

  const accountId = getAccountId(transaction)
  const isOutcome = transaction.direction === 'Out'

  zenTransaction.outcomeAccount = accountId
  zenTransaction.incomeAccount = accountId
  zenTransaction.outcome = isOutcome ? transaction.total : 0
  zenTransaction.income = isOutcome ? 0 : transaction.total

  // TODO: добавить другие типы транзакций?
  if (transaction.operation.typeCode === 'Atm') { // снятие налички
    if (transaction.currency !== transaction.txnCurrency) { // Снятие в валюте отличной от валюты счета
      zenTransaction.income = transaction.txnAmount // Сумма в валюте снятия
      zenTransaction.incomeAccount = 'cash#' + resolveInstrument(transaction.txnCurrency) // Валюта снятия
      zenTransaction.outcome = transaction.total // Сумма в валюте счета + комиссия
      zenTransaction.opOutcome = transaction.txnAmount
      zenTransaction.opOutcomeInstrument = resolveInstrument(transaction.txnCurrency) // Валюта снятия
    } else {
      zenTransaction.income = transaction.amount
      zenTransaction.incomeAccount = 'cash#' + resolveInstrument(transaction.currency)
    }
  }

  return zenTransaction
}

function resolveInstrument (code) { return code.toUpperCase() }

function uniqueCardId (id) { return id }

function uniqueWalletId (id, currency) { return id + '-' + resolveInstrument(currency) }
