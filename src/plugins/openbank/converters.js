export function convertAccount (apiAccount) {
  switch (apiAccount.type) {
    // Дебетовая карта
    case 1:
      console.log(`>>> Добавляем дебетовую карту: ${apiAccount.title} (#${apiAccount.account_id})`)
      return {
        id: apiAccount.account_id.toString(),
        title: apiAccount.title,
        syncID: [ apiAccount.pan ],
        instrument: apiAccount.currency,
        type: 'ccard',
        balance: apiAccount.balance
      }

    // Кредитная карта (пока неизвестно, как посмотреть кредитный лимит)
    case 2:
      console.log(`>>> Добавляем кредитную карту: ${apiAccount.title} (#${apiAccount.account_id})`)
      return {
        id: apiAccount.account_id.toString(),
        title: apiAccount.title,
        syncID: [ apiAccount.pan ],
        instrument: apiAccount.currency,
        type: 'ccard',
        balance: Math.round((apiAccount.balance - apiAccount.loan_amount) * 100) / 100,
        creditLimit: apiAccount.loan_amount
      }

    // Вклад (депозит)
    case 3:
      console.log(`>>> Добавляем вклад: ${apiAccount.title} (#${apiAccount.account_id})`)
      return {
        id: apiAccount.account_id.toString(),
        title: apiAccount.title,
        syncID: [ apiAccount.pan ],
        instrument: apiAccount.currency,
        type: 'deposit',
        balance: apiAccount.balance,
        capitalization: true,
        percent: apiAccount.annual_interest,
        startDate: apiAccount.open_date.substring(0, 10),
        endDateOffset: monthDiff(apiAccount.open_date, apiAccount.closing_date),
        endDateOffsetInterval: 'month',
        payoffStep: 1,
        payoffInterval: 'month'
      }

    // Кредит
    case 4:
      console.log(`>>> Добавляем кредит: ${apiAccount.title} (#${apiAccount.account_id})`)

      // обработка счетов вида '2467406-ДО-МСК-18'
      let syncID = apiAccount.pan
      const ex = /^.*?(\d{4,}).*/.exec(syncID)
      if (ex) {
        syncID = ex[1]
      }

      return {
        id: apiAccount.account_id.toString(),
        title: apiAccount.title,
        syncID: [ syncID ],
        instrument: apiAccount.currency,
        type: 'loan',
        balance: -(apiAccount.balance || apiAccount.full_payment),
        startBalance: apiAccount.loan_amount,
        capitalization: true,
        percent: apiAccount.annual_interest,
        startDate: apiAccount.open_date.substring(0, 10),
        endDateOffset: Math.ceil(apiAccount.full_payment / apiAccount.next_payment),
        endDateOffsetInterval: 'month',
        payoffStep: 1,
        payoffInterval: 'month'
      }

    // Счёт
    case 5:
    // Счет-копилка
      if (apiAccount.kopilka && apiAccount.kopilka === 1) {
        console.log(`>>> Добавляем копилку: ${apiAccount.title} (#${apiAccount.account_id})`)
        return {
          id: apiAccount.account_id.toString(),
          title: apiAccount.title,
          syncID: [ apiAccount.pan ],
          instrument: apiAccount.currency,
          type: 'deposit',
          balance: apiAccount.balance,
          capitalization: true,
          percent: apiAccount.annual_interest,
          startDate: apiAccount.open_date.substring(0, 10),
          endDateOffset: 10,
          endDateOffsetInterval: 'year',
          payoffStep: 1,
          payoffInterval: 'month'
        }
      }

      // Банковский счет
      console.log(`>>> Добавляем банковский счёт: ${apiAccount.title} (#${apiAccount.account_id})`)
      return {
        id: apiAccount.account_id.toString(),
        title: apiAccount.title,
        syncID: [ apiAccount.pan ],
        instrument: apiAccount.currency,
        type: 'checking',
        balance: apiAccount.balance
      }

    case 9:
      return null

    default:
      throw new Error('Неизвестный тип счёта: ', apiAccount)
  }
}

export function convertTransaction (apiTransaction, accountId) {
  const transaction = {}
  let payee = ''
  transaction.hold = apiTransaction.transaction_status !== 1

  const foreignCurrency = (apiTransaction.original_currency && apiTransaction.original_currency !== apiTransaction.transaction_currency)

  /* TODO: hold валютной операции */

  transaction.payee = apiTransaction.title.substring(0, apiTransaction.title.lastIndexOf('/'))
  const date = (apiTransaction.transaction_date ? apiTransaction.transaction_date : apiTransaction.short_transaction_date)
  const dt = new Date(date + '+03:00') // Корректируем время, потому что банк отдает время по МСК
  transaction.date = dt.getTime()
  transaction.time = '00:00:00'
  if (date.indexOf('T') > -1) {
    transaction.time = date.substring(date.indexOf('T') + 1) // для внутреннего использования
  }
  transaction.income = 0
  transaction.outcome = 0
  transaction.outcomeAccount = accountId
  transaction.incomeAccount = accountId
  if (apiTransaction.transaction_type === 1) {
    // расходная операция
    transaction.outcomeBankID = apiTransaction.transaction_id.toString()
    if (foreignCurrency) {
      transaction.opOutcomeInstrument = apiTransaction.original_currency
      transaction.opOutcome = apiTransaction.original_amount
    }
    if (transaction.hold) {
      payee = apiTransaction.title.substring(12)
      transaction.payee = payee.substring(0, payee.lastIndexOf(' '))
      transaction.outcome = apiTransaction.value_transaction_currency || apiTransaction.original_amount
    } else {
      payee = apiTransaction.title.substring(0, apiTransaction.title.lastIndexOf('/'))
      transaction.payee = payee.substring(0, payee.lastIndexOf('/'))
      transaction.outcome = -apiTransaction.value_transaction_currency || apiTransaction.original_amount
    }
    if (apiTransaction.title.toLowerCase().indexOf('card2card') > -1) {
      // исходящий c2c
      transaction.incomeAccount = 'ccard#' + apiTransaction.transaction_currency
      transaction.income = transaction.outcome
    }
  } else if (apiTransaction.transaction_type === 2) {
    // доходная операция
    transaction.incomeBankID = apiTransaction.transaction_id.toString()
    transaction.payee = ''
    transaction.comment = apiTransaction.title
    if (foreignCurrency) {
      transaction.opIncomeInstrument = apiTransaction.original_currency
      transaction.opIncome = apiTransaction.original_amount
    }
    transaction.income = apiTransaction.value_transaction_currency
    if (apiTransaction.description.indexOf('Приём денежных') > -1 || apiTransaction.description.indexOf('Внесение на') > -1) {
      // внесение наличных
      transaction.outcomeAccount = 'cash#' + apiTransaction.transaction_currency
      transaction.outcome = transaction.income
    }
  } else {
    console.log('>>> Неизвестный тип транзакции: ', apiTransaction)
    throw new Error('Неизвестный тип транзакции')
  }

  if (transaction.outcome === 0 && transaction.income === 0) {
    // console.log('>>> Пустая операция (без суммы): ', apiTransaction)
    // throw new Error('Пустая операция (без суммы)')
    return null
  }

  return transaction
}

function monthDiff (d1, d2) {
  var months
  d1 = new Date(d1)
  d2 = new Date(d2)
  months = (d2.getFullYear() - d1.getFullYear()) * 12
  months -= d1.getMonth()
  months += d2.getMonth()
  return months <= 0 ? 0 : months
}
