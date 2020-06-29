export function convertAccount (acc) {
  return {
    id: acc.number,
    type: 'checking',
    title: (acc.title ?? acc.number) + ' (' + acc.description + ')',
    instrument: acc.description,
    currencyCode: acc.code,
    balance: acc.quantity,
    syncID: [acc.number]
  }
}

export function convertTransaction (tr, account) {
  const transaction = {
    date: new Date(tr.docDateString),
    movements: [
      {
        id: null,
        account: { id: account.id },
        invoice: null,
        sum: tr.credit > 0 ? tr.credit : -tr.debet,
        fee: 0
      }
    ],
    merchant: null,
    comment: tr.description,
    hold: false
  };

  [
    parseCash,
    parsePayee
  ].some(parser => parser(transaction, account, tr))

  return transaction
}

function parseCash (transaction, account, json) {
  if (json.correspondentName === 'Транзитный счет по безналичным перечислениям клиентов по БПК') {
    // добавим вторую часть перевода
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        type: 'cash',
        instrument: account.instrument,
        syncIds: null
      },
      invoice: null,
      sum: -transaction.movements[0].sum,
      fee: 0
    })
    return true
  }
}

function parsePayee (transaction, account, json) {
  if (json.correspondentName === 'Транзитный счет по безналичным перечислениям клиентов по БПК' ||
  json.correspondentName === 'Доходы будущих периодов по абонентской плате за систему Bank-iT/ibank отд 1' ||
    json.correspondentName === 'Комиссия за зачисление денежных средств по БПК' ||
    json.correspondentName === 'Комиссии за ведение счета Индивидуального предпринимаетля Отделение 1') {
    return false
  }

  transaction.merchant = {
    fullTitle: json.correspondentName,
    mcc: null,
    location: null
  }
}
