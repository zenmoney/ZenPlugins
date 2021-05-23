import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
const MS_PER_DAY = 1000 * 60 * 60 * 24

export function processAccounts (json) {
  const accounts = []
  let skipAccount = 0
  for (const accountsGroup in json) {
    switch (accountsGroup) {
      case 'cardAccount':
        accounts.push(...json[accountsGroup].map(parseCardAccount))
        break
      case 'depositAccount':
        accounts.push(...json[accountsGroup].map(parseDepositAccount))
        break
      case 'status':
        break
      case 'currentAccount':
        accounts.push(...json[accountsGroup].map(parseCheckingAccount))
        break
      default:
        skipAccount += json[accountsGroup].length
    }
  }

  console.log(`Не обработано ${skipAccount} счетов. Неизвестный тип счёта`)

  return accounts
}

function parseCheckingAccount (account) {
  return {
    id: account.internalAccountId,
    title: `Текущий ${account.personalizedName || account.productName}`,
    syncID: [account.internalAccountId.slice(-4)],

    instrument: codeToCurrencyLookup[account.currency],
    type: 'checking',

    balance: Number.parseFloat(account.balanceAmount),
    rkcCode: account.rkcCode
  }
}

function parseDepositAccount (account) {
  return {
    id: account.internalAccountId,
    title: `Депозит ${account.personalizedName || account.productName}`,
    syncID: [account.internalAccountId.slice(-4)],

    instrument: codeToCurrencyLookup[account.currency],
    type: 'deposit',

    balance: Number.parseFloat(account.balanceAmount),

    capitalization: true,
    percent: account.interestRate,
    startDate: new Date(account.openDate),
    endDateOffset: (new Date(account.endDate).getTime() - new Date(account.openDate).getTime()) / MS_PER_DAY,
    endDateOffsetInterval: 'day',
    payoffStep: 1,
    payoffInterval: 'month',

    rkcCode: account.rkcCode
  }
}

function parseCardAccount (account) {
  const card = (account.cards && account.cards[0]) || {}

  if (!card.cardHash) {
    return null
  }

  return {
    id: account.internalAccountId,
    type: 'card',
    instrument: codeToCurrencyLookup[account.currency],
    instrumentCode: account.currency,
    title: card.personalizedName || account.productName,
    balance: account.balance,
    syncID: [...account.cards.map(card => card.cardNumberMasked.slice(-4))],
    cardHash: card.cardHash,
    rkcCode: account.rkcCode
  }
}

export function convertTransaction (json) {
  json.sum = json.operationAmount || json.transactionAmount

  const transaction = {
    date: json.transactionDate,
    movements: [getMovement(json)],
    merchant: null,
    comment: getComment(json),
    hold: json.hold
  }
  // [
  //   parsePayee
  // ].some(parser => parser(transaction, json))

  return transaction
}

function getMovement (json) {
  return {
    id: `${json.id}` || null,
    account: { id: json.account_id },
    invoice: null,
    sum: json.sum,
    fee: 0
  }
}

function getComment (json) {
  const operationCurrencyCode = (json.operationCurrencyCode || json.accountCurrencyCode)
  if (json.transactionCurrencyCode !== operationCurrencyCode) {
    const transactionInfo = `Транзакция: ${json.transactionAmount} ${codeToCurrencyLookup[json.transactionCurrencyCode]}`
    return transactionInfo
  }
  return null
}

// function parsePayee (transaction, json) {
//   // интернет-платежи отображаем без получателя
//   if (!json.merchant ||
//     json.merchant.indexOf('BANK RESHENIE- OPLATA USLUG') >= 0) {
//     return false
//   }
//   transaction.merchant = {
//     mcc: null,
//     location: null
//   }
//   const merchant = json.merchant.replace(/&quot;/g, '"').split(';').map(str => str.trim())
//   if (merchant.length === 1) {
//     transaction.merchant.title = merchant[0]
//     transaction.merchant.city = null
//     transaction.merchant.country = null
//   } else if (merchant.length === 3) {
//     transaction.merchant.title = merchant[0]
//     transaction.merchant.city = merchant[1].trim()
//     transaction.merchant.country = merchant[2].trim()
//   } else if (merchant.length === 4) {
//     transaction.merchant.title = merchant[0].trim() + '; ' + merchant[1].trim()
//     transaction.merchant.city = merchant[2].trim()
//     transaction.merchant.country = merchant[3].trim()
//   } else {
//     throw new Error('Ошибка обработки транзакции с получателем: ' + json.merchant)
//   }
// }

// export function merge (transactions, operations) {
//   const merged = operations
//   for (const tr of transactions) {
//     tr.hold = !operations.some((operation) => {
//       return Math.abs(operation.transactionDate - tr.transactionDate) < MS_PER_DAY &&
//       operation.transactionAmount === tr.transactionAmount &&
//       operation.transactionCurrencyCode === tr.transactionCurrencyCode &&
//       operation.account_id === tr.account_id
//     })
//     if (tr.hold) {
//       merged.push(tr)
//     }
//   }
//   return merged
// }
