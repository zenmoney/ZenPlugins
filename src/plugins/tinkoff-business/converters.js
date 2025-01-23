import currencies from '../../common/codeToCurrencyLookup'
import { mergeTransfers } from '../../common/mergeTransfers'

export function convertAccount (apiAccount) {
  const balance = typeof apiAccount.balance.balance === 'number'
    ? {
        balance: apiAccount.balance.balance,
        creditLimit: Math.round((apiAccount.balance.otb - apiAccount.balance.balance) * 100) / 100
      }
    : {
        available: Math.round((apiAccount.balance.otb + apiAccount.balance.authorized) * 100) / 100
      }
  return {
    id: apiAccount.accountNumber,
    type: 'checking',
    title: apiAccount.name ? apiAccount.name : ('Счёт ' + currencies[apiAccount.currency]),
    instrument: currencies[apiAccount.currency],
    ...balance,
    syncID: [apiAccount.accountNumber]
  }
}

export function convertToZenMoneyTransactions (transactionData) {
  return mergeTransfers({
    items: transactionData,
    makeGroupKey: data => data.groupId,
    selectReadableTransaction: data => data.transaction
  })
}

export function convertTransaction (apiTransaction, account, accountsById) {
  const isOutcome = apiTransaction.payerAccount === account.id
  const payee = apiTransaction.payerAccount === account.id ? apiTransaction.recipient : apiTransaction.payerName
  const transaction = {
    date: new Date(apiTransaction.date),
    hold: false,
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: isOutcome ? -apiTransaction.amount : apiTransaction.amount,
        fee: 0
      }
    ],
    comment: apiTransaction.paymentPurpose || null,
    merchant: payee
      ? {
          title: payee,
          city: null,
          country: null,
          mcc: null,
          location: null
        }
      : null
  };
  [
    parseCashWithdrawal,
    parseCardTransfer,
    parsePayeeInComment,
    parsePayee
  ].some(parser => parser(transaction, account))
  const groupId = apiTransaction.id && accountsById[apiTransaction.payerAccount] && accountsById[apiTransaction.recipientAccount]
    ? `${apiTransaction.id}-${apiTransaction.payerAccount}-${apiTransaction.recipientAccount}-${apiTransaction.date}`
    : null
  return {
    transaction,
    groupId
  }
}

function parseCashWithdrawal (transaction, account) {
  if (!transaction.comment) {
    return false
  }
  if (['снятия наличных'].some(str => transaction.comment.indexOf(str) >= 0)) {
    transaction.comment = null
    transaction.merchant = null
    transaction.movements.push({
      id: null,
      account: {
        type: 'cash',
        instrument: account.instrument,
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

function parseCardTransfer (transaction, account) {
  if (!transaction.comment) {
    return false
  }
  for (const regex of [
    /^Перевод с карты \*(\d{4})/i
  ]) {
    const match = transaction.comment.match(regex)
    if (match) {
      transaction.movements.push({
        id: null,
        account: {
          type: 'ccard',
          instrument: account.instrument,
          company: null,
          syncIds: [match[1]]
        },
        invoice: null,
        sum: -transaction.movements[0].sum,
        fee: 0
      })
      return true
    }
  }
  return false
}

export function parseMerchant (str) {
  str = str.trim()
  const parts = str.split(' ')
  let title = str
  let city = null
  let country = null
  if (parts.length > 2 && parts[parts.length - 1].length === 3) {
    if (parts.length > 3 && parts[parts.length - 2] === 'G') {
      title = parts.slice(0, parts.length - 3).join(' ')
      city = parts[parts.length - 3]
      country = parts[parts.length - 1]
    } else {
      title = parts.slice(0, parts.length - 2).join(' ')
      city = parts[parts.length - 2]
      country = parts[parts.length - 1]
    }
  }
  return {
    title,
    city,
    country
  }
}

function parsePayeeInComment (transaction, account) {
  if (!transaction.comment) {
    return false
  }
  for (const regex of [
    /Отражение операции оплаты по карте номер [\d.]+ (.*). Договор/i,
    /Опл\.по Дог.*руб\. (.*)$/
  ]) {
    const match = transaction.comment.match(regex)
    if (match) {
      transaction.comment = null
      transaction.merchant = {
        ...parseMerchant(match[1]),
        mcc: null,
        location: null
      }
      return true
    }
  }
  return false
}

function parsePayee (transaction, account) {
  if (!transaction.merchant) {
    return false
  }
  for (const regex of [
    /^ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ\s+(.+)/i,
    /^(.+)\s\/\/\s/i,
    /^(.+)\s*р\/с/i
  ]) {
    const match = transaction.merchant.title.match(regex)
    if (match) {
      transaction.merchant.title = match[1].trim()
      return false
    }
  }
  return false
}
