import codeToCurrencyLookup from '../../common/codeToCurrencyLookup'

export function convertAccount (apiAccount) {
  return {
    id: apiAccount.code,
    type: 'checking',
    title: apiAccount.code,
    instrument: parseInstrument(apiAccount.code),
    syncID: [apiAccount.code]
  }
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

function parseInstrument (accountNumber) {
  return codeToCurrencyLookup[accountNumber.substr(5, 3)]
}

function parseInnerTransfer (transaction, apiTransaction) {
  if (![
    /^Перевод средств с транзитного/,
    /^Продажа [A-Z]{3} за [A-Z]{3}/
  ].some(regexp => apiTransaction.payment_purpose.match(regexp))) {
    return false
  }
  transaction.groupKeys = [transaction.movements[0].id]
  return true
}

function parseOuterTransfer (transaction, apiTransaction, account) {
  const isCard2Card = [
    /TOCHKA Card2Card/
  ].some(regexp => apiTransaction.payment_purpose.match(regexp))
  if (!isCard2Card && ![
    /^Перевод собственных средств/
  ].some(regexp => apiTransaction.payment_purpose.match(regexp))) {
    return false
  }
  transaction.movements.push({
    id: null,
    account: {
      type: isCard2Card ? 'ccard' : null,
      instrument: account.instrument,
      company: null,
      syncIds: null
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
