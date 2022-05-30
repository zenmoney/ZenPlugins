function getCurrencyName (id) {
  switch (id) {
    case 944:
      return 'AZN'
    case 840:
      return 'USD'
    case 978:
      return 'EUR'
    default:
      return 'AZN'
  }
}

/**
 * Конвертер карты из формата банка в формат Дзенмани
 *
 * @param rawCard карта в формате банка
 * @returns карта в формате Дзенмани
 */
export function convertCard (rawCard) {
  if (rawCard.type !== 7) {
    return null
  }
  if (rawCard.productAccount.cards.length === 0) {
    const account = {
      id: String(rawCard.id),
      title: rawCard.name,
      syncIds: ['null'],
      instrument: getCurrencyName(rawCard.currency),
      type: 'checking',
      balance: parseFloat(rawCard.amount.value)
    }

    if (!rawCard.name) {
      account.title = 'Cчёт KapitalBank ' + getCurrencyName(rawCard.currency)
    }
    return account
  } else {
    const ids = []
    // eslint-disable-next-line github/array-foreach
    rawCard.productAccount.cards.forEach((item) => {
      ids.push(item.number.slice(-4))
    })
    const card = {
      id: String(rawCard.id),
      title: rawCard.name,
      syncIds: ids,
      instrument: getCurrencyName(rawCard.currency),
      type: 'ccard',
      balance: parseFloat(rawCard.amount.value)
    }

    if (!rawCard.name) {
      card.name = 'Карта KapitalBank ' + ids[0]
    }
    return card
  }
}

/**
 * Конвертер транзакции по карте из формата банка в формат Дзенмани
 *
 * @param card идентификатор карты
 * @param rawTransaction транзакция в формате банка
 * @returns транзакция в формате Дзенмани
 */
export function convertCardTransaction (card, rawTransaction) {
  let amount = parseFloat(rawTransaction.amount.value)
  const fee = parseFloat(rawTransaction.commission.value)

  if (amount === 0 || rawTransaction.status !== 1) {
    return null
  }

  if (rawTransaction.sourceType === 1) amount = -amount

  const invoice = {
    sum: amount,
    instrument: getCurrencyName(rawTransaction.currency)
  }

  return {
    date: new Date(rawTransaction.endDate),
    hold: false,
    merchant: rawTransaction.destination !== 'C'
      ? null
      : {
          country: null,
          city: null,
          title: rawTransaction.destinationCustom.name,
          mcc: null,
          location: null
        },
    movements: [
      {
        id: rawTransaction.id,
        account: { id: card.id },
        invoice: invoice.instrument === card.instrument ? null : invoice,
        sum: invoice.instrument === card.instrument ? invoice.sum : null,
        fee: fee ? -fee : 0
      }
    ],
    comment: translateName(rawTransaction.name) + ', ' + rawTransaction.categoryName
  }
}

function translateName (name) {
  switch (name) {
    case 'Köçürmə':
      return 'Перевод'
    case 'Hesaba Mədaxil':
      return 'Пополнение'
    case 'Ödəniş':
      return 'Оплата'
    default:
      return name
  }
}