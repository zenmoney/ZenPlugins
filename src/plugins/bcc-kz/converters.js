export function convertAccounts (apiAccounts) {
  const accounts = []
  for (const apiAccount of apiAccounts) {
    if (apiAccount.access_level === 0) {
      continue
    }
    const account = []
    switch (apiAccount.structType) {
      case 'card':
        switch (apiAccount.card_type) {
          case 'debit':
            account.push({
              product: {
                productId: apiAccount.id.toString(),
                productType: 'ccard'
              },
              accounts: [convertDebitCard(apiAccount)]
            })
            if (apiAccount.multiaccs) {
              for (const multiacc of apiAccount.multiaccs) {
                account[0].accounts.push(convertCurrentAccount(multiacc))
              }
            }
            filterDoubleCards(apiAccount, accounts, account)
            break
          case 'credit':
            account.push({
              product: {
                productId: apiAccount.id.toString(),
                productType: 'ccard'
              },
              accounts: [convertCreditCard(apiAccount)]
            })
            filterDoubleCards(apiAccount, accounts, account)
        }
        break
      case 'loan':
        account.push({
          product: {
            productId: apiAccount.id.toString(),
            productType: 'loan'
          },
          accounts: [convertLoan(apiAccount)]
        })
        filterDoubleLoanCurrent(apiAccount, accounts, account)
        break
      case 'current':
        accounts.push({
          product: {
            productId: apiAccount.id.toString(),
            productType: 'checking'
          },
          accounts: [convertCurrentAccount(apiAccount)]
        })
        break
      case 'deposit':
        accounts.push({
          product: {
            productId: apiAccount.id.toString(),
            productType: 'deposit'
          },
          accounts: [convertDeposit(apiAccount)]
        })
        break
      case 'broker':
        accounts.push({
          product: {
            productId: apiAccount.id.toString(),
            productType: 'investment'
          },
          accounts: [convertBrokerAccount(apiAccount)]
        })
        break
      case 'metal':
        accounts.push({
          product: {
            productId: apiAccount.id.toString(),
            productType: 'checking'
          },
          accounts: [convertMetal(apiAccount)]
        })
        break
      default:
        console.assert(false, `unknown account type [${apiAccount.structType}]`, apiAccount)
    }
  }
  return accounts
}

function filterDoubleCards (apiAccount, accounts, account) {
  const indexDouble = accounts.indexOf(accounts.find(item => item.accounts[0].syncIds.indexOf(apiAccount.account20) >= 0))
  if (indexDouble >= 0) {
    if (accounts[indexDouble].accounts[0].virtual && !account[0].accounts[0].virtual) {
      const syncIds = accounts[indexDouble].accounts[0].syncIds
      syncIds.splice(0, 1)
      account[0].accounts[0].syncIds.push(...syncIds)
      accounts.splice(indexDouble, 1, ...account)
    } else {
      accounts[indexDouble].accounts[0].syncIds.push(account[0].accounts[0].syncIds[1])
    }
  } else {
    accounts.push(...account)
  }
  return accounts
}

function filterDoubleLoanCurrent (apiAccount, accounts, account) {
  const indexDouble = accounts.indexOf(accounts.find(item => item.accounts[0].syncIds.indexOf(apiAccount.repay) >= 0))
  if (indexDouble >= 0) {
    accounts[indexDouble].product.productType = 'loan'
    accounts[indexDouble].accounts.push(...account[0].accounts)
  } else {
    accounts.push(...account)
  }
  return accounts
}

function convertMetal (apiAccount) {
  return {
    id: apiAccount.id.toString(),
    type: 'checking',
    title: apiAccount.product,
    instrument: parseMetalInstrument(apiAccount.currency),
    syncIds: [apiAccount.account20],
    balance: parseFloat(apiAccount.balance)
  }
}

function parseMetalInstrument (code) {
  switch (code) {
    case 'XAU':
      return 'A98'
    case 'XAG':
      return 'A99'
    case 'XPT':
      return 'A76'
    case 'XPD':
      return 'A33'
    default:
      return code
  }
}

function convertBrokerAccount (apiAccount) {
  return {
    id: apiAccount.id.toString(),
    type: 'investment',
    title: 'Брокерский счёт',
    instrument: apiAccount.currency,
    syncIds: [apiAccount.account20],
    balance: apiAccount.balance !== 'Нет данных' ? parseFloat(apiAccount.balance) : null
  }
}

function convertDeposit (apiAccount) {
  const balance = getBalance(apiAccount)
  return {
    id: apiAccount.id.toString(),
    type: 'deposit',
    title: `${apiAccount.product} ${apiAccount.note}`,
    instrument: apiAccount.currency,
    syncIds: [apiAccount.account20],
    balance,
    startDate: parseDate(apiAccount.open_date),
    startBalance: balance,
    capitalization: true,
    percent: parseFloat(apiAccount.percent),
    ...parsePeriod(apiAccount),
    payoffInterval: 'month',
    payoffStep: 1
  }
}

function convertLoan (apiAccount) {
  const balance = parseFloat(apiAccount.balance)
  return {
    id: apiAccount.id.toString(),
    type: 'loan',
    title: apiAccount.note,
    instrument: apiAccount.currency,
    syncIds: [
      apiAccount.account20
    ],
    balance,
    startDate: parseDate(apiAccount.open_date),
    startBalance: parseFloat(apiAccount.amount),
    capitalization: true,
    percent: parseFloat(apiAccount.percent),
    ...parsePeriod(apiAccount),
    payoffInterval: 'month',
    payoffStep: 1
  }
}

function parsePeriod (apiAccount) {
  const month = /(\d+) (:?месяц)/i.exec(apiAccount.period)
  if (month) {
    return {
      endDateOffset: parseInt(month[1]),
      endDateOffsetInterval: 'month'
    }
  }
  const year = /(\d+) (:?год|лет)/i.exec(apiAccount.period)
  if (year) {
    return {
      endDateOffset: parseInt(month[1]),
      endDateOffsetInterval: 'year'
    }
  }

  console.assert(false, 'cant parse period', apiAccount)
}

function convertDebitCard (apiAccount) {
  let virtual
  if (/Virtual/i.test(apiAccount.type)) {
    virtual = { virtual: true }
  }
  return {
    id: apiAccount.id.toString(),
    type: 'ccard',
    title: apiAccount.note,
    instrument: apiAccount.currency,
    syncIds: [apiAccount.account20, extractCardLast4(apiAccount.card_num)],
    savings: false,
    balance: getBalance(apiAccount),
    ...virtual
  }
}

function convertCreditCard (apiAccount) {
  let virtual
  if (/Virtual/i.test(apiAccount.type)) {
    virtual = { virtual: true }
  }
  return {
    id: apiAccount.id.toString(),
    type: 'ccard',
    title: apiAccount.note,
    instrument: apiAccount.currency,
    syncIds: [apiAccount.account20, extractCardLast4(apiAccount.card_num)],
    savings: false,
    available: getBalance(apiAccount),
    creditLimit: apiAccount.credit_limit,
    totalAmountDue: parseFloat(apiAccount.details.debt_info.grace_amount),
    gracePeriodEndDate: apiAccount.paydate ? parseDate(apiAccount.paydate) : null,
    ...virtual
  }
}

function extractCardLast4 (cardNumber) {
  const digits = String(cardNumber ?? '').replace(/\D/g, '')
  if (digits.length >= 4) {
    return digits.slice(-4)
  }
  return String(cardNumber ?? '')
}

function convertCurrentAccount (apiAccount) {
  console.assert(apiAccount.type === 'CURRENT', 'unexpected current account', apiAccount)
  return {
    id: apiAccount.id.toString(),
    type: 'checking',
    title: apiAccount.note,
    instrument: apiAccount.currency,
    syncIds: [apiAccount.account20],
    savings: false,
    balance: getBalance(apiAccount)
  }
}

export function convertTransaction (apiTransaction, accounts) {
  if (apiTransaction.amount === 0 && apiTransaction.image !== 'transfers/own_transfer.png') {
    return null
  }
  const accountTransaction = accounts.find(item => item.instrument === apiTransaction.cur)
  const account = !accountTransaction ? accounts[0] : accountTransaction
  const sign = apiTransaction.is_income ? 1 : -1
  const invoice = {
    sum: sign * apiTransaction.amount,
    instrument: apiTransaction.cur
  }
  const transaction = {
    hold: apiTransaction.is_blocked,
    date: parseDateTime(apiTransaction.oper_date, apiTransaction.oper_time),
    movements: [
      {
        id: apiTransaction.trn_id?.toString() || null, // sometimes null
        account: { id: account.id },
        invoice: apiTransaction.cur === account.instrument ? null : invoice,
        sum: apiTransaction.cur === account.instrument ? invoice.sum : null,
        fee: sign === -1 && apiTransaction.fee !== 0 ? -apiTransaction.fee : 0
      }
    ],
    merchant: null,
    comment: apiTransaction.title
  };

  [
    parseInnerTransfer,
    parseOuterTransfer,
    parseCashTransfer,
    parseMerchant
  ].some(parser => parser(transaction, apiTransaction, invoice, accounts))

  return transaction
}

function parseInnerTransfer (transaction, apiTransaction, invoice, accounts) {
  if (apiTransaction.image === 'transfers/own_transfer.png' && apiTransaction.rrn === '') {
    transaction.movements[0].id = transaction.movements[0].id + (apiTransaction.is_income ? '+' : '-')
    if (apiTransaction.amount === 0 && apiTransaction.fee === apiTransaction.cms) {
      transaction.movements[0].sum = transaction.movements[0].fee
      transaction.movements[0].fee = 0
      return true
    }

    const peerTransferAccount = buildPeerTransferAccount(apiTransaction.title, apiTransaction.cur, accounts)
    if (peerTransferAccount) {
      transaction.movements.push({
        id: null,
        account: peerTransferAccount,
        invoice: null,
        sum: -transaction.movements[0].sum,
        fee: 0
      })
    }

    return true
  }
  return false
}

function extractPeerCardSyncId (title) {
  const match = /(?:карту|карты)\s+([0-9*]{4,})/i.exec(String(title ?? ''))
  if (!match) {
    return null
  }
  const digits = match[1].replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : null
}

function extractPeerAccountSyncId (title) {
  const match = /\b(KZ[0-9A-Z]{10,})\b/i.exec(String(title ?? ''))
  return match ? match[1].toUpperCase() : null
}

function buildPeerTransferAccount (title, instrument, accounts) {
  const peerCardSyncId = extractPeerCardSyncId(title)
  if (peerCardSyncId) {
    return {
      type: 'ccard',
      instrument,
      company: null,
      syncIds: [peerCardSyncId]
    }
  }

  const peerAccountSyncId = extractPeerAccountSyncId(title)
  if (!peerAccountSyncId) {
    return null
  }

  const peerAccount = accounts.find(account => account.syncIds && account.syncIds.includes(peerAccountSyncId))
  if (peerAccount) {
    return { id: peerAccount.id }
  }

  return {
    type: 'checking',
    instrument,
    company: null,
    syncIds: [peerAccountSyncId]
  }
}

function parseOuterTransfer (transaction, apiTransaction) {
  if (apiTransaction.image === 'transactions/transfer.png') {
    const peerCardSyncId = extractPeerCardSyncId(apiTransaction.title)
    transaction.movements.push({
      id: null,
      account: {
        type: 'ccard',
        instrument: apiTransaction.cur,
        company: null,
        syncIds: peerCardSyncId ? [peerCardSyncId] : null
      },
      invoice: null,
      sum: -transaction.movements[0].sum,
      fee: 0
    })

    return true
  }
  return false
}

function parseCashTransfer (transaction, apiTransaction) {
  if (apiTransaction.title.match(/^Снятие денег через банкомат/i)) {
    transaction.movements.push({
      id: null,
      account: {
        type: 'cash',
        instrument: apiTransaction.cur,
        company: null,
        syncIds: null
      },
      invoice: null,
      sum: -transaction.movements[0].sum,
      fee: 0
    })
    return true
  }
  return false
}

function parseMerchant (transaction, apiTransaction) {
  transaction.merchant = apiTransaction.description && apiTransaction.description !== ''
    ? {
        country: null,
        city: null,
        title: apiTransaction.description,
        mcc: null,
        location: null
      }
    : null
  transaction.comment = null
  return true
}

function parseDate (dateString) {
  // 27.09.2021
  const [day, month, year] = dateString.split('.')
  return new Date(`${year}-${month}-${day}T00:00:00.000+06:00`)
}

function parseDateTime (dateString, timeString) {
  // date 26.04.2021, time 17:05
  const [day, month, year] = dateString.split('.')
  const [hour, minutes] = timeString.split(':')
  return new Date(`${year}-${month}-${day}T${hour}:${minutes}:00.000+06:00`)
}

function getBalance (apiAccount) {
  return parseFloat(apiAccount.balance)
}
