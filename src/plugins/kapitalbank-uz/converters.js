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
    syncID: [account.account],

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
    syncID: [wallet.account],

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
    syncID: [rawCard.pan],

    instrument: rawCard.currency.name,
    type: 'ccard',

    balance: rawCard.balance / 100
  }

  if (rawCard.account) {
    card.syncID.push(rawCard.account)
  }

  if (rawCard.maskedPan) {
    card.syncID.push(rawCard.maskedPan)
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
      mcc: null,
      location: rawTransaction.street
    },
    movements: [
      {
        id: String(rawTransaction.utrnno),
        account: { id: cardId.id },
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
  const fee = Number(rawTransaction.fee.replace(/\s/g, '').replace(',', '.'))

  const invoice = {
    sum: amount,
    instrument: rawTransaction.currency.name
  }

  const transaction = {
    date: new Date(rawTransaction.transDate),
    hold: false,
    merchant: {
      country: null,
      city: null,
      title: rawTransaction.merchantName,
      mcc: null,
      location: null
    },
    movements: [
      {
        id: null,
        account: { id: cardId.id },
        invoice: invoice.instrument === cardId.instrument ? null : invoice,
        sum: invoice.instrument === cardId.instrument ? invoice.sum : null,
        fee: fee
      }
    ],
    comment: rawTransaction.transType
  }

  for (const pattern of [
    /Входящий перевод/i,
    /Возврат средств/i,
    /Пополнение карты/i
  ]) {
    const match = rawTransaction.transType.match(pattern)
    if (match) {
      transaction.movements.push(
        {
          id: null,
          account: {
            type: 'cash',
            instrument: invoice.instrument,
            syncIds: [cardId.id.slice(-4)], // Что здесь надо???
            company: null
          },
          invoice: null,
          sum: -invoice.sum,
          fee: fee // Или -fee  ???
        })
    }
  }

  return transaction
}

/*
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
 */

/**
 * Конвертер транзакции по карте платежной системы Visa из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertVisaCardTransaction (cardId, rawTransaction) {
  const amount = Number(rawTransaction.amount)
  const fee = Number(rawTransaction.fee)

  if (amount === 0) {
    return null
  }

  const invoice = {
    sum: amount,
    instrument: rawTransaction.currency.name
  }

  const transaction = {
    date: new Date(rawTransaction.transDate),
    hold: false,
    merchant: {
      country: null,
      city: null,
      title: rawTransaction.merchantName,
      mcc: null,
      location: null
    },
    movements: [
      {
        id: rawTransaction.back === true ? rawTransaction.transCode : rawTransaction.approvalCode,
        account: { id: cardId.id },
        invoice: invoice.instrument === cardId.instrument ? null : invoice,
        sum: invoice.instrument === cardId.instrument ? invoice.sum : null,
        fee: fee
      }
    ],
    comment: rawTransaction.transType
  }

  for (const pattern of [
    /Пополнение карты/i,
    /Получение средств/i
  ]) {
    const match = rawTransaction.transType.match(pattern)
    if (match) {
      transaction.movements.push(
        {
          id: null,
          account: {
            type: 'cash',
            instrument: invoice.instrument,
            syncIds: [cardId.id.slice(-4)], // Что здесь надо???
            company: null
          },
          invoice: null,
          sum: -invoice.sum,
          fee: fee // Или -fee  ???
        })
    }
  }

  return transaction
}

/*
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
 */

/**
 * Конвертер транзакции по кошельку из формата банка в формат Дзенмани
 *
 * @param walletId идентификатор кошелька
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertWalletTransaction (walletId, rawTransaction) { // Не проверенно тестами
  const invoice = {
    sum: rawTransaction.amount / 100,
    instrument: 'UZS'
  }
  const transaction = {
    date: new Date(rawTransaction.date),
    hold: false,
    merchant: {
      country: null,
      city: rawTransaction.city,
      title: rawTransaction.merchantName,
      mcc: null,
      location: rawTransaction.street
    },
    movements: [
      {
        id: walletId,
        account: { id: walletId.id },
        invoice: invoice.instrument === walletId.instrument ? null : invoice,
        sum: invoice.instrument === walletId.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment: null
  }

  return transaction
}

/*
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

 */

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
    merchant: null, // Что здесь надо???
    movements: [
      {
        id: rawTransaction.docId,
        account: { id: accountId.id },
        invoice: invoice.instrument === accountId.instrument ? null : invoice,
        sum: invoice.instrument === accountId.instrument ? invoice.sum : null,
        fee: 0 // Что здесь надо???
      },
      {
        id: null,
        account: {
          type: null,
          instrument: invoice.instrument,
          syncIds: [rawTransaction.docId.slice(-4)], // Что здесь надо???
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
