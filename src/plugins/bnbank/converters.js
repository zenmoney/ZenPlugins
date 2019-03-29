import codeToCurrencyLookup from './codeToCurrencyLookup'
export const card = 'card'
export const deposit = 'deposit'

export function convertCard (json) {
  return convertAccount(json, card)
}

export function convertDeposit (json) {
  return convertAccount(json, deposit)
}

export function convertAccount (json, accountType) {
  switch (accountType) {
    case card:
      if (json.cards && json.cards.length > 0) { // only loading card accounts
        const account = {
          id: json.internalAccountId,
          type: card,
          title: json.productName,
          currencyCode: json.currency,
          instrument: codeToCurrencyLookup[json.currency],
          balance: Number.parseFloat(json.cards[0].balance),
          syncID: [json.internalAccountId],
          rkcCode: json.rkcCode
        }

        json.cards.forEach(function (el) {
          account.syncID.push(el.cardNumberMasked.slice(-4))
        })

        return account
      }
      break
    case deposit:
      return {
        id: json.internalAccountId,
        type: deposit,
        title: 'Депозит ' + json.productName,
        currencyCode: json.currency,
        instrument: codeToCurrencyLookup[json.currency],
        balance: Number.parseFloat(json.balanceAmount),
        syncID: [json.internalAccountId],
        capitalization: true,
        startDate: new Date(json.openDate),
        endDateOffset: new Date(json.endDate).getTime() / 1000,
        percent: json.interestRate,
        endDateOffsetInterval: 'month',
        payoffInterval: 'month',
        payoffStep: 1,
        rkcCode: json.rkcCode
      }
    default:
      return null
  }
}

export function convertTransaction (apiTransaction, accounts) {
  console.log(apiTransaction)
  const account = accounts.find(account => {
    return account.syncID.indexOf(apiTransaction.accountNumber) !== -1
  })

  const transaction = {
    date: new Date(apiTransaction.transactionDate),
    movements: [ getMovement(apiTransaction, account) ],
    merchant: null,
    comment: null,
    hold: apiTransaction.operationSign !== '1'
  };

  [
    parseCash,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction))

  return transaction
}

function getMovement (apiTransaction, account) {
  return {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: apiTransaction.operationCode === 3 ? -apiTransaction.operationAmount : apiTransaction.operationAmount,
    fee: 0
  }
}

function parseCash (transaction, apiTransaction) {
  if (apiTransaction.operationName.indexOf('наличных') > 0 ||
    apiTransaction.operationName.indexOf('Снятие денег со счета') > 0 ||
    apiTransaction.operationName.indexOf('Пополнение наличными') > 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: codeToCurrencyLookup[apiTransaction.operationCurrency],
        syncIds: null
      },
      invoice: null,
      sum: Number.parseFloat(apiTransaction.operationAmount),
      fee: 0
    })
    return true
  }
}

function parsePayee (transaction, apiTransaction) {
  // интернет-платежи отображаем без получателя
  if (!apiTransaction.operationPlace ||
    apiTransaction.operationPlace.indexOf('BNB - OPLATA USLUG') >= 0 ||
    apiTransaction.operationPlace.indexOf('OPLATA USLUG - KOMPLAT BNB') >= 0) {
    return false
  }

  transaction.merchant = {
    mcc: null,
    fullTitle: apiTransaction.operationPlace ? apiTransaction.operationPlace : '',
    location: null
  }
}

function parseComment (transaction, apiTransaction) {
  if (!apiTransaction.operationName) { return false }

  switch (apiTransaction.operationName) {
    // переводы между счетами полезной информации не несут, гасим сразу
    case 'Списание по операции ПЦ "Перечисление с карты на карту" ':
    case 'On-line пополнение договора (списание с БПК)':
      return true

    // в покупках комментарии не оставляем
    case 'Покупки':
    case 'Покупки(конверсия)':
    case 'Операция в Интернет-Банк':
    case 'Покупка товаров и услуг':
    case 'Списание по операции ПЦ "Оплата услуг в ИБ" ':
      return false

    default:
      transaction.comment = apiTransaction.operationName
      return false
  }
}
