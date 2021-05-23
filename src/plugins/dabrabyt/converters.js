import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
// const MS_PER_DAY = 1000 * 60 * 60 * 24

export function processAccounts (json) {
  if (json.cards && json.cards.length > 0) { // only loading card accounts
    const account = {
      id: json.cardAccountNumber,
      type: 'card',
      instrument: codeToCurrencyLookup[json.currency],
      instrumentCode: json.currency,
      balance: Number.parseFloat(json.availableAmount),
      syncID: [],
      productType: json.productName,
      cardHash: json.cards[0].cardHash,
      bankCode: json.bankCode,
      accountType: json.accountType,
      rkcCode: json.rkcCode
    }

    for (const el of json.cards) {
      account.syncID.push(el.cardNumberMasked.slice(-4))
    }

    if (!account.title) {
      account.title = json.productName + '*' + account.syncID[0]
    }

    return account
  }
  return null
}

// export function convertTransaction (json) {
//   json.sum = json.operationAmount || json.transactionAmount

//   const transaction = {
//     date: json.transactionDate,
//     movements: [getMovement(json)],
//     merchant: null,
//     comment: getComment(json),
//     hold: json.hold
//   };
//   [
//     parsePayee
//   ].some(parser => parser(transaction, json))

//   return transaction
// }

// function getMovement (json) {
//   return {
//     id: json.id || null,
//     account: { id: json.account_id },
//     invoice: null,
//     sum: json.sum,
//     fee: 0
//   }
// }

// function getComment (json) {
//   const operationCurrencyCode = (json.operationCurrencyCode || json.accountCurrencyCode)
//   if (json.transactionCurrencyCode !== operationCurrencyCode) {
//     const transactionInfo = `Транзакция: ${json.transactionAmount} ${codeToCurrencyLookup[json.transactionCurrencyCode]}`
//     return json.hold ? `Внимание, невозможно расчитать корректный курс конверсии. ${transactionInfo}` : transactionInfo
//   }

//   if (json.operationName && json.operationName.indexOf('Зачисление CashBack') === 0) {
//     return 'Зачисление CashBack'
//   }
//   return null
// }

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
