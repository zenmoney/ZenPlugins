import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let loginData = await bank.login(preferences.isResident)
  var allAccounts = mergeAllAccounts(
    await bank.fetchAccounts(loginData.deviceID, loginData.sessionID),
    await bank.fetchCards(loginData.sessionID),
    await bank.fetchDeposits(loginData.sessionID)
  )

  await bank.fetchCredits(loginData.sessionID) // для временного перехвата логов

  var accounts = allAccounts.accounts
    .map(converters.convertAccount)
    .filter(account => account !== null)
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].type === 'card') {
      let detail = await bank.fetchCardDetail(loginData.sessionID, accounts[i])
      if (detail.status !== 'ACTIVE') {
        accounts[i] = null // заблокированные и выключенные карты незачем обрабатывать
      }
    }
  }
  accounts = accounts.filter(account => account !== null)

  var accountsSkipped = allAccounts.skipped
    .map(converters.convertAccount)
    .filter(account => account !== null)
  for (let i = 0; i < accountsSkipped.length; i++) {
    if (accountsSkipped[i].type === 'checking') {
      accounts.forEach(function (acc) {
        if (acc.type === 'card' && accountsSkipped[i].syncID[0].indexOf(acc.syncID[0]) !== -1) {
          accountsSkipped[i].cardID = acc.id
        }
      })
    }
  }

  var transactions = (await bank.fetchTransactions(loginData.sessionID, accounts, fromDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)
  var transactionsAccSkipped = (await bank.fetchTransactions(loginData.sessionID, accountsSkipped, fromDate))
    .map(transaction => converters.convertTransaction(transaction, accountsSkipped))
    .filter(transaction => transaction !== null && transaction.bankOperation === 'OWNACCOUNTSTRANSFER')
    .filter(function (tr) {
      for (let i = 0; i < accounts.length; i++) {
        if (accounts[i].id === tr.movements[0].account.id) {
          return true
        }
      }
      return false
    })
  transactions = transactions.concat(transactionsAccSkipped)
  for (let i = 0; i < transactions.length; i++) {
    delete transactions[i].bankOperation
  }
  return {
    accounts: accounts,
    transactions: transactionsUnique(transactions.concat(transactionsAccSkipped))
  }
}

function mergeAllAccounts (accounts, cards, deposits) {
  var accsSkipped = []
  for (let i = 0; i < accounts.length; i++) {
    for (let j = 0; j < cards.length; j++) {
      if (cards[j].id.indexOf(accounts[i].id) >= 0 &&
        accounts[i].info.amount.currency === cards[j].info.amount.currency) {
        accounts[i].cardID = cards[j].id
        accsSkipped.push(accounts[i])
      }
    }
  }
  var accs = accounts.filter(function (acc) {
    for (let i = 0; i < accsSkipped.length; i++) {
      if (accsSkipped[i].id === acc.id) {
        return false
      }
    }
    return true
  })
  accs = accs
    .concat(cards)
    .concat(deposits)
  return {
    accounts: accs,
    skipped: accsSkipped
  }
}

function transactionsUnique (array) {
  let a = array.concat()
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i].movements[0].id === a[j].movements[0].id &&
        a[i].movements[0].account.id === a[j].movements[0].account.id) {
        a.splice(j--, 1)
      }
    }
  }
  return a
}
