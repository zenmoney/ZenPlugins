const currency = {
  rur: 'RUB',
  usd: 'USD',
  eur: 'EUR',
  gbp: 'GBP'
}

export function convertAccounts ({ accounts, deposits, credits }) {
  const accList = []

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i]

    if (ZenMoney.isAccountSkipped(String(account.id)) || account.hidden || account.closed) {
      console.log('Пропускаем карту/счёт: \'' + account.displayTitle + '\'', 'skip')
      continue
    }

    console.log('Обрабатываем карту/счёт: \'' + account.displayTitle + '\', id ' + account.id, 'account')

    // Карта
    if (!account.productType) {
      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncID: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'ccard',
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount)
      })
    } else if (account.productType === 'Products::RevolverCredit') {
      accList.push({
        id: String(account.id),
        title: account.displayTitle,
        syncID: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'ccard',
        balance: parseFloat(account.creditAmount) > 0 ? parseFloat(account.creditAmount) * (-1) : parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount)
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
        syncID: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'deposit',
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount),
        capitalization: true,
        startDate: deposit.openingDate,
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
        syncID: cardPan(account),
        instrument: currency[account.currencyIsoCode],
        type: 'loan',
        balance: parseFloat(account.balance),
        creditLimit: parseFloat(account.loanAmount),
        capitalization: true,
        startDate: credit.openingDate,
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

export function convertTransaction (apiTransaction, account) {
  const t = {}

  t.id = String(apiTransaction.id)
  let amount = parseFloat(apiTransaction.amount)
  t.date = new Date(apiTransaction.date) / 1000
  t.incomeBankID = t.id
  t.outcomeBankID = t.id

  let re = /(\d+|\d+\.\d+) (USD|EUR|RUB|GBP) = (\d+|\d+\.\d+) (USD|EUR|RUB|GBP)/
  const exch = apiTransaction.event.description.match(re) // Конвертация валют

  re = /Пополнение(.|[\r\n])+Пункт/m
  const cashIn = apiTransaction.event.description.match(re) // Пополнение наличными

  re = /ВЫДАЧА НАЛИЧНЫХ/
  const cashOut = apiTransaction.event.description.match(re) // Выдача наличных

  re = /Место совершения транзакции: .+?\S+\\\S+\\(.+\\\S+)/
  const payee = apiTransaction.event.description.match(re) // Место совершения транзацкии

  if (payee) {
    t.payee = payee[1].replace('\\', ', ')
  }

  if (amount < 0) {
    amount = Math.abs(amount)

    if (exch) {
      t.opOutcome = Number((amount * exch[3] / exch[1]).toFixed(2))
      t.opOutcomeInstrument = exch[4]
    }

    // Перевод между счетами?
    if (apiTransaction.event.destinationCardOrAccount) {
      t.incomeAccount = String(apiTransaction.event.destinationCardOrAccount.id)
      t.income = t.opOutcome ? t.opOutcome : amount
    } else if (cashOut) { // Снятие наличных?
      t.incomeAccount = 'cash#' + (exch ? t.opOutcomeInstrument : currency[apiTransaction.account.currencyIsoCode])
      t.income = amount
    } else {
      t.incomeAccount = account.id
      t.income = 0
    }

    t.outcomeAccount = account.id
    t.outcome = amount
  } else {
    t.incomeAccount = account.id
    t.income = amount

    if (exch) {
      t.opIncome = Number((amount * exch[1] / exch[3]).toFixed(2))
      t.opIncomeInstrument = exch[2]
    }

    // Перевод между счетами?
    if (apiTransaction.event.destinationCardOrAccount) {
      t.outcomeAccount = String(apiTransaction.event.destinationCardOrAccount.id)
      t.outcome = t.opIncome ? t.opIncome : amount
    } else if (cashIn) { // Пополнение наличными?
      t.outcomeAccount = 'cash#' + (exch ? t.opIncomeInstrument : currency[apiTransaction.account.currencyIsoCode])
      t.outcome = amount
    } else {
      t.outcomeAccount = account.id
      t.outcome = 0
    }
  }

  return t
}

// Заполенине SyncID
function cardPan (account) {
  let pan = []
  const cards = account.cards

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]

    if (card.state === 'active') {
      pan.push(card.number.substr(-4))
    }
  }

  if (pan.length === 0) {
    pan = [account.number.substr(-4)]
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
