const currency = {
  rur: 'RUB',
  usd: 'USD',
  eur: 'EUR',
  gbp: 'GBP',
  kzt: 'KZT'
}

export function convertAccounts ({ accounts, deposits, credits }) {
  const accList = []

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]

    console.log('Обрабатываем карту/счёт: \'' + account.displayTitle + '\', id ' + account.id, 'account')

    // Карта
    if (!account.productType) {
      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncIds: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'ccard',
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount) !== 0 ? parseFloat(account.loanAmount) : 0
      })
    } else if (account.productType === 'Products::RevolverCredit') {
      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncIds: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'ccard',
        balance: parseFloat(account.creditAmount) > 0 ? parseFloat(account.creditAmount) * (-1) : parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount) !== 0 ? parseFloat(account.loanAmount) : 0
      })
    } else if (account.productType === 'Products::Deposit') {
      const deposit = findDeposit(deposits, account.id)
      let offset = 36500 // Вклад до востребования на 100 лет

      // Определяем срок вклада
      if (deposit.closingDate) {
        offset = (new Date(deposit.closingDate) - new Date(deposit.openingDate)) / 86400000
      }

      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncIds: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'deposit',
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount) !== 0 ? parseFloat(account.loanAmount) : 0,
        capitalization: true,
        startDate: new Date(deposit.openingDate),
        endDateOffset: offset,
        endDateOffsetInterval: 'day',
        payoffStep: 1,
        payoffInterval: 'month',
        percent: parseFloat(deposit.interestRate)
      })
    } else if (account.productType === 'Products::SingleCredit') {
      const credit = findCredit(credits, account.id)
      let endDate = new Date()

      // Определяем дату последнего платежа по кредиту
      for (let j = 0; j < credit.payments.length; j++) {
        const payment = credit.payments[j]

        if (new Date(payment.date) > endDate) {
          endDate = new Date(payment.date)
        }
      }

      const offset = (endDate - new Date(credit.openingDate)) / 86400000

      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncIds: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'loan',
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount),
        capitalization: true,
        startDate: new Date(credit.openingDate),
        endDateOffset: offset,
        endDateOffsetInterval: 'day',
        payoffStep: 1,
        payoffInterval: 'month',
        percent: parseFloat(credit.interest)
      })
    } else {
      console.log('Неизвестный тип карты/счёта', 'skip')
    }
  }

  console.log('Создано счетов: ' + accList.length, 'account')

  return accList
}

// Заполенине SyncID
function cardPan (account) {
  const pan = [account.number]
  const cards = account.cards

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]

    if (card.state === 'active') {
      pan.push(card.number)
    }
  }

  return pan
}

// Поиск депозита в массиве депозитов
function findDeposit (its, id) {
  for (let i = 0; i < its.length; i++) {
    const it = its[i]

    if (it.account.id === id) {
      return it
    }
  }
}

// Поиск кредита в массиве кредитов
function findCredit (its, id) {
  for (let i = 0; i < its.length; i++) {
    const it = its[i]

    if (it.accounts.id === id) { // WTF: accountS
      return it
    }
  }
}

export function convertTransaction (apiTransaction, account) {
  const invoice = {
    sum: parseFloat(apiTransaction.amount),
    instrument: currency[apiTransaction.event.currencyIsoCode]
  }
  const fee = 0
  const transaction = {
    movements: [
      {
        id: String(apiTransaction.id),
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : parseFloat(apiTransaction.amount),
        fee
      }
    ],
    date: new Date(apiTransaction.date),
    hold: apiTransaction.state !== 'paid',
    merchant: null,
    comment: apiTransaction.comment || null
  };
  [
    parseComments,
    parseOuterTransfer,
    parsePayee
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function parseComments (transaction, apiTransaction, account, invoice) {
  if (![
    /Сообщение:/i,
    /Оплата услуг/i,
    /КЭШБЭК/i
  ].some(regexp => regexp.test(apiTransaction.event.description))) {
    return false
  }
  const comment = apiTransaction.event.description.match(/.*Сообщение:(.*)/i) ||
    apiTransaction.event.description.match(/.*(Платеж №\d+).*/i) ||
    apiTransaction.event.description.match(/(КЭШБЭК.*)\. Место совершения/i)
  if (comment) {
    transaction.comment = comment[1].trim() || null
  }
  return false
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /Зачисление средств от СБП/i
  ].some(regexp => regexp.test(apiTransaction.event.description)) &&
    ![
      /Расчеты с/i
    ].some(regexp => regexp.test(apiTransaction.event.name))) {
    return false
  }
  const title = apiTransaction.event.description.match(/.*Абонент:(\W+)\n.*/i) || apiTransaction.event.name.match(/\(Расчеты с(.+)\)/)
  if (title) {
    transaction.merchant = {
      country: null,
      city: null,
      title: title[1].trim(),
      mcc: null,
      location: null
    }
  } else {
    transaction.merchant = null
  }
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      instrument: invoice.instrument,
      syncIds: null,
      type: 'ccard'
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parsePayee (transaction, apiTransaction, account, invoice) {
  if (![
    /ПЛАТЕЖ .* Место совершения транзакции:/i
  ].some(regexp => regexp.test(apiTransaction.event.description))) {
    return false
  }
  const payee = apiTransaction.event.description.match(/Место совершения транзакции:(.+) Дата:(.*)./)
  if (payee) {
    const title = payee[1].match(/(.+),(.+)./)
    if (title) {
      transaction.merchant = {
        country: null,
        city: title[1].trim(),
        title: title[2].trim(),
        mcc: null,
        location: null
      }
    } else {
      transaction.merchant = {
        fullTitle: payee[1].trim(),
        mcc: null,
        location: null
      }
    }
    const date = payee[2].match(/(\d{2}).(\d{2}).\d{0,2}(\d{2})\s([\d:]+)/)
    if (date) {
      transaction.date = new Date('20' + date[3] + '-' + date[2] + '-' + date[1] + 'T' + date[4] + 'Z')
    }
  }
  return true
}
