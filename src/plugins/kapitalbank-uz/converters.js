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
    syncIds: [wallet.account],

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

  if (rawCard.account) {
    card.syncIds.push(rawCard.account)
  }

  if (rawCard.maskedPan) {
    card.syncIds.push(rawCard.maskedPan)
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
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice))
  transaction.comment = null

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
        fee: fee
      }
    ],
    comment: null
  };
  [
    parseTransfer,
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
    merchant: rawTransaction.back === false ? {
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
        fee: fee
      }
    ],
    comment: null
  };
  [
    parseTransfer,
    parseOuterTransfer
  ].some(parser => parser(rawTransaction, transaction, invoice, fee))

  return transaction
}

function parseOuterTransfer (rawTransaction, transaction, invoice, fee) {
  for (const pattern of [
    /P2P/i,
    /Входящий перевод/i,
    /Возврат средств/i
  ]) {
    const match = rawTransaction.merchantName.match(pattern) || rawTransaction.transType.match(pattern)
    if (match) {
      transaction.comment = rawTransaction.transType
      transaction.movements.push(
        {
          id: null,
          account: {
            type: 'card',
            instrument: invoice.instrument,
            syncIds: null,
            company: null
          },
          invoice: null,
          sum: -invoice.sum,
          fee: fee || 0
        })
      return true
    }
  }
  return false
}

function parseTransfer (rawTransaction, transaction, invoice, fee) {
  for (const pattern of [
    /Пополнение карты/i
  ]) {
    const match = rawTransaction.transType.match(pattern)
    if (match) {
      transaction.comment = rawTransaction.transType
      transaction.movements.push(
        {
          id: null,
          account: {
            type: 'cash',
            instrument: invoice.instrument,
            syncIds: null,
            company: null
          },
          invoice: null,
          sum: -invoice.sum,
          fee: fee
        })
      return true
    }
  }
  return false
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
    instrument: 'UZS'
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
    parseTransferWallet
  ].some(parser => parser(rawTransaction, transaction, invoice))

  return transaction
}

function parseTransferWallet (rawTransaction, transaction, invoice, fee) {
  for (const pattern of [
    /Перевод/i
  ]) {
    const match = rawTransaction.details.match(pattern)
    if (match) {
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
      return true
    }
  }
  return false
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
  };
  [
    parseTitle,
    parseTransferAccountTransaction
  ].some(parser => parser(rawTransaction, transaction, invoice))

  return transaction
}

function parseTransferAccountTransaction (rawTransaction, transaction, invoice) {
  for (const pattern of [
    /Отправка денежного/i,
    /Перевод средств/i,
    /Пополнение счета/i
  ]) {
    const match = rawTransaction.details.match(pattern)
    if (match) {
      transaction.comment = rawTransaction.details
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
    }
  }
  return false
}

function parseTitle (rawTransaction, transaction, invoice) {
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
