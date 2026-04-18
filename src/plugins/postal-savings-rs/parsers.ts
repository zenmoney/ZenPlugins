import cheerio from 'cheerio'
import { AccountInfo, AccountTransaction } from './models'
import moment from 'moment'
import { isValidDate } from '../../common/dateUtils'

const exchangeRateRegex = /\d+\.\d+ \w{3} Kurs:.+/

export function parseLoginResult (body: string): boolean {
  // Successful login: response does not contain the login form fields
  // and does not contain error messages
  const hasLoginForm = body.includes('Username_ID') || body.includes('Password_ID')
  const hasError = body.includes('class="error"') || body.includes('field-validation-error')
  return !hasLoginForm && !hasError
}

export function parseAccountInfo (body: string): AccountInfo[] {
  const html = cheerio.load(body)
  const accountsHtml = html('.slide[data-accountnumber]')
  const accounts: AccountInfo[] = []

  // eslint-disable-next-line array-callback-return
  accountsHtml.toArray().map(accountHtml => {
    const $ = cheerio.load(accountHtml)

    const invoiceAccounts: Array<{ currency: string, balance: string | undefined }> = []
    $('option[data-amount]').each((index, element) => {
      const currency = $(element).attr('value')?.trim() ?? $(element).text().trim()
      const balance = $(element).attr('data-amount')
      invoiceAccounts.push({ currency, balance })
    })

    const accountNumber = (accountHtml as cheerio.TagElement).attribs['data-accountnumber']?.trim() ?? ''
    const cardNumber = (accountHtml as cheerio.TagElement).attribs['data-cardnumber']?.trim() ??
      (accountHtml as cheerio.TagElement).attribs['data-cardno']?.trim() ?? ''

    for (const invoiceAccount of invoiceAccounts) {
      const account = {
        id: invoiceAccounts.length > 1 ? accountNumber + invoiceAccount.currency : accountNumber,
        cardNumber,
        accountNumber,
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        name: $('.acc-name').text().trim() || $('.acc-nr').text().trim(),
        currency: invoiceAccount.currency,
        balance: invoiceAccount.balance !== undefined
          ? parseFloat(invoiceAccount.balance.replace(/\./g, '').replace(',', '.'))
          : 0
      }
      accounts.push(account)
    }
  })
  return accounts
}

export function parseRequestVerificationToken (body: string): string {
  const html = cheerio.load(body)
  const token = html('input[name="__RequestVerificationToken"]').val()

  return token
}

export function parseTransactions (body: string, fromDate: Date): AccountTransaction[] {
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
      date: isValidDate(date) ? date : fromDate,
      address,
      amount: direction * Number(amount.replace(/,/g, '')),
      currency,
      description
    }
  })
}
