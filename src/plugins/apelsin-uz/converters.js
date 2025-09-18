import { dateInTimezone, toISODateString } from '../../common/dateUtils'

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
    syncIds: [account.account],
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
    syncIds: [wallet.account || String(wallet.id)],
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
    syncIds: [rawCard.pan],
    instrument: rawCard.currency.name,
    type: 'ccard',
    balance: rawCard.balance / 100
  }

  if (!rawCard.title) {
    card.title = rawCard.type + ' *' + rawCard.pan.slice(-4)
  }

  // В связи с проблемами у пользователей подключения плагина считаю целесообразным убрать р/с из массива неизменных идентификаторов. Есть два фактора влияющие на появление ошибок:
  //   1. Структура р/с в Узбекистане едина для всех банков и вполне нормально, что р/с карт разных банков могут совпадать.
  //   2. В приложениях одного банка можно добавлять карты платежных систем UzCard и Humo других банков, и получать по ним выписку, потому что процессинги этих платежных систем централизованы (не in-house).
  /*
  if (rawCard.account) {
    card.syncIds.push(rawCard.account)
  }
  */

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
  if (rawTransaction.actamt < 0.0001) {
    return null
  }
  const invoice = {
    sum: rawTransaction.credit === true || rawTransaction.reversal === true ? rawTransaction.actamt / 100 : -rawTransaction.actamt / 100,
    instrument: 'UZS'
  }
  const transaction = {
    comment: null,
    date: new Date(rawTransaction.utime),
    hold: false,
    merchant: {
      country: null,
      city: rawTransaction.city = rawTransaction.city.match(/\w+/i) ? rawTransaction.city : null,
      title: rawTransaction.merchantName,
      mcc: null,
      location: null
    },
    movements: [
      {
        id: String(rawTransaction.utrnno),
        account: { id: cardId.id },
        invoice: invoice.instrument === cardId.instrument ? null : invoice,
        sum: invoice.instrument === cardId.instrument ? invoice.sum : null,
        fee: 0
      }
    ]
  };
  [
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice))

  return transaction
}

/**
 * Конвертер транзакции по карте платежной системы Humo из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertHumoCardTransaction (card, rawTransaction) {
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
        account: { id: card.id },
        invoice: invoice.instrument === card.instrument ? null : invoice,
        sum: invoice.instrument === card.instrument ? invoice.sum : null,
        fee
      }
    ],
    comment: null
  };
  [
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice, fee))

  return transaction
}

/**
 * Конвертер транзакции по карте платежной системы Visa из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertVisaCardTransaction (card, rawTransaction) {
  let amount = Number(rawTransaction.amount)
  let fee = Number(rawTransaction.fee)

  if (amount === 0) {
    return null
  }

  /*
    Если сумма `amount` положительная, т.е. доходная, то минусуем комиссию, таким образом сумма пополнения уменьшится
    Если сумма `amount` отрицательная, т.е. расходная, то тоже минисуем комиссию, таким образом сумма расхода увеличится

    Вообще сумма `fee` возвращается всегда положительной с API, т.е. это точно не кэшбек, а расход, но всё равно на всякий случай берем модуль числа
  */
  if (Math.abs(fee) > Math.abs(amount)) {
    amount -= Math.abs(fee)
    fee = 0
  }

  const invoice = {
    sum: amount,
    instrument: rawTransaction.currency.name
  }

  const transaction = {
    date: new Date(rawTransaction.transDate),
    hold: false,
    merchant: rawTransaction.back === false
      ? {
          country: null,
          city: null,
          title: rawTransaction.merchantName,
          mcc: null,
          location: null
        }
      : null,
    movements: [
      {
        id: null,
        account: { id: card.id },
        invoice: invoice.instrument === card.instrument ? null : invoice,
        sum: invoice.instrument === card.instrument ? invoice.sum : null,
        fee: fee ? -fee : 0
      }
    ],
    comment: null
  };
  [
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice, fee))

  return transaction
}

function parseOuterTransfer (rawTransaction, transaction, invoice, fee) {
  if (rawTransaction.transType && ![
    /^\d+$/,
    /товар.* и услуг/i
  ].some(regexp => regexp.test(rawTransaction.transType))) {
    transaction.comment = rawTransaction.transType
  }
  return false
}

function parseInnerTransfer (rawTransaction, transaction, invoice, fee) {
  return false
}

/**
 * Конвертер транзакции по карте платежной системы Visa от Uzum из формата банка в формат Дзенмани
 *
 * @param card карта
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertUzumVisaCardTransaction (card, rawTransaction) {
  let amount = Number(rawTransaction.amount)
  let fee = Number(rawTransaction.fee)

  if (amount === 0) {
    return null
  }

  /*
    Если поле `transType` равно `DEBIT`, то это расходная транзакция, и сумма должна быть отрицательной
    Если поле `transType` равно `CREDIT`, то это доходная транзакция, и сумма должна быть положительной
  */
  if (rawTransaction.transType === 'DEBIT') {
    amount = -Math.abs(amount)
  } else if (rawTransaction.transType === 'CREDIT') {
    amount = Math.abs(amount)
  }

  /*
    Если сумма `amount` положительная, т.е. доходная, то минусуем комиссию, таким образом сумма пополнения уменьшится
    Если сумма `amount` отрицательная, т.е. расходная, то тоже минисуем комиссию, таким образом сумма расхода увеличится

    Вообще сумма `fee` возвращается всегда положительной с API, т.е. это точно не кэшбек, а расход, но всё равно на всякий случай берем модуль числа
  */
  if (Math.abs(fee) > Math.abs(amount)) {
    amount -= Math.abs(fee)
    fee = 0
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
        id: rawTransaction.transactionId,
        account: { id: card.id },
        invoice: invoice.instrument === card.instrument ? null : invoice,
        sum: invoice.instrument === card.instrument ? invoice.sum : null,
        fee: fee ? -fee : 0
      }
    ],
    comment: null
  };
  [
    parseInnerTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice, fee))

  return transaction
}

/**
 * Конвертер транзакции по карте платежной системы Mastercard из формата банка в формат Дзенмани
 *
 * @param cardId идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertMasterCardTransaction (card, rawTransaction) {
  let amount = Number(rawTransaction.amount)
  let fee = Number(rawTransaction.fee)

  if (amount === 0) {
    return null
  }

  /*
    Если сумма `amount` положительная, т.е. доходная, то минусуем комиссию, таким образом сумма пополнения уменьшится
    Если сумма `amount` отрицательная, т.е. расходная, то тоже минисуем комиссию, таким образом сумма расхода увеличится

    Вообще сумма `fee` возвращается всегда положительной с API, т.е. это точно не кэшбек, а расход, но всё равно на всякий случай берем модуль числа
  */
  if (Math.abs(fee) > Math.abs(amount)) {
    amount -= Math.abs(fee)
    fee = 0
  }

  const invoice = {
    sum: amount,
    instrument: rawTransaction.currency.name
  }

  const transaction = {
    date: new Date(rawTransaction.transDate),
    hold: false,
    merchant: rawTransaction.back === false
      ? {
          country: null,
          city: null,
          title: rawTransaction.merchantName,
          mcc: null,
          location: null
        }
      : null,
    movements: [
      {
        id: null,
        account: { id: card.id },
        invoice: invoice.instrument === card.instrument ? null : invoice,
        sum: invoice.instrument === card.instrument ? invoice.sum : null,
        fee: fee ? -fee : 0
      }
    ],
    comment: null
  };
  [
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice, fee))

  return transaction
}

/**
 * Конвертер транзакции по кошельку из формата банка в формат Дзенмани
 *
 * @param walletId идентификатор кошелька
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertWalletTransaction (wallet, rawTransaction) {
  const invoice = {
    sum: rawTransaction.amount / 100,
    instrument: wallet.instrument
  }
  const transaction = {
    date: new Date(rawTransaction.date),
    hold: false,
    merchant: null,
    movements: [
      {
        id: null,
        account: { id: wallet.id },
        invoice: invoice.instrument === wallet.instrument ? null : invoice,
        sum: invoice.instrument === wallet.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment: rawTransaction.details
  };
  [
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice))

  return transaction
}

/**
 * Конвертер транзакции по счету из формата банка в формат Дзенмани
 *
 * @param accountId идентификатор счета
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertAccountTransaction (account, rawTransaction) {
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
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    comment: rawTransaction.details
  }
  for (const regexp of [
    /Взнос ср-в на СКС/
  ]) {
    const match = rawTransaction.details.match(regexp)
    if (match) {
      transaction.groupKeys = [`${toISODateString(dateInTimezone(transaction.date, 300))}_${invoice.instrument}_${Math.abs(invoice.sum).toString()}`]
    }
  }
  [
    parsePayee,
    parseInnerTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice))

  return transaction
}

function parsePayee (rawTransaction, transaction, invoice) {
  for (const pattern of [
    /по клиенту\s+(\b[A-Z]+\s[A-Z]+\s[A-Z]+\b)\s*/,
    /согл заяв\s+(\b[A-Z]+\s[A-Z]+\s[A-Z]+\b)\s*/,
    /от\s+(\b[A-Z]+\s[A-Z]+\s[A-Z]+\b)\s*/
  ]) {
    const match = rawTransaction.details.match(pattern)
    if (match) {
      transaction.merchant = {
        country: null,
        city: null,
        title: match[1],
        mcc: null,
        location: null
      }
    }
  }
  return false
}
