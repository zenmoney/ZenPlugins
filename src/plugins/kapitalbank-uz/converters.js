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

/**
 * Конвертер транзакции по карте платежной системы UzCard из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertUzcardCardTransaction (cardId, rawTransaction) {
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

  return transaction
}

/**
 * Конвертер транзакции по карте платежной системы Humo из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertHumoCardTransaction (cardId, rawTransaction) {
  const amount = Number(rawTransaction.amount.replaceAll(' ', '').replace(',', '.'))

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
