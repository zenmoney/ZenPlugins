import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'
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
          rkcCode: json.rkcCode,
          cardHash: json.cards[0].cardHash
        }

        json.cards.forEach(function (el) {
          account.syncID.push(el.cardNumberMasked.slice(-4))
        })

        return account
      }
      return null
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
        endDateOffset: (new Date(json.endDate).getTime() - new Date(json.openDate).getTime()) / 1000 / 60 / 60 / 24,
        endDateOffsetInterval: 'day',
        percent: json.interestRate,
        payoffInterval: 'month',
        payoffStep: 1,
        rkcCode: json.rkcCode
      }
    default:
      return null
  }
}

export function convertTransaction (json, accounts) {
  const account = accounts.find(account => {
    return account.syncID.indexOf(json.accountNumber) !== -1
  })

  const transaction = {
    date: new Date(json.operationDate),
    movements: [ getMovement(json, account) ],
    merchant: null,
    comment: null,
    hold: false
  };

  [
    parseCash,
    parseComment,
    parsePayee
  ].some(parser => parser(transaction, json))
  return transaction
}

function getMovement (json, account) {
  const movement = {
    id: null,
    account: { id: account.id },
    invoice: null,
    sum: json.operationCode === 3 ? -json.operationAmount : json.operationAmount,
    fee: 0
  }
  if (json.operationName.indexOf('Удержано подоходного налога') >= 0) {
    let nameSplit = json.operationName.split(' ')
    movement.fee = Number.parseFloat(nameSplit[nameSplit.length - 1])
  }
  return movement
}

function parseCash (transaction, json) {
  if (json.operationName.indexOf('наличных') > 0 ||
    json.operationName.indexOf('Снятие денег со счета') > 0 ||
    json.operationName.indexOf('Пополнение наличными') > 0) {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: json.trans_iso_currency ? json.trans_iso_currency : codeToCurrencyLookup[json.operationCurrency],
        syncIds: null
      },
      invoice: null,
      sum: Number.parseFloat(json.auth_amount ? json.auth_amount : json.operationAmount),
      fee: 0
    })
    return true
  }
}

function parsePayee (transaction, json) {
  transaction.merchant = {
    location: null,
    mcc: null,
    fullTitle: null
  }

  if (json.siccode) {
    transaction.merchant.mcc = parseInt(json.siccode)
  }

  if (json.operationName.indexOf('Service payment to card') === -1) {
    transaction.merchant.fullTitle = json.operationName
  }
}

function parseComment (transaction, json) {
  switch (json.description) {
    case 'Покупки':
    case 'Покупки(конверсия)':
    case 'Оплата товаров, работ или услуг':
    case 'СДБО':
      return false
    case '"trans.type.code.W2"':
      transaction.comment = 'Пополнение счета'
      break

    default:
      transaction.comment = json.description
      return false
  }
}
