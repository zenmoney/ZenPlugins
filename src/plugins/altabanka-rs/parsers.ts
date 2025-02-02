import cheerio from 'cheerio'
import { AccountInfo, AccountTransaction } from './types'
import moment from 'moment'

const exchangeRateRegex = /\d+\.\d+ \w{3} Kurs:.+/

export function parseLoginResult (body: string): boolean {
  return body.includes('location.href = action;')
}

export function parseAccountInfo (body: string): AccountInfo[] {
  const html = cheerio.load(body)
  const accountsHtml = html('#account-slider').find('.slide')

  return accountsHtml.toArray().map(accountHtml => {
    const html = cheerio.load(accountHtml)

    return {
      id: (accountHtml as cheerio.TagElement).attribs['data-accountnumber'].trim(),
      cardNumber: (accountHtml as cheerio.TagElement).attribs['data-cardno'].trim(),
      accountNumber: (accountHtml as cheerio.TagElement).attribs['data-accno'].trim(),
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      name: html('.acc-name').text().trim() || html('.acc-nr').text().trim(),
      currency: html('.main-balance option').text().trim(),
      balance: parseFloat(html('.main-balance option').data('amount')?.replace('.', '')?.replace(',', '.'))
    }
  })
}

export function parseRequestVerificationToken (body: string): string {
  const html = cheerio.load(body)
  const token = html('input[name="__RequestVerificationToken"]').val()

  return token
}

export function parseTransactions (body: string): AccountTransaction[] {
  const html = cheerio.load(body)
  const transactionsHtml = html('#transaction-view-content').find('.pageable-content')

  return transactionsHtml.toArray().map(transactionHtml => {
    const html = cheerio.load(transactionHtml)

    const transactionHref = (transactionHtml as cheerio.TagElement).attribs['data-href'].trim()
    const queryParams = transactionHref.split('?')[1]
    const params = queryParams.split('&').reduce<Record<string, string>>((acc, param) => {
      const [key, value] = param.split('=')
      acc[key] = value
      return acc
    }, {})

    const [dateHtml, , descriptionHtml, amountHtml] = html('div').children('div').toArray()

    const direction = cheerio.load(dateHtml)('div.tag').hasClass('up') ? -1 : 1
    const date = moment(cheerio.load(dateHtml)('p').text()?.trim(), 'DD.MM.YYYY').toDate()
    let address = cheerio.load(descriptionHtml)('span').text()?.trim().replace(/ {2}/g, '').replace('Kartica: ', '')
    const [amount, currency] = cheerio.load(amountHtml)('p').text().trim().split(' ') ?? []

    const description = address?.match(exchangeRateRegex)?.[0] ?? ''
    address = address?.replace(description ?? '', '').trim()

    return {
      id: 'id_' + params.q,
      date,
      address,
      amount: direction * Number(amount.replace(/,/g, '')),
      currency,
      description
    }
  })
}
