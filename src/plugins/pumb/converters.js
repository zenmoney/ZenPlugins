import { getIntervalBetweenDates } from '../../common/momentDateUtils'
import { parseDateInTimezone } from '../../common/momentTimezoneDateUtils'
import { uniqBy } from 'lodash'
import moment from 'moment'

const REAL_MONEY_MULTIPLIER = 0.01

export function convertAccount (apiAccount) {
  const cards = uniqBy(apiAccount.cards, card => card.number)
  let due = { }
  // eslint-disable-next-line
  if (apiAccount.credit_info?.['payment_due_date']) {
    const date = apiAccount.credit_info.payment_due_date.match(/(\d{2})\.(\d{2})\.(\d{4})/)
    due = {
      totalAmountDue: getFloatMoneyAmount(apiAccount.credit_info.use_amount),
      gracePeriodEndDate: parseDateInTimezone(`${date[3]}-${date[2]}-${date[1]}`, 'Europe/Kiev')
    }
  }
  return {
    mainProduct: {
      id: apiAccount.id,
      type: 'account'
    },
    products: cards.map(card => ({
      id: card.id,
      type: 'card'
    })),
    account: {
      id: apiAccount.id.toString(),
      type: 'ccard',
      title: apiAccount.cards.length > 0 ? apiAccount.cards[0].number.slice(-5) : '*' + apiAccount.iban.slice(-4),
      instrument: apiAccount.currency_code,
      syncID: [apiAccount.iban].concat(cards.map(card => card.number)),
      balance: getFloatMoneyAmount(apiAccount.balance),
      ...apiAccount.credit_info && {
        balance: getFloatMoneyAmount(apiAccount.credit_info.own_money) - getFloatMoneyAmount(apiAccount.credit_info.use_amount),
        creditLimit: getFloatMoneyAmount(apiAccount.credit_info.total_credit_limit)
      },
      ...apiAccount.overdraft_flag && {
        balance: getFloatMoneyAmount(apiAccount.overdraft_info.own_money) - getFloatMoneyAmount(apiAccount.overdraft_info.use_amount),
        creditLimit: getFloatMoneyAmount(apiAccount.overdraft_info.amount)
      },
      ...due
    }
  }
}

export function convertTransaction (apiTransaction, account) {
  const amount = apiTransaction.transaction_amount

  if (!amount || amount.value === 0) {
    return null
  }

  const invoice = {
    sum: getFloatMoneyAmount(amount.value),
    instrument: amount.currency_code
  }

  const transaction = {
    hold: apiTransaction.transaction_type === 'holds' || apiTransaction.transaction_type === 'Holds',
    date: parseTransactionDate(apiTransaction),
    movements: [
      {
        id: apiTransaction.source_system_id,
        account: { id: apiTransaction.account_id.toString() },
        invoice: invoice.instrument === apiTransaction.transaction_details.account_amount.currency_code ? null : invoice,
        sum: getFloatMoneyAmount(amount.value),
        fee: apiTransaction.transaction_details.commission_amount.value ?? 0
      }
    ],
    merchant: null,
    comment: null
  }
  const parsers = [
    parseComment,
    parseCashTransfer,
    parseInnerTransfer,
    parseOuterTransfer,
    parsePayee
  ]
  parsers.some(parser => parser(transaction, apiTransaction, account, invoice))

  return transaction
}

export function convertDeposit (apiDeposit, startDate) {
  const endDateInterval = getIntervalBetweenDates(startDate, parseLoanDate(apiDeposit.maturity_date))
  return {
    id: apiDeposit.id.toString(),
    type: 'deposit',
    title: apiDeposit.program_name,
    instrument: apiDeposit.currency_code,
    syncID: [apiDeposit.id.toString()],
    balance: getFloatMoneyAmount(apiDeposit.balance),
    startBalance: getFloatMoneyAmount(apiDeposit.balance),
    capitalization: true,
    percent: getFloatMoneyAmount(apiDeposit.interest_rate),
    startDate,
    endDateOffsetInterval: endDateInterval.interval,
    endDateOffset: endDateInterval.count > 0 ? endDateInterval.count : 1,
    payoffInterval: 'month',
    payoffStep: 1
  }
}

export function convertLoan (apiLoan) {
  const MONTH_MILLISECONDS = 2629746000
  const startDate = parseLoanDate(apiLoan.open_date)
  const endDateInterval = getIntervalBetweenDates(startDate, parseLoanDate(apiLoan.close_date))
  return {
    id: apiLoan.id.toString(),
    type: 'loan',
    startBalance: getFloatMoneyAmount(apiLoan.agreement_amount),
    title: apiLoan.program_name,
    instrument: apiLoan.currency_code,
    syncID: [apiLoan.id.toString()],
    balance: -getFloatMoneyAmount(apiLoan.total_payment_amount),
    capitalization: true,
    startDate,
    percent: getFloatMoneyAmount(apiLoan.interest_rate),
    endDateOffsetInterval: endDateInterval.interval,
    endDateOffset: endDateInterval.count,
    payoffInterval: parseLoanDate(apiLoan.next_payment_date) - (new Date()).getTime() <= MONTH_MILLISECONDS ? 'month' : 'year',
    payoffStep: 1
  }
}

function parseComment (transaction, apiTransaction, account, invoice) {
  if ([
    /^.*Перевод средств.*$/i,
    /^.*ACCOUNT.*CARD.*$/i,
    /^.*Выдача наличности.*$/i,
    /^.*Внесення готівки.*$/i,
    /^.*Внесение наличных денежных.*$/i
  ].some(regexp => regexp.test(apiTransaction.description))) {
    transaction.comment = apiTransaction.description.match(/([0-9]+; |)(.*)/)[2]
  } else {
    const description = apiTransaction.description.replace(/^(\. \.)/g, '')
    let slicedDescr = description.split(/(.*)[;]{1}[ ]{1}(.*)/)
    if (slicedDescr.length <= 1) {
      slicedDescr = description.split(/(\(.*\)) (.*)/)
    }
    if (slicedDescr.length <= 1) {
      transaction.comment = description.split('. .').join('')
    } else {
      if (slicedDescr[2] !== '') {
        const merchantCode = apiTransaction.merchant_category_data.code
        transaction.merchant = {
          fullTitle: slicedDescr[2],
          mcc: (merchantCode && Number(merchantCode)) || null,
          location: null
        }
      } else {
        transaction.comment = apiTransaction.description.replace(/\s+$/g, '').replace(/^\s+/g, '').replace(/\)$/g, '').replace(/^\(/g, '')
      }
    }
  }
  return false
}

function parseInnerTransfer (transaction, apiTransaction) {
  if (![
    /^.*Переказ між своїми.*$/i
  ].some(regexp => regexp.test(apiTransaction.description))) {
    return false
  }
  transaction.groupKeys = [apiTransaction.source_system_id]
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /^.*Перевод.*$/i,
    /^.*Money Transfer.*$/i,
    /^.*TFR DEBIT.*$/i,
    /^.*ACCOUNT.*TO.*$/i,
    /^.*Master Card Money Send.*$/i
  ].some(regexp => regexp.test(apiTransaction.description))) {
    return false
  }
  transaction.movements.push({
    id: null, // apiTransaction.external_transaction_id.toString(),
    account: {
      type: [/^.*по карте.*$/i,
        /^.*card.*$/i
      ].some(regexp => regexp.test(apiTransaction.description))
        ? 'ccard'
        : null,
      instrument: invoice.instrument,
      company: null,
      syncIds: [/^.*card\*.*$/i
      ].some(regexp => regexp.test(apiTransaction.description))
        ? [apiTransaction.description.split(/^.*CARD\*(\d{4})/i)[1].toString()]
        : null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parseCashTransfer (transaction, apiTransaction, account, invoice) {
  if (![
    /^.*сервис cash to card.*$/i,
    /^.*Выдача наличности.*$/i,
    /^.*Внесення готівки.*$/i,
    /^.*Внесение наличных денежных.*$/i
  ].some(regexp => regexp.test(apiTransaction.description))) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: 'cash',
      instrument: invoice.instrument,
      company: null,
      syncIds: null
    },
    invoice: null,
    sum: -invoice.sum,
    fee: 0
  })
  return true
}

function parsePayee (transaction, apiTransaction) {
  return false
}

function getFloatMoneyAmount (amount) {
  return +(amount * REAL_MONEY_MULTIPLIER).toFixed(2)
}

function parseLoanDate (str) {
  const date = str.split(/(\d{2}).(\d{2}).(\d{4})/)
  return parseDateInTimezone(`${date[3]}-${date[2]}-${date[1]}T00:00:00`, 'Europe/Kiev')
}

export function parseTransactionDate (apiTransaction) {
  const date = apiTransaction.transaction_details.transaction_date.split(/(\d{2}).(\d{2}).(\d{4})T(.*)/)
  return parseDateInTimezone(`${date[3]}-${date[2]}-${date[1]}T${date[4]}`, 'Europe/Kiev')
}

export function parseDateToApiFormat (date) {
  return moment(date).format('DD.MM.YYYYThh:mm:ss')
}
