import { load } from 'cheerio'

export function convertAccount (account) {
  return {
    id: account.id,
    title: account.title,
    type: 'ccard',
    instrument: account.currency,
    balance: account.balance,
    syncIds: [
      account.id
    ]
  }
}

export function convertTransaction (apiTransaction, account) {
  const invoice = parseAmount(apiTransaction.tranAmount)
  const merchant = apiTransaction.contragentName.match(/KASPI BANK/i)
    ? null
    : {
        country: null,
        city: null,
        location: null,
        title: apiTransaction.contragentName,
        mcc: null,
        category: Number(apiTransaction.knp)
      }

  return {
    hold: apiTransaction.status !== 'OK',
    date: getDate(apiTransaction.tranDate),
    movements: [
      {
        id: apiTransaction.tranId,
        account: { id: account.id },
        invoice: invoice.instrument === account.instrument ? null : invoice,
        sum: invoice.instrument === account.instrument ? invoice.sum : null,
        fee: 0
      }
    ],
    merchant,
    comment: apiTransaction.purpose
  }
}

const getDate = (date) => {
  const [day, month, year, hour, minute, second] = date.match(/(\d{2}).(\d{2}).(\d{2}) (\d{2}):(\d{2}):(\d{2})/).slice(1)
  return new Date(`20${year}-${month}-${day}T${hour}:${minute}:${second}+06:00`)
}

function parseAmount (sumInstrument) {
  const match = sumInstrument.match(/([\d\s,-]+)\s(.+)/)
  let instrument = match[2]
  switch (instrument) {
    case '₸':
      instrument = 'KZT'
      break
    case '$':
      instrument = 'USD'
      break
    case '€':
      instrument = 'EUR'
      break
    case '£':
      instrument = 'GBP'
      break
    case '₽':
      instrument = 'RUB'
      break
  }
  return {
    sum: parseFloat(match[1].replace(/\s/g, '').replace(',', '.')),
    instrument: instrument
  }
}

export function parseAccounts (html) {
  const accounts = []
  const $ = load(html)
  $('a[id="hlAccountDetails"]').each((i, el) => {
    const accountId = $(el).attr('href').split('/')[1]
    const accountBallanceCurrency = $(el).find('span').text().trim()
    const accountBallance = parseAmount(accountBallanceCurrency).sum
    const accountCurrency = parseAmount(accountBallanceCurrency).instrument
    const accountTitle = $(el).find('div[class="account-widget-item-number"]').text().trim()
    const account = {
      id: accountId,
      balance: accountBallance,
      currency: accountCurrency,
      title: accountTitle
    }
    accounts.push(account)
  })
  return accounts
}
