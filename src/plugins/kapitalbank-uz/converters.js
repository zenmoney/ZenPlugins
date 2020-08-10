/**
 * Конвертер счета из формата банка в формат Дзенмани
 *
 * @param account счет в формате банка
 * @returns счет в формате Дзенмани
 */
export function convertAccount (account) {
  return {
    id: String(account.id),
    title: 'Счёт ' + account.currency.name,
    syncID: [String(account.id), account.account, account.absId],

    instrument: account.currency.name,
    type: 'checking',

    balance: account.balance / 100
  }
}

/**
 * Конвертер кошелька из формата банка в формат Дзенмани
 *
 * @param wallet кошелек в формате банка
 * @returns кошелек в формате Дзенмани
 */
export function convertWallet (wallet) {
  return {
    id: String(wallet.id),
    title: 'Кошелёк ' + wallet.currency.name,
    syncID: [String(wallet.id), wallet.account, wallet.walletId],

    instrument: wallet.currency.name,
    type: 'checking',

    balance: wallet.balance / 100
  }
}

/**
 * Конвертер карты из формата банка в формат Дзенмани
 *
 * @param rawCard карта в формате банка
 * @returns карта в формате Дзенмани
 */
export function convertCard (rawCard) {
  if (rawCard.state !== 'ACTIVE') {
    return null
  }

  const card = {
    id: String(rawCard.id),
    title: rawCard.title,
    syncID: [String(rawCard.id), rawCard.pan.slice(-4)],

    instrument: rawCard.currency.name,
    type: 'ccard',

    balance: rawCard.balance / 100
  }

  if (rawCard.account) {
    card.syncID.push(rawCard.account)
  }

  return card
}
/*
export function convertTransaction (apiTransaction, account) {
  if (apiTransaction.status !== 'success') { // ??
    return null
  }
  if (apiTransaction.amount === 0) { // ??
    return null
  }

  const invoice = {
    sum: rawCard.credit === true ? rawCard.actamt / 100 : -rawCard.actamt / 100,
    instrument: rawCard.amount_currency || account.instrument
  }
  const transaction = {
    date: new Date(apiTransaction.datetime),
    hold: false,
    merchant: null,
    movements: [
      {
        id: apiTransaction.operation_id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment: null
  };
  [
    parseMcc,
    parseYandexMoneyTransfer,
    parseTransfer,
    parsePayee
  ].some(parser => parser(apiTransaction, transaction, account, invoice))
  return transaction
}

 */

/**
 * Конвертер транзакции по карте платежной системы UzCard из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertUzcardCardTransaction (cardId, rawTransaction) {
  const invoice = {
    sum: rawTransaction.credit === true ? rawTransaction.actamt / 100 : -rawTransaction.actamt / 100,
    instrument: 'UZS'
  }
  const transaction = {
    date: new Date(rawTransaction.utime),
    hold: false,
    merchant: {
      country: null,
      city: rawTransaction.city,
      title: rawTransaction.merchantName,
      // mcc: (transaction.merchant && transaction.merchant.mcc) || null,
      location: rawTransaction.street
    },
    movements: [
      {
        id: String(rawTransaction.utrnno),
        // account: { id: account.id },
        invoice: invoice.instrument === cardId.instrument ? null : invoice,
        sum: invoice.instrument === cardId.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment: null
  }

  return transaction
}

/*
  const transaction = {
    id: String(rawTransaction.utrnno),
    payee: rawTransaction.merchantName,
    date: rawTransaction.utime
  }

  if (rawTransaction.credit) {
    transaction.incomeAccount = cardId
    transaction.income = rawTransaction.actamt / 100
    transaction.outcomeAccount = cardId
    transaction.outcome = 0
  } else {
    transaction.outcomeAccount = cardId
    transaction.outcome = rawTransaction.actamt / 100
    transaction.incomeAccount = cardId
    transaction.income = 0
  }
*/

/**
 * Конвертер транзакции по карте платежной системы Humo из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertHumoCardTransaction (cardId, rawTransaction) {
  const amount = Number(rawTransaction.amount.replace(/\s/g, '').replace(',', '.'))

  const transaction = {
    payee: rawTransaction.merchantName,
    date: rawTransaction.transDate
  }

  if (amount > 0) {
    transaction.incomeAccount = cardId
    transaction.income = amount
    transaction.outcomeAccount = cardId
    transaction.outcome = 0
  } else {
    transaction.outcomeAccount = cardId
    transaction.outcome = -amount
    transaction.incomeAccount = cardId
    transaction.income = 0
  }

  return transaction
}

/**
 * Конвертер транзакции по карте платежной системы Visa из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertVisaCardTransaction (cardId, rawTransaction) {
  const amount = Number(rawTransaction.amount)

  if (amount === 0) {
    return null
  }

  const transaction = {
    payee: rawTransaction.merchantName,
    date: rawTransaction.transDate
  }

  if (amount > 0) {
    transaction.incomeAccount = cardId
    transaction.income = amount
    transaction.outcomeAccount = cardId
    transaction.outcome = 0
  } else {
    transaction.outcomeAccount = cardId
    transaction.outcome = -amount
    transaction.incomeAccount = cardId
    transaction.income = 0
  }

  return transaction
}

/**
 * Конвертер транзакции по кошельку из формата банка в формат Дзенмани
 *
 * @param walletId идентификатор кошелька
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertWalletTransaction (walletId, rawTransaction) {
  const transaction = {
    date: rawTransaction.date
  }

  if (rawTransaction.amount > 0) {
    transaction.incomeAccount = walletId
    transaction.income = rawTransaction.amount / 100
    transaction.outcomeAccount = walletId
    transaction.outcome = 0
  } else {
    transaction.outcomeAccount = walletId
    transaction.outcome = -rawTransaction.amount / 100
    transaction.incomeAccount = walletId
    transaction.income = 0
  }

  return transaction
}

/**
 * Конвертер транзакции по счету из формата банка в формат Дзенмани
 *
 * @param accountId идентификатор счета
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertAccountTransaction (accountId, rawTransaction) {
  const invoice = {
    sum: rawTransaction.amount / 100,
    instrument: rawTransaction.currency.name
  }
  const transaction = {
    date: new Date(rawTransaction.date),
    hold: false,
    merchant: null,
    movements: [
      {
        id: rawTransaction.docId,
        // account: { id: account.id },
        invoice: invoice.instrument === accountId.instrument ? null : invoice,
        sum: invoice.instrument === accountId.instrument ? invoice.sum : null,
        fee: 0 // ???
      },
      {
        id: null,
        account: {
          type: null,
          instrument: invoice.instrument,
          syncIds: [rawTransaction.docId.slice(-4)], // ???
          company: null
        },
        invoice: null,
        sum: -invoice.sum,
        fee: 0
      }
    ],
    comment: rawTransaction.details
  }

  return transaction
}

/*
const transaction = {
    id: rawTransaction.docId,
    date: rawTransaction.date
  }

  if (rawTransaction.amount > 0) {
    transaction.incomeAccount = accountId
    transaction.income = rawTransaction.amount / 100
    transaction.outcomeAccount = accountId
    transaction.outcome = 0
  } else {
    transaction.outcomeAccount = accountId
    transaction.outcome = -rawTransaction.amount / 100
    transaction.incomeAccount = accountId
    transaction.income = 0
  }

  return transaction
}
 */
