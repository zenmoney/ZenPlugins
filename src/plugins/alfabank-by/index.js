import * as bank from './api'
import * as converters from './converters'

export async function scrape ({ preferences, fromDate, toDate }) {
  let loginData = await bank.login(preferences.isResident)
  var allAccounts = mergeAllAccounts(
    await bank.fetchAccounts(loginData.deviceID, loginData.sessionID),
    await bank.fetchCards(loginData.sessionID),
    await bank.fetchDeposits(loginData.sessionID)
  )

  var accounts = allAccounts.accounts
    .map(converters.convertAccount)
    .filter(account => account !== null)
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].productType === 'CARD') {
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
    .reverse() // Чтоб дочерние карты были первыми в списке
  for (let i = 0; i < accountsSkipped.length; i++) {
    if (accountsSkipped[i].type === 'checking') {
      accounts.forEach(function (acc) {
        if (acc.type === 'card' && accountsSkipped[i].syncID[0].indexOf(acc.syncID[0]) !== -1) {
          accountsSkipped[i].cardID = acc.id
        }
      })
    }
  }
  mergeCredits(loginData.sessionID, accounts, accountsSkipped)

  var transactions = (await bank.fetchTransactions(loginData.sessionID, accounts, fromDate))
    .map(transaction => converters.convertTransaction(transaction, accounts))
    .filter(transaction => transaction !== null)
  var transactionsAccSkipped = (await bank.fetchTransactions(loginData.sessionID, accountsSkipped, fromDate))
    .map(transaction => converters.convertTransaction(transaction, accountsSkipped))
    .filter(transaction => transaction !== null &&
      (transaction.bankOperation === 'OWNACCOUNTSTRANSFER' ||
        transaction.bankOperation === 'PERSONTRANSFERABB' ||
        transaction.bankOperation === 'CURRENCYEXCHANGE' ||
        transaction.bankOperation === 'COMPANYTRANSFER' ||
        transaction.bankTitle.indexOf('Поступление средств') >= 0 ||
        transaction.bankTitle.indexOf('Комиссия банка') >= 0 ||
        (transaction.bankTitle.indexOf('Погашение кредита') >= 0 && transaction.movements[0].sum < 0) ||
        transaction.byChildCard))
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
    delete transactions[i].bankTitle
    delete transactions[i].byChildCard
  }
  for (let i = 0; i < accounts.length; i++) {
    delete accounts[i].isChildCard
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
  return mergeCards(accs, accsSkipped)
}

function mergeCards (accs, accsSkipped) {
  // merge parent and child credit cards
  let indexToRemove = null
  let cardIDCount = []
  for (let i = 0; i < accs.length; i++) {
    for (let j = i + 1; j < accs.length; j++) {
      if (accs[i].type === accs[j].type &&
        accs[i].type === 'CARD' &&
        accs[i].id.substr(1, 17) === accs[j].id.substr(1, 17)) {
        if (cardIDCount[accs[j].id.substr(1, 17)] < 1) {
          cardIDCount[accs[j].id.substr(1, 17)] !== undefined ? cardIDCount[accs[j].id.substr(1, 17)]++ : cardIDCount[accs[j].id.substr(1, 17)] = 0
          indexToRemove = j
          accs[j].info.description = accs[i].info.description.slice(-4)
          accs[j].id = accs[i].id
          accs[j].isChildCard = true
          accsSkipped.push(accs[j])
        }
      }
    }
  }
  if (indexToRemove !== null) {
    accs.splice(indexToRemove, 1)
  }
  return {
    accounts: accs,
    skipped: accsSkipped
  }
}

async function mergeCredits (sessionID, accounts, skippedAccounts) {
  var credits = (await bank.fetchCredits(sessionID))
    .map(converters.convertAccount)
  if (credits.length === 0) {
    return null
  }
  // Находим в рассрочке кредитный счет и прикрепляем его к карточке
  let indexToRemove = null
  for (let c = 0; c < credits.length; c++) {
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].type === 'card' && accounts[i].syncID[0].indexOf(credits[c].id) !== -1) {
        let detail = await bank.fetchLoanDetail(sessionID, credits[c])
        accounts[i] = converters.FillLoanAccount(detail, accounts[i])
        credits[c].cardID = accounts[i].id
        credits[c].syncID[0] = detail.iban.replace(/\s/g, '')
        skippedAccounts.push(credits[c])
        indexToRemove = c
        break
      }
    }
  }
  credits.splice(indexToRemove, 1)

  // Находим в рассрочке счет "рассрочки" и прикрепляем его к карточке
  indexToRemove = null
  for (let c = 0; c < credits.length; c++) {
    let creditDetail = await bank.fetchLoanDetail(sessionID, credits[c])
    for (let i = 0; i < accounts.length; i++) {
      if (accounts[i].type === 'card' &&
        accounts[i].creditLimit === creditDetail.amount.amount &&
        accounts[i].instrument === credits[c].instrument) {
        credits[c].cardID = accounts[i].id
        credits[c].syncID[0] = creditDetail.iban.replace(/\s/g, '')
        skippedAccounts.push(credits[c])
      }
    }
  }
  credits.splice(indexToRemove, 1)
  accounts.push(...credits)
}

function transactionsUnique (array) {
  let a = array.concat()
  for (let i = 0; i < a.length; ++i) {
    for (let j = i + 1; j < a.length; ++j) {
      if (a[i].movements[0].id === a[j].movements[0].id &&
        a[i].date.getTime() === a[j].date.getTime() &&
        a[i].movements[0].account.id === a[j].movements[0].account.id &&
        a[i].movements[0].sum === a[j].movements[0].sum) {
        a.splice(j--, 1)
      }
    }
  }
  return a
}
