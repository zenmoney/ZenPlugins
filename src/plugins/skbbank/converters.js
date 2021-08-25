import padLeft from 'pad-left'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiAccounts) {
  return convertAccountCard(apiAccounts)
    .concat(convertLoan(apiAccounts))
    .concat(convertDeposit(apiAccounts))
}

function convertAccountCard (apiAccounts) {
  if (!apiAccounts.accounts) {
    return []
  }

  let accounts = []
  for (let i = 0; i < apiAccounts.accounts.length; i++) {
    const apiAccount = apiAccounts.accounts[i]
    if (apiAccount.category !== 'account') {
      continue
    }
    const account = {
      id: apiAccount.number,
      type: 'checking',
      title: apiAccount.name,
      balance: apiAccount.amount,
      instrument: apiAccount.currency,
      creditLimit: 0,
      syncIds: [apiAccount.number]
    }
    if (apiAccount.type === 'card') {
      account.type = 'ccard'
      account.storedId = apiAccount.cards
      for (let i = 0; i < apiAccounts.cards.length; i++) {
        if (apiAccount.cards.indexOf(apiAccounts.cards[i].storedId) >= 0) {
          account.syncIds.push(apiAccounts.cards[i].pan)
          if (apiAccounts.cards[i].loan_funds && apiAccounts.cards[i].loan_funds > 0) {
            account.creditLimit = apiAccounts.cards[i].loan_funds
          }
        }
      }
    }
    accounts = accounts.concat(account)
  }
  return accounts
}

function convertDeposit (apiAccounts) {
  if (!apiAccounts.deposits) {
    return []
  }

  let accounts = []
  for (let i = 0; i < apiAccounts.deposits.length; i++) {
    const apiDeposit = apiAccounts.deposits[i]
    if (!apiDeposit.contract_number) {
      continue
    }
    let payoffInterval = 'month'
    for (const pair of [
      [/В конце срока/i, null],
      [/Ежеквартально/i, 'month']
    ]) {
      const [regexp, interval] = pair
      const match = apiDeposit.percentPaidPeriod.match(regexp)
      if (match) {
        payoffInterval = interval
        break
      }
    }
    const account = {
      id: apiDeposit.account,
      type: 'deposit',
      title: apiDeposit.name,
      instrument: apiDeposit.currency,
      balance: apiDeposit.balance,
      capitalization: apiDeposit.capitalization,
      percent: apiDeposit.rate,
      startDate: parseDate(apiDeposit.open_date),
      startBalance: apiDeposit.opening_balance,
      endDateOffset: Number(apiDeposit.duration) || 1,
      endDateOffsetInterval: Number(apiDeposit.duration) ? 'day' : 'year',
      payoffInterval: payoffInterval,
      payoffStep: payoffInterval === 'month' ? 1 : 0,
      syncIds: [apiDeposit.account]
    }
    accounts = accounts.concat(account)
  }
  return accounts
}

function convertLoan (apiAccounts) {
  if (!apiAccounts.loans) {
    return []
  }

  let accounts = []
  for (let i = 0; i < apiAccounts.loans.length; i++) {
    const apiLoan = apiAccounts.loans[i]
    if (!apiLoan.mainAccount || apiLoan.productName?.match(/(card|карта)/i)) {
      continue
    }

    if (!apiLoan.openDate || !apiLoan.endDate) {
      console.log(apiLoan)
    }
    const fromDate = parseDate(apiLoan.openDate)
    const toDate = parseDate(apiLoan.endDate)
    const { interval, count } = getIntervalBetweenDates(fromDate, toDate)
    const account = {
      id: apiLoan.mainAccount,
      type: 'loan',
      title: apiLoan.name,
      instrument: apiLoan.currency,
      balance: -apiLoan.allowPaymentAmount,
      capitalization: apiLoan.capitalization || true,
      percent: apiLoan.interestRate,
      startDate: fromDate,
      startBalance: apiLoan.amount,
      payoffStep: 1,
      payoffInterval: 'month',
      endDateOffset: count,
      endDateOffsetInterval: interval,
      syncIds: [
        apiLoan.mainAccount
      ]
    }
    accounts = accounts.concat(account)
  }
  return accounts
}

export function groupAccountsById (accounts) {
  let accountsById = {}
  for (let a = 0; a < accounts.length; a++) {
    let accountId = {}
    const account = accounts[a]
    for (let i = 0; i < account.syncIds.length; i++) {
      accountId[account.syncIds[i]] = {
        id: account.id,
        instrument: account.instrument
      }
    }
    if (account.storedId) {
      const accountStorId = {}
      for (let b = 0; b < account.storedId.length; b++) {
        accountStorId[account.storedId[b]] = {
          id: account.id,
          instrument: account.instrument
        }
      }
      accountId = Object.assign(accountId, accountStorId)
    }
    accountsById = Object.assign(accountsById, accountId)
  }
  return accountsById
}

export function convertTransactions (apiTransactions, accountsById) {
  const transactions = []
  for (const apiTransaction of apiTransactions) {
    const transaction = convertTransaction(apiTransaction, accountsById)
    if (transaction) {
      transactions.push(transaction)
    }
  }
  return transactions
}

export function convertTransaction (rawTransaction, accountsById) {
  if (rawTransaction.view.state === 'rejected' || rawTransaction.info.subType === 'loan-repayment') {
    return null
  }

  const invoice = {
    sum: rawTransaction.view.direction === 'debit' ? -rawTransaction.view.amounts.amount : rawTransaction.view.amounts.amount,
    instrument: rawTransaction.view.amounts.currency
  }
  let account = accountsById[rawTransaction.view.productAccount] || accountsById[rawTransaction.view.productCardId]
  if (!account && rawTransaction.info.operationType === 'payment') {
    account = accountsById[rawTransaction.details['payee-card']]
  } else if (!account && rawTransaction.view.direction === 'internal') {
    account = accountsById[rawTransaction.details.payeeAccount]
  }
  if (!account) {
    return null
  }
  const instrument = account.instrument

  const transaction = {
    date: new Date(rawTransaction.view.dateCreated),
    hold: rawTransaction.view.state !== 'processed',
    merchant: null,
    movements: [
      {
        id: rawTransaction.info.id.toString(),
        account: { id: account.id },
        invoice: invoice.instrument === instrument ? null : invoice,
        sum: invoice.instrument === instrument ? invoice.sum
          : rawTransaction.view.direction === 'debit' ? -rawTransaction.details.convAmount : rawTransaction.details.convAmount,
        fee: 0
      }
    ],
    comment: null
  }
  ;[
    parseInnerTransfer,
    parseOuterTransfer,
    parseCashTransfer,
    parsePayee
  ].some(parser => parser(rawTransaction, transaction, invoice, accountsById))

  return transaction
}

function parseInnerTransfer (rawTransaction, transaction, invoice, accountsById) {
  if (rawTransaction.view.direction !== 'internal') {
    return false
  }
  let account1
  let account2
  if (rawTransaction.info.operationType === 'payment') {
    account1 = accountsById[rawTransaction.details['payer-account']]
    account2 = accountsById[rawTransaction.details['payee-account']]
  } else if (rawTransaction.info.operationType === 'account_transaction') {
    account1 = accountsById[rawTransaction.details.payerAccount]
    account2 = accountsById[rawTransaction.details.payeeAccount]
  }
  if (!account1 || !account2) {
    transaction.movements[0].sum = !account2 ? -invoice.sum : invoice.sum
    transaction.comment = rawTransaction.view.descriptions.operationDescription
    transaction.movements.push(
      {
        id: null,
        account: {
          type: rawTransaction.info.operationType === 'account_transaction' ? 'checking' : 'ccard',
          instrument: invoice.instrument,
          syncIds: !account1 ? [rawTransaction.details.payerAccount] : !account2 ? [rawTransaction.details.payeeAccount] : null,
          company: null
        },
        invoice: null,
        sum: !account2 ? invoice.sum : -invoice.sum,
        fee: 0
      })
    return transaction
  }

  transaction.comment = null
  transaction.merchant = null
  transaction.movements[0].account.id = account2.id
  transaction.movements.push(
    {
      id: transaction.movements[0].id,
      account: { id: account1.id },
      invoice: null,
      sum: -invoice.sum,
      fee: 0
    })

  return true
}

function parseOuterTransfer (rawTransaction, transaction, invoice, accountsById) {
  for (const pattern of [
    /p2p/i,
    /sbp_in/i,
    /transfer-in/i,
    /internal_physical_phone_number/i,
    /external_sbp_c2c/i,
    /internal_physical_card/i
  ]) {
    const match = rawTransaction.info.subType?.match(pattern)
    if (match) {
      transaction.comment = rawTransaction.view.comment || rawTransaction.view.mainRequisite
      transaction.movements.push(
        {
          id: null,
          account: {
            type: rawTransaction.info.operationType === 'account_transaction' ? 'checking' : 'ccard',
            instrument: invoice.instrument,
            syncIds: null,
            company: null
          },
          invoice: null,
          sum: -invoice.sum,
          fee: 0
        })
      if (rawTransaction.info.subType === 'p2p') {
        transaction.comment = rawTransaction.view.descriptions.operationDescription
        transaction.movements[1].account.syncIds = [rawTransaction.details['payer-card-mask-pan']]
      } else if (rawTransaction.info.subType === 'transfer-in') {
        transaction.comment = rawTransaction.view.descriptions.operationDescription || rawTransaction.view.descriptions.productType
      }
      return true
    }
  }
  return false
}

function parseCashTransfer (rawTransaction, transaction, invoice, accountsById) {
  for (const pattern of [
    /cash-in/i,
    /cash-out/i
  ]) {
    const match = rawTransaction.info.subType?.match(pattern)
    if (match) {
      transaction.movements.push({
        id: null,
        account: {
          type: 'cash',
          instrument: invoice.instrument,
          company: null,
          syncIds: null
        },
        invoice: null,
        sum: -invoice.sum,
        fee: 0
      })
    }
  }
  return false
}

function parsePayee (rawTransaction, transaction, invoice, accountsById) {
  for (const pattern of [
    /cash-back/i,
    /bonus/i,
    /interest/i,
    /fee-out/i
  ]) {
    const match = rawTransaction.info.subType?.match(pattern)
    if (match) {
      transaction.comment = rawTransaction.view.descriptions.operationDescription
      return false
    }
  }

  let title = rawTransaction.view.descriptions.operationDescription || rawTransaction.view.mainRequisite
  const titleCash = title.match(/(Внесение|Снятие) наличных (.*)/)
  if (titleCash) {
    title = titleCash[2]
  }
  if (title) {
    transaction.merchant = {
      country: rawTransaction.details?.purpose?.slice(-3) || null,
      city: rawTransaction.details?.terminal?.city || null,
      title: title,
      mcc: null,
      location: null
    }
    if (rawTransaction.view.mainRequisite) {
      const mcc = rawTransaction.view.mainRequisite.match('МСС: (\\d+)')
      if (mcc) {
        transaction.merchant.mcc = Number(mcc[1])
      }
    }
  }
  return false
}

function parseDate (stringDate) {
  const date = stringDate.match(/(\d{2}).(\d{2}).(\d{4})/)
  return new Date(`${date[3]}-${padLeft(date[2], 2, '0')}-${padLeft(date[1], 2, '0')}T00:00:00+03:00`)
}
