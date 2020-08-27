import padLeft from 'pad-left'
import { getIntervalBetweenDates } from '../../common/momentDateUtils'

export function convertAccounts (apiAccounts) {
  return convertAccountCard(apiAccounts)
    .concat(convertLoan(apiAccounts))
    .concat(convertDeposit(apiAccounts))
}

function convertAccountCard (apiAccounts) {
  if (!apiAccounts.accounts) {
    return null
  }

  let accounts = []
  for (let i = 0; i < apiAccounts.accounts.length; i++) {
    const apiAccount = apiAccounts.accounts[i]
    if (apiAccount.category !== 'account') {
      return null
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
        }
      }
    }
    accounts = accounts.concat(account)
  }
  return accounts
}

function convertDeposit (apiAccounts) {
  if (!apiAccounts.deposits) {
    return null
  }

  let accounts = []
  for (let i = 0; i < apiAccounts.deposits.length; i++) {
    const apiDeposit = apiAccounts.deposits[i]
    if (!apiDeposit.contract_number) {
      return null
    }
    let payoffInterval = {}
    for (const pattern of [
      /В конце срока/i,
      /Ежеквартально/i
    ]) {
      const match = apiDeposit.percentPaidPeriod.match(pattern)
      if (match) {
        payoffInterval = null
      }
    }
    if (payoffInterval === undefined) {
      console.log('Unexpected percentPaidPeriod ' + apiDeposit.percentPaydPeriod)
      return null
    }
    let payoffStep = 1
    if (payoffInterval === null) {
      payoffStep = 0
    }
    const account = {
      id: apiDeposit.account,
      type: 'deposit',
      title: apiDeposit.name,
      instrument: apiDeposit.currency,
      balance: apiDeposit.balance,
      capitalization: apiDeposit.capitalization,
      percent: apiDeposit.rate,
      startDate: new Date(parseDate(apiDeposit.open_date)),
      startBalance: apiDeposit.opening_balance,
      endDateOffset: Number(apiDeposit.duration),
      endDateOffsetInterval: 'day',
      payoffInterval: payoffInterval,
      payoffStep: payoffStep,
      syncIds: [apiDeposit.account]
    }
    accounts = accounts.concat(account)
  }
  return accounts
}

function convertLoan (apiAccounts) {
  if (!apiAccounts.loans) {
    return null
  }

  let accounts = []
  for (let i = 0; i < apiAccounts.loans.length; i++) {
    const apiLoan = apiAccounts.loans[i]
    if (!apiLoan.mainAccount) {
      return null
    }

    const fromDate = new Date(parseDate(apiLoan.openDate))
    const toDate = new Date(parseDate(apiLoan.endDate))
    const { interval, count } = getIntervalBetweenDates(fromDate, toDate)
    const account = {
      id: apiLoan.repaymentAccount,
      mainAccount: apiLoan.mainAccount,
      type: 'loan',
      title: apiLoan.name,
      instrument: apiLoan.currency,
      balance: -apiLoan.amount,
      capitalization: apiLoan.capitalization || true,
      percent: apiLoan.interestRate,
      startDate: fromDate,
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
  }
  const instrument = account.instrument

  const transaction = {
    date: new Date(rawTransaction.view.dateCreated),
    hold: rawTransaction.view.state !== 'processed',
    merchant: {
      country: rawTransaction.details?.purpose?.slice(-3) || null,
      city: rawTransaction.details?.terminal?.city || null,
      title: rawTransaction.view.descriptions.operationDescription || rawTransaction.view.mainRequisite,
      mcc: null,
      location: null
    },
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
  if (rawTransaction.view.mainRequisite) {
    const mcc = rawTransaction.view.mainRequisite.match('МСС: (\\d+)')
    if (mcc) {
      transaction.merchant.mcc = Number(mcc[1])
    }
  }
  ;[
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice, accountsById))

  return transaction
}

function parseInnerTransfer (rawTransaction, transaction, invoice, accountsById) {
  if (rawTransaction.view.direction === 'internal' && rawTransaction.info.operationType === 'payment') {
    const account1 = accountsById[rawTransaction.details['payer-account']]
    const account2 = accountsById[rawTransaction.details['payee-account']]
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
  } else if (rawTransaction.view.direction === 'internal' && rawTransaction.info.operationType === 'account_transaction') {
    const account1 = accountsById[rawTransaction.details.payerAccount]
    const account2 = accountsById[rawTransaction.details.payeeAccount]
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
  }
  return false
}

function parseOuterTransfer (rawTransaction, transaction, invoice, accountsById) {
  for (const pattern of [
    /p2p/i,
    /sbp_in/i,
    /transfer-in/i
  ]) {
    const match = rawTransaction.info.subType.match(pattern)
    if (match) {
      transaction.comment = rawTransaction.view.comment || rawTransaction.view.mainRequisite
      transaction.merchant = null
      transaction.movements.push(
        {
          id: null,
          account: {
            type: null,
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
        transaction.comment = rawTransaction.view.descriptions.productType
      }
      return true
    }
  }
  return false
}

function parseDate (stringDate) {
  const date = stringDate.match(/(\d{2}).(\d{2}).(\d{4})/)
  return new Date(`${date[3]}-${padLeft(date[2], 2, '0')}-${padLeft(date[1], 2, '0')}T00:00:00+03:00`)
}
