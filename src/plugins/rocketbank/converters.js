import { parseOuterAccountData } from '../../common/accounts'
import { MD5 } from 'jshashes'

const md5 = new MD5()

export function convertAccount (apiAccount) {
  let result
  try {
    const syncId = apiAccount.pan || apiAccount.account_details.account
    result = {
      id: apiAccount.token,
      title: apiAccount.title,
      type: apiAccount.pan ? 'ccard' : 'checking',
      instrument: apiAccount.currency,
      balance: apiAccount.balance,
      syncID: [ syncId.substr(-4) ]
    }
  } catch (exception) {
    const err = 'Ошибка добавления счёта: '
    console.log('>>> ' + err, apiAccount)
    throw new Error(err + exception.message)
  }

  return result
}

export function convertDeposit (apiAccount) {
  let result
  try {
    result = {
      id: md5.hex(apiAccount.id.toString()),
      title: apiAccount.title,
      type: 'deposit',
      syncID: [ apiAccount.id.toString().substr(-4) ],
      instrument: apiAccount.rocket_deposit.currency,
      balance: Math.round((apiAccount.balance + apiAccount.percent) * 100) / 100,
      percent: +apiAccount.rocket_deposit.rate,
      capitalization: true,
      startDate: new Date(apiAccount.start_date),
      endDateOffsetInterval: 'month',
      endDateOffset: apiAccount.rocket_deposit.period,
      payoffInterval: 'month',
      payoffStep: 1
    }
  } catch (exception) {
    const err = 'Ошибка добавления счёта депозита: '
    console.log('>>> ' + err, apiAccount)
    throw new Error(err + exception.message)
  }

  return result
}

export function convertDepositTransaction (accountId, apiTransaction, fromDate) {
  if (apiTransaction.date <= fromDate) {
    return
  }

  const sum = Math.abs(apiTransaction.amount)
  const transaction = {
    id: md5.hex(apiTransaction.date + '|' + apiTransaction.sum),
    date: apiTransaction.date,
    comment: apiTransaction.description,
    outcome: 0,
    outcomeAccount: accountId,
    income: 0,
    incomeAccount: accountId
  }

  switch (apiTransaction.kind) {
    case 'first_refill': // Первичное пополнение
    case 'refill': // Пополнение
      transaction.income = sum
      // deposits_operations.push(transaction)
      break

    case 'percent': // Проценты
      transaction.income = sum
      transaction.payee = 'Рокетбанк'
      // that.deposits_percent.push(transaction)
      break

    case 'finish': // Закрытие вклада
      transaction.outcome = sum
      // that.deposits_operations.push(transaction)
      break

    default:
      console.log('>>> Неизвестный тип транзакции депозита: ', apiTransaction)
      throw new Error('Неизвестный тип транзакции депозита')
  }
}

export function convertAccountTransaction (apiTransaction, account, titleAccounts = {}) {
  if (apiTransaction.status !== 'confirmed' && apiTransaction.status !== 'hold') {
    console.log(`>>> Пропускаем операцию со статусом '${apiTransaction.status}' #${apiTransaction.id}`)
    return null
  }

  if (apiTransaction.money.amount === 0) {
    console.log(`>>> Пропускаем пустую операцию с нулевой суммой #${apiTransaction.id}`)
    return null
  }

  const movement = getMovement(apiTransaction, account)
  if (!movement) { return null }

  const transaction = {
    date: new Date(apiTransaction.happened_at * 1000),
    movements: [ movement ],
    merchant: null,
    comment: null,
    hold: apiTransaction.status === 'hold'
  }

  switch (apiTransaction.context_type) {
    case 'pos_spending': // Расход
      fillPayee(transaction, apiTransaction)
      break

    case 'atm_cash_out': // Снятие наличных в банкомате
    case 'atm_cash_out_open': // Снятие наличных в банкомате Открытия
    case 'atm_cash_in': // Пополнение наличными через банкомат
    case 'office_cash_in': // Пополнение наличными через отделение банка
    case 'robin_operation': // Пополнение наличными в салоне связи
      transaction.comment = getComment(apiTransaction)
      addMirrorMovement(transaction,
        {
          type: 'cash',
          instrument: apiTransaction.money.currency_code
        },
        apiTransaction)
      break

    case 'remittance': // Перевод (исходящий)
    case 'internal_cash_out': // Исходящий перевод внутри банка
    case 'internal_cash_out_request':
      transaction.comment = getComment(apiTransaction)
      fillPayee(transaction, apiTransaction)
      break

    case 'card2card_cash_in': // Перевод с карты (входящий)
    case 'card2card_cash_in_other':
    case 'internal_p2p_in': // Пополнение по номеру карты
    case 'mcb_client_cash_in':
      transaction.comment = getComment(apiTransaction)
      parseCard2cardMovement(transaction, account, transaction.comment, 'ополнение с карты')
      break

    case 'card2card_cash_out': // Исходящий перевод на карту
    case 'card2card_cash_out_other': // Исходящий перевод внутри банка
    case 'card2card_to_friend': // Перевод денег
      transaction.comment = getComment(apiTransaction)
      parseCard2cardMovement(transaction, account, transaction.comment, 'а карту')
      break

    case 'atm_commission': // комиссия за снятие наличных
    case 'commission': // комиссия за операцию
    case 'rocket_fee': // услуги банка
    case 'card_commission': // комиссия за обслуживание карты
    case 'disput_charge': // опротестовывание операции
    case 'transfer_cash_in': // зачисление межбанка || Начисление процентов
    case 'cashin_commission': // комиссия за внесение наличных
    case 'spisanie':
    case 'robin_credit_fee': // комиссия за пополнение наличными
      transaction.comment = getComment(apiTransaction)
      break

    case 'internal_cash_in_request':
      fillPayee(transaction, apiTransaction)
      break

    case 'internal_cash_in': // входящий перевод внутри банка
      transaction.comment = getComment(apiTransaction)
      const arrSplited = transaction.comment.split(' → ')
      const arrAccounts = arrSplited.map(title => titleAccounts[title])
      if (arrAccounts.length === 2 && titleAccounts[arrSplited[0]] && titleAccounts[arrSplited[1]]) {
        try {
          if (apiTransaction.exchange_details) {
            transaction.movements = [
              {
                id: null,
                account: { id: arrAccounts[0].id },
                invoice: {
                  sum: -apiTransaction.exchange_details.to_amount,
                  instrument: apiTransaction.exchange_details.to_currency
                },
                sum: -apiTransaction.exchange_details.from_amount,
                fee: 0
              },
              {
                id: null,
                account: { id: arrAccounts[1].id },
                invoice: {
                  sum: apiTransaction.exchange_details.from_amount,
                  instrument: apiTransaction.exchange_details.from_currency
                },
                sum: apiTransaction.exchange_details.to_amount,
                fee: 0
              }
            ]
            transaction.comment = 'Курс обмена: ' + apiTransaction.exchange_details.rate
          } else {
            const sum = Math.abs(apiTransaction.money.amount)
            transaction.movements = [
              {
                id: null,
                account: { id: arrAccounts[0].id },
                invoice: null,
                sum: -sum,
                fee: 0
              },
              {
                id: null,
                account: { id: arrAccounts[1].id },
                invoice: null,
                sum: sum,
                fee: 0
              }
            ]
          }

          if (transaction.movements[0].account.id === transaction.movements[1].account.id) {
            transaction.movements.pop()
            console.log('>>> Перевод \'internal_cash_in\' со счёта на самого себя не возможен: ', apiTransaction)
          }
        } catch (exception) {
          console.log('>>> Ошибка добавления \'internal_cash_in\' операции: ', apiTransaction)
          throw new Error('Ошибка добавления \'internal_cash_in\' операции')
        }
      }
      break

    case 'open_deposit': // Открытие вклада
      /* let isFounded = false
      this.deposits_operations.map(function (depositTransaction) {
        if (depositTransaction.outcome === 0 && depositTransaction.income === sum) {
          if (dateFromTimestamp(depositTransaction.date) === dateFromTimestamp(transaction.date)) {
            depositTransaction.outcome = sum
            depositTransaction.outcomeAccount = accountId
            if (depositTransaction.comment !== null) {
              depositTransaction.comment += ': ' + transaction.comment
            }
            isFounded = true
          }
        }
        return transaction
      })

      if (isFounded) {
        return null
      } else {
        transaction.income = sum
        transaction.incomeAccount = 'deposit#' + apiTransaction.money.currency_code
        transaction.outcome = sum
      } */
      break

    case 'miles_cash_back': // возврат за рокетрубли
    case 'emoney_payment':
    case 'quasi_cash':
    case null: // Неизвестный тип контекста
      break

    default:
      console.log('>>> Неизвестный тип транзакции:', apiTransaction)
      throw new Error('Неизвестный тип транзакции')
  }

  return transaction
}

function parseCard2cardMovement (transaction, account, comment, matching) {
  if (comment.indexOf(matching) < 0) {
    return
  }

  const bank = parseOuterAccountData(comment)
  const match = /.*\*(\d{4})/.exec(comment)
  let card = null
  if (match || card) {
    card = match[1]
    const acc = {
      ...bank,
      type: 'ccard',
      syncIds: [card],
      instrument: account.instrument
    }
    addMirrorMovement(transaction, acc)
  }
}

function getMerchant (apiTransaction) {
  let title = getFriendName(apiTransaction.friend)
  if (!title) {
    title = apiTransaction.merchant.name
  }
  if (!title) {
    return null
  }

  const result = {
    title: title,
    city: null,
    country: null,
    mcc: null,
    location: null
  }

  if (apiTransaction.location.latitude !== null && apiTransaction.location.longitude !== null) {
    result.location = {
      latitude: apiTransaction.location.latitude,
      longitude: apiTransaction.location.longitude
    }
  }

  return result
}

function getMovement (apiTransaction, account) {
  const movement = {
    id: apiTransaction.id.toString(),
    account: { id: account.id },
    invoice: null,
    sum: apiTransaction.money.amount,
    fee: 0
  }

  if (apiTransaction.exchange_details && apiTransaction.exchange_details.from_currency !== apiTransaction.exchange_details.to_currency) {
    if (movement.sum > 0) {
      movement.invoice = {
        sum: apiTransaction.exchange_details.from_amount,
        instrument: apiTransaction.exchange_details.from_currency
      }
    } else {
      movement.invoice = {
        sum: apiTransaction.exchange_details.to_amount,
        instrument: apiTransaction.exchange_details.to_currency
      }
    }
  }

  return movement
}

function addMirrorMovement (transaction, account, apiTransaction = null) {
  if (transaction.movements.length > 1) {
    console.log('>>> Ошибка добавления зеркальной movement: ', transaction)
    throw new Error('Ошибка добавления зеркальной movement')
  }

  let sum = -transaction.movements[0].sum
  let instrument = transaction.movements[0].account.instrument || null
  let invoice = null
  if (apiTransaction && apiTransaction.exchange_details) {
    invoice = {
      sum,
      instrument
    }
    if (sum < 0) {
      sum = -apiTransaction.exchange_details.from_amount
      instrument = apiTransaction.exchange_details.from_currency
    } else {
      sum = -apiTransaction.exchange_details.to_amount
      instrument = apiTransaction.exchange_details.to_currency
    }
  }

  if (!account) {
    console.log('>>> Ошибка добавления зеркальной операции: ', transaction, account, apiTransaction)
    throw new Error('Ошибка добавления зеркальной операции')
  }

  // добавим вторую часть перевода
  transaction.movements.push({
    id: null,
    account: account.id
      ? { id: account.id }
      : {
        company: null,
        instrument: instrument,
        syncIds: null,
        ...account
      },
    invoice: invoice,
    sum: sum,
    fee: 0
  })

  return transaction
}

function fillPayee (transaction, apiTransaction) {
  transaction.merchant = getMerchant(apiTransaction)
  if (!transaction.merchant) {
    transaction.comment = getComment(apiTransaction)
  }
}

function getFriendName (friend) {
  if (!friend) {
    return null
  }
  const name = [
    friend.first_name || '',
    friend.last_name || ''
  ]
  const result = name.join(' ').trim()
  return result || null
}

function getComment (operation) {
  return operation.details + (operation.comment ? ': ' + operation.comment : '')
}
