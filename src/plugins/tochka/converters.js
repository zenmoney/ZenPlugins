import { isNumber } from 'lodash'
import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (apiAccount, apiBalances) {
  console.assert(apiAccount.accountId, 'incorrect API account structure', apiAccount)

  const balance = apiBalances.find(item => item.type === 'ClosingAvailable')
  console.assert(isNumber(balance.Amount?.amount) && balance.Amount?.currency, 'incorrect API account balance structure', apiBalances)

  return {
    id: apiAccount.accountId,
    type: 'checking',
    title: apiAccount.accountDetails.find(item => item.schemeName === 'RU.CBR.AccountNumber')?.name || apiAccount.accountId,
    balance: balance.Amount.amount,
    instrument: balance.Amount.currency,
    syncID: [apiAccount.accountId]
  }
}

export function convertTransactionNew (apiTransaction, account) {
  console.assert(account.instrument === apiTransaction.Amount.currency, 'unexpected currency transaction', apiTransaction, account)

  const dc = apiTransaction.creditDebitIndicator === 'Debit' ? -1.0 : 1.0
  const transaction = {
    hold: null,
    date: new Date(apiTransaction.documentProcessDate),
    movements: [
      {
        id: apiTransaction.transactionId,
        account: { id: account.id },
        invoice: null,
        sum: dc * apiTransaction.Amount.amount,
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  }
  ;[
    // parseBreak,
    parseInnerTransferNew,
    parseOuterTransfer,
    parseCashTransfer,
    parsePurchase,
    parseSbp,
    parseDescription
  ].some(parser => parser(transaction, apiTransaction, account))

  return transaction
}
/*
function parseBreak (transaction, apiTransaction) {
  if (apiTransaction.description.startsWith('P2P Перевод')) {
    return true
  }
  return false
}
*/
function parseInnerTransferNew (transaction, apiTransaction) {
  if ([
    /^Перевод личных средств/
  ].some(regexp => apiTransaction.description.match(regexp))) {
    transaction.groupKeys = [transaction.movements[0].id]
    return true
  }
  return false
}

function parseCashTransfer (transaction, apiTransaction, account) {
  if ([
    /наличных денег в банкомате/i
  ].some(regexp => apiTransaction.description.match(regexp))) {
    transaction.movements.push({
      id: null,
      account: {
        company: null,
        instrument: account.instrument,
        syncIds: null,
        type: 'cash'
      },
      invoice: null,
      sum: -transaction.movements[0].sum,
      fee: 0
    })
    // return false
  }
  return false
}

function parsePurchase (transaction, apiTransaction) {
  if ([
    /^Покупка товара/i,
    /^Выдача наличных/i
  ].some(regexp => apiTransaction.description.match(regexp))) {
    const match = apiTransaction.description.match(/^[^(]+\(Терминал:\s*(.+?)\s*,дата операции/)
    if (match) {
      const parts = match[1].split(',')
      let merchant = null
      if (parts.length >= 3) {
        merchant = {
          country: parts[parts.length - 1].trim() || null,
          city: parts[parts.length - 2].trim() || null,
          title: parts[0].trim() !== '' ? parts[0].trim() : parts[1].trim(),
          mcc: null,
          location: null
        }
      } else {
        merchant = {
          fullTitle: match[1],
          mcc: null,
          location: null
        }
      }
      transaction.merchant = merchant
    }
    return true
  }
  if (apiTransaction.transactionTypeCode === 'Платежное поручение') {
    const title = apiTransaction.creditDebitIndicator === 'Debit' ? apiTransaction.CreditorParty.name : apiTransaction.DebtorParty.name
    transaction.merchant = title
      ? {
          city: null,
          country: null,
          location: null,
          mcc: null,
          title
        }
      : null
    return true
  }
  return false
}

function parseSbp (transaction, apiTransaction, account) {
  if (!apiTransaction.description.startsWith('Перевод по номеру')) {
    return false
  }
  const match = apiTransaction.description.match(/Получатель:?\s+(.+?) через СБП(.*Сообщение получателю:?\s+(.*))?/)
  if (match) {
    transaction.merchant = {
      fullTitle: match[1],
      mcc: null,
      location: null
    }
    transaction.comment = match[3] ? match[3] : null
  }
  transaction.movements.push({
    id: null,
    account: {
      company: null,
      instrument: account.instrument,
      syncIds: null,
      type: 'ccard'
    },
    invoice: null,
    sum: -transaction.movements[0].sum,
    fee: 0
  })
  return true
}

function parseDescription (transaction, apiTransaction) {
  transaction.comment = apiTransaction.description
}

export function convertTransaction (apiTransaction, account) {
  let dateStr
  let invoice
  const match = apiTransaction.payment_purpose.match(/дата операции:(.+),на сумму:(.+),карт/)
  if (match) {
    const [, day, month, year, time] = match[1].match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})/)
    dateStr = `${year}-${month}-${day}T${time}:00+03:00`
    const invoiceStr = match[2].trim()
    ;[
      /^([.\d]+)\s*([A-Z]{3})$/,
      /^([.\d]+)\s*\((.*)\)$/,
      /^([.\d]+)\s*(\d{3})$/
    ].some(regexp => {
      const invoiceMatch = invoiceStr.match(regexp)
      if (invoiceMatch) {
        invoice = {
          sum: Math.sign(apiTransaction.payment_amount) * Math.abs(parseFloat(invoiceMatch[1])),
          instrument: codeToCurrencyLookup[invoiceMatch[2]] || invoiceMatch[2]
        }
      } else {
        invoice = {
          sum: parseFloat(apiTransaction.payment_amount),
          instrument: account.instrument
        }
      }
      return invoiceMatch
    })
    console.assert(invoice, 'unexpected invoice str', invoiceStr)
  } else {
    const [, day, month, year] = apiTransaction.payment_date.match(/(\d{2})\.(\d{2})\.(\d{4})/)
    dateStr = `${year}-${month}-${day}T00:00:00+03:00`
    invoice = {
      sum: parseFloat(apiTransaction.payment_amount),
      instrument: account.instrument
    }
  }
  const transaction = {
    hold: false,
    date: new Date(dateStr),
    movements: [
      {
        id: apiTransaction.payment_bank_system_id,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: parseFloat(apiTransaction.payment_amount),
        fee: 0
      }
    ],
    merchant: null,
    comment: null
  };
  [
    parseInnerTransfer,
    parsePayee,
    parseOuterTransfer,
    parseComment
  ].some(parser => parser(transaction, apiTransaction, account, invoice))
  return transaction
}

function parseInnerTransfer (transaction, apiTransaction) {
  if (![
    /^Перевод средств с транзитного/,
    /^Перевод средств в счёт накоплений/,
    /^Перевод средств на сейф-счёт/,
    /^Продажа [A-Z]{3} за [A-Z]{3}/
  ].some(regexp => apiTransaction.payment_purpose.match(regexp))) {
    return false
  }
  transaction.groupKeys = [transaction.movements[0].id]
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account) {
  const isCard2Card = [
    /Card2Card/
  ].some(regexp => apiTransaction.payment_purpose?.match(regexp) || apiTransaction.description?.match(regexp))
  if (isCard2Card || [
    /^Перевод собственных средств/
  ].some(regexp => apiTransaction.payment_purpose?.match(regexp))) {
    const descriptionMatch = apiTransaction.description?.match(/дата операции:([\d/\s:]+).*карта\s([\d*]+)/)
    let syncIds = null
    let dateStr
    if (descriptionMatch) {
      syncIds = [descriptionMatch[2]] || null
      const [, day, month, year, time] = descriptionMatch[1].match(/(\d{2})\/(\d{2})\/(\d{4})\s+([\d:]+)/)
      dateStr = `${year}-${month}-${day}T${time}:00+03:00`
      transaction.date = new Date(dateStr)
    }
    transaction.movements.push({
      id: null,
      account: {
        type: isCard2Card ? 'ccard' : null,
        instrument: account.instrument,
        company: null,
        syncIds
      },
      invoice: null,
      sum: -transaction.movements[0].sum,
      fee: 0
    })
    if (isCard2Card) {
      transaction.merchant = null
    }
    return true
  }
  return false
}

function parsePayee (transaction, apiTransaction) {
  const match = apiTransaction.payment_purpose.match(/^[^(]+\(Терминал:\s*(.+)\s*,дата операции/)
  if (match) {
    const parts = match[1].split(',')
    if (parts.length >= 3) {
      transaction.merchant = {
        country: parts[parts.length - 1].trim() || null,
        city: parts[parts.length - 2].trim() || null,
        title: parts[0].trim(),
        mcc: null,
        location: null
      }
      return false
    }
    if (apiTransaction.payment_purpose.match(/^Возврат/)) {
      transaction.merchant = {
        fullTitle: match[1].trim(),
        mcc: null,
        location: null
      }
      return false
    }
  }
  if (![
    /Филиал Точка/i,
    /Открытие/i
  ].some(regexp => apiTransaction.counterparty_name.match(regexp))) {
    transaction.merchant = {
      country: null,
      city: null,
      title: apiTransaction.counterparty_name,
      mcc: null,
      location: null
    }
  }
  return false
}

function parseComment (transaction, apiTransaction, account, invoice) {
  if (!apiTransaction.payment_purpose.match(/^[^(]+\(Терминал:\s*(.+)\s*,дата операции/)) {
    transaction.comment = apiTransaction.payment_purpose.trim()
  }
}
